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
    <div className="instance-dropdown">
      <div className="instance-header">
        <label className="instance-label">
          Running Instances ({instances.length})
        </label>
        <button
          onClick={refreshInstances}
          disabled={isLoading}
          className="instance-refresh"
        >
          {isLoading ? '⟳' : '↻'}
        </button>
      </div>

      {instances.length === 0 ? (
        <div className="instance-empty">No running instances found</div>
      ) : (
        <div className="instance-select-wrapper">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="instance-select"
          >
            <span>Select instance...</span>
            <span className={`caret ${isOpen ? 'open' : ''}`}>▼</span>
          </button>

          {isOpen && (
            <div className="instance-list">
              {instances.map((instance, index) => (
                <div
                  key={`${instance.pid}-${index}`}
                  onClick={() => handleInstanceSelect(instance)}
                  className="instance-item"
                >
                  <div>
                    <div className="instance-name">{getInstanceLabel(instance)}</div>
                    <div className="instance-meta">
                      PID: {instance.pid} | URL: {buildServerUrlFromInstance(instance)}
                    </div>
                    {instance.workingDir && (
                      <div className="instance-path">Working Dir: {instance.workingDir}</div>
                    )}
                    {instance.fullPath && (
                      <div className="instance-path">Full Path: {instance.fullPath}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {onJumpToCursorChange && (
        <div className="jump-to-cursor">
          <input
            type="checkbox"
            id="jump-to-cursor"
            checked={jumpToCursor}
            onChange={(e) => onJumpToCursorChange(e.target.checked)}
          />
          <label htmlFor="jump-to-cursor">Jump To Cursor</label>
        </div>
      )}
    </div>
  );
};
