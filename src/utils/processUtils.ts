export interface WebpipeInstance {
  pid: number;
  filePath: string;
  fullPath?: string;
  workingDir?: string;
  port?: number;
  command: string;
}

export const getRunningWebpipeInstances = async (): Promise<WebpipeInstance[]> => {
  if (!window.electronAPI) {
    return [];
  }

  try {
    // Get running webpipe processes
    const psOutput = await window.electronAPI.executeCommand('ps aux | grep ".wp"');
    
    // Get listening ports
    const lsofOutput = await window.electronAPI.executeCommand('lsof -i -P -n | grep LISTEN');
    
    const instances: WebpipeInstance[] = [];
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
        
        instances.push({
          pid,
          filePath,
          fullPath,
          workingDir,
          port,
          command
        });
      }
    }
    
    return instances;
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