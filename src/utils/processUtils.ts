export interface WebpipeInstance {
  pid: number;
  filePath: string;
  fullPath?: string;
  workingDir?: string;
  port?: number;
  command: string;
  containerInfo?: {
    containerId: string;
    containerName: string;
    image: string;
  };
}

const getDockerWebpipeInstances = async (): Promise<WebpipeInstance[]> => {
  if (!window.electronAPI) {
    return [];
  }

  try {
    // Get running Docker containers
    const dockerPsOutput = await window.electronAPI.executeCommand('docker ps --format "{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Ports}}"');
    const instances: WebpipeInstance[] = [];
    
    const containerLines = dockerPsOutput.split('\n').filter(line => line.trim());
    
    for (const line of containerLines) {
      const [containerId, containerName, image, ports] = line.split('\t');
      
      if (!containerId || containerId === 'CONTAINER') continue;
      
      try {
        // Check for webpipe processes inside this container
        const containerPsOutput = await window.electronAPI.executeCommand(`docker exec ${containerId} ps aux 2>/dev/null || echo ""`);
        
        if (!containerPsOutput.trim()) continue;
        
        const containerProcesses = containerPsOutput.split('\n');
        
        for (const processLine of containerProcesses) {
          if (processLine.includes('.wp') && !processLine.includes('grep')) {
            const parts = processLine.trim().split(/\s+/);
            if (parts.length < 11) continue;
            
            const pid = parseInt(parts[1]);
            const command = parts.slice(10).join(' ');
            const wpMatch = command.match(/(\S+\.wp)/);
            
            if (wpMatch && !isNaN(pid)) {
              const filePath = wpMatch[1];
              
              // Extract port from Docker ports mapping
              let port: number | undefined;
              const portMatch = ports.match(/(\d+)->\d+\/tcp/);
              if (portMatch) {
                port = parseInt(portMatch[1]);
              }
              
              // Get container working directory and map to host path
              let workingDir: string | undefined;
              let fullPath: string | undefined;
              let containerPath: string | undefined;
              
              try {
                // Get working directory inside container
                const pwdOutput = await window.electronAPI.executeCommand(`docker exec ${containerId} pwdx ${pid} 2>/dev/null || echo ""`);
                const pwdMatch = pwdOutput.match(/\d+:\s*(.+)/);
                if (pwdMatch) {
                  workingDir = pwdMatch[1].trim();
                  containerPath = filePath.startsWith('/') ? filePath : `${workingDir}/${filePath}`;
                } else {
                  // Fallback: try to get working directory from /proc
                  const procOutput = await window.electronAPI.executeCommand(`docker exec ${containerId} readlink /proc/${pid}/cwd 2>/dev/null || echo ""`);
                  if (procOutput.trim()) {
                    workingDir = procOutput.trim();
                    containerPath = filePath.startsWith('/') ? filePath : `${workingDir}/${filePath}`;
                  }
                }
                
                // Get volume mounts to map container path to host path
                if (containerPath) {
                  const inspectOutput = await window.electronAPI.executeCommand(`docker inspect ${containerId} --format='{{json .Mounts}}'`);
                  const mounts = JSON.parse(inspectOutput);
                  
                  // Find matching mount for the container path
                  for (const mount of mounts) {
                    if (containerPath.startsWith(mount.Destination)) {
                      // Map container path to host path
                      const relativePath = containerPath.substring(mount.Destination.length);
                      fullPath = mount.Source + relativePath;
                      break;
                    }
                  }
                  
                  // If no mount mapping found, keep container path for reference
                  if (!fullPath) {
                    fullPath = containerPath;
                  }
                }
              } catch (error) {
                console.warn(`Failed to get working directory for container PID ${pid}:`, error);
              }
              
              instances.push({
                pid,
                filePath,
                fullPath,
                workingDir,
                port,
                command,
                containerInfo: {
                  containerId: containerId.substring(0, 12),
                  containerName,
                  image
                }
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to check container ${containerId}:`, error);
      }
    }
    
    return instances;
  } catch (error) {
    console.error('Failed to get Docker webpipe instances:', error);
    return [];
  }
};

export const getRunningWebpipeInstances = async (): Promise<WebpipeInstance[]> => {
  if (!window.electronAPI) {
    return [];
  }

  try {
    // Get running webpipe processes from host
    const psOutput = await window.electronAPI.executeCommand('ps aux | grep ".wp"');
    
    // Get listening ports
    const lsofOutput = await window.electronAPI.executeCommand('lsof -i -P -n | grep LISTEN');
    
    const hostInstances: WebpipeInstance[] = [];
    const lines = psOutput.split('\n');
    
    // Parse lsof output to create PID -> port mapping
    const pidToPort = new Map<number, number>();
    const lsofLines = lsofOutput.split('\n');
    for (const line of lsofLines) {
      // lsof output format: COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 9) {
        const pid = parseInt(parts[1]);
        const nameField = parts[8]; // e.g., "*:9080 (LISTEN)"
        const portMatch = nameField.match(/:(\d+)/);
        if (portMatch && !isNaN(pid)) {
          pidToPort.set(pid, parseInt(portMatch[1]));
        }
      }
    }
    
    for (const line of lines) {
      // Skip grep process itself and empty lines
      if (line.includes('grep') || !line.trim()) continue;
      
      // Parse ps output format: user pid %cpu %mem vsz rss tty stat start time command
      const parts = line.trim().split(/\s+/);
      if (parts.length < 11) continue;
      
      const pid = parseInt(parts[1]);
      const command = parts.slice(10).join(' ');
      
      // Look for webpipe processes with .wp files
      const wpMatch = command.match(/(\S+\.wp)/);
      if (wpMatch && !isNaN(pid)) {
        const filePath = wpMatch[1];
        const port = pidToPort.get(pid);
        
        // Get working directory and full path for the process
        let workingDir: string | undefined;
        let fullPath: string | undefined;
        
        try {
          // Get working directory using lsof
          const cwdOutput = await window.electronAPI.executeCommand(`lsof -p ${pid} | grep cwd`);
          const cwdMatch = cwdOutput.match(/cwd\s+DIR\s+\S+\s+\S+\s+\S+\s+(.+)/);
          if (cwdMatch) {
            workingDir = cwdMatch[1].trim();
            
            // Resolve full path
            if (filePath.startsWith('/')) {
              fullPath = filePath; // Already absolute
            } else {
              fullPath = `${workingDir}/${filePath}`;
            }
          }
        } catch (error) {
          console.warn(`Failed to get working directory for PID ${pid}:`, error);
        }
        
        hostInstances.push({
          pid,
          filePath,
          fullPath,
          workingDir,
          port,
          command
        });
      }
    }
    
    // Get Docker instances
    const dockerInstances = await getDockerWebpipeInstances();
    
    // Combine host and Docker instances
    return [...hostInstances, ...dockerInstances];
  } catch (error) {
    console.error('Failed to get running webpipe instances:', error);
    return [];
  }
};

export const getPortFromWebpipeInstance = (instance: WebpipeInstance): number => {
  // Default webpipe port is 9080
  return instance.port || 9080;
};

export const buildServerUrlFromInstance = (instance: WebpipeInstance): string => {
  const port = getPortFromWebpipeInstance(instance);
  return `http://127.0.0.1:${port}`;
};

export const jumpToCursorEditor = async (filePath: string, lineNumber?: number): Promise<void> => {
  if (!window.electronAPI) {
    console.error('Electron API not available');
    return;
  }

  try {
    const line = lineNumber || 1;
    const column = 1;
    const command = `cursor -r -g "${filePath}:${line}:${column}"`;
    
    await window.electronAPI.executeCommand(command);
    console.log(`Opened ${filePath}:${line}:${column} in Cursor`);
  } catch (error) {
    console.error('Failed to open file in Cursor:', error);
  }
};