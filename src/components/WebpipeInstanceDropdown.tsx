import React, { useState, useEffect } from 'react';
import { WebpipeInstance, getRunningWebpipeInstances, buildServerUrlFromInstance } from '../utils/processUtils';

interface WebpipeInstanceDropdownProps {
  onInstanceSelect: (instance: WebpipeInstance) => void;
  onOpenFile: (filePath: string) => void;
  jumpToCursor?: boolean;
  onJumpToCursorChange?: (enabled: boolean) => void;
}

export const WebpipeInstanceDropdown: React.FC<WebpipeInstanceDropdownProps> = ({
  onInstanceSelect,
  onOpenFile,
  jumpToCursor = false,
  onJumpToCursorChange
}) => {
  const [instances, setInstances] = useState<WebpipeInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const refreshInstances = async () => {
    setIsLoading(true);
    try {
      const runningInstances = await getRunningWebpipeInstances();
      setInstances(runningInstances);
    } catch (error) {
      console.error('Failed to get webpipe instances:', error);
      setInstances([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshInstances();
  }, []);

  const handleInstanceSelect = (instance: WebpipeInstance) => {
    onInstanceSelect(instance);
    // Automatically open the file when instance is selected
    const pathToOpen = instance.fullPath || instance.filePath;
    onOpenFile(pathToOpen);
    setIsOpen(false);
  };

  const getInstanceLabel = (instance: WebpipeInstance) => {
    const fileName = instance.filePath.split('/').pop() || instance.filePath;
    const port = instance.port ? `:${instance.port}` : '';
    return `${fileName}${port}`;
  };

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '4px'
      }}>
        <label style={{ color: '#cccccc', fontSize: '11px' }}>
          Running Instances ({instances.length})
        </label>
        <button
          onClick={refreshInstances}
          disabled={isLoading}
          style={{
            background: 'none',
            border: '1px solid #3e3e42',
            borderRadius: '3px',
            color: '#cccccc',
            fontSize: '10px',
            padding: '2px 6px',
            cursor: 'pointer'
          }}
        >
          {isLoading ? '⟳' : '↻'}
        </button>
      </div>
      
      {instances.length === 0 ? (
        <div style={{
          color: '#888',
          fontSize: '11px',
          fontStyle: 'italic',
          padding: '6px 8px',
          backgroundColor: '#1e1e1e',
          border: '1px solid #3e3e42',
          borderRadius: '3px'
        }}>
          No running instances found
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              width: '100%',
              padding: '6px 8px',
              backgroundColor: '#1e1e1e',
              border: '1px solid #3e3e42',
              borderRadius: '3px',
              color: '#cccccc',
              fontSize: '12px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>Select instance...</span>
            <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
          </button>
          
          {isOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#1e1e1e',
              border: '1px solid #3e3e42',
              borderTop: 'none',
              borderRadius: '0 0 3px 3px',
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {instances.map((instance, index) => (
                <div
                  key={`${instance.pid}-${index}`}
                  onClick={() => handleInstanceSelect(instance)}
                  style={{
                    padding: '8px',
                    cursor: 'pointer',
                    borderBottom: index < instances.length - 1 ? '1px solid #3e3e42' : 'none',
                    backgroundColor: '#1e1e1e'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2d2d30';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1e1e1e';
                  }}
                >
                  <div>
                    <div style={{ color: '#cccccc', fontSize: '12px', fontWeight: 'bold' }}>
                      {getInstanceLabel(instance)}
                    </div>
                    <div style={{ color: '#888', fontSize: '10px' }}>
                      PID: {instance.pid} | URL: {buildServerUrlFromInstance(instance)}
                    </div>
                    {instance.workingDir && (
                      <div style={{ color: '#666', fontSize: '9px' }}>
                        Working Dir: {instance.workingDir}
                      </div>
                    )}
                    {instance.fullPath && (
                      <div style={{ color: '#666', fontSize: '9px' }}>
                        Full Path: {instance.fullPath}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Jump To Cursor Checkbox */}
      {onJumpToCursorChange && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginTop: '8px',
          padding: '4px 0'
        }}>
          <input
            type="checkbox"
            id="jump-to-cursor"
            checked={jumpToCursor}
            onChange={(e) => onJumpToCursorChange(e.target.checked)}
            style={{
              marginRight: '6px',
              accentColor: '#0e639c'
            }}
          />
          <label 
            htmlFor="jump-to-cursor"
            style={{ 
              color: '#cccccc', 
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Jump To Cursor
          </label>
        </div>
      )}
    </div>
  );
};