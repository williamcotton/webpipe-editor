import { memo, useMemo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FlowNodeData } from '../../types';

interface ResultNodeProps extends NodeProps {
  data: FlowNodeData;
}

export const ResultNode = memo<ResultNodeProps>(({ data, selected }) => {
  const { step } = data;
  const branches = step.branches || [];
  
  // Calculate dynamic height based on number of branches
  const contentHeight = useMemo(() => {
    // Base height for header and padding
    const baseHeight = 60;
    // Height per branch item (including padding and margins)
    const branchHeight = 42;
    // Minimum height when no branches
    const minHeight = baseHeight + 40;
    
    if (branches.length === 0) {
      return minHeight;
    }
    
    return baseHeight + (branches.length * branchHeight) + 20; // 20px for bottom padding
  }, [branches.length]);

  return (
    <div 
      className={`result-node ${selected ? 'selected' : ''}`}
      style={{ height: `${contentHeight}px` }}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="result-node-handle-input"
      />

      {/* Header */}
      <div className="result-node-header">
        result
      </div>

      {/* Branch Info */}
      <div className="result-node-branch-info">
        <div className="result-node-branch-count">
          {branches.length} Branch{branches.length !== 1 ? 'es' : ''}
        </div>
        
        {branches.map((branch, index) => (
          <div
            key={branch.id}
            className="result-node-branch-item"
          >
            <span className="result-node-branch-type">
              {branch.branchType}
            </span>
            <span className="result-node-step-count">
              {branch.steps.length} step{branch.steps.length !== 1 ? 's' : ''}
            </span>
            
            {/* Handle positioned directly on this branch item */}
            <Handle
              type="source"
              position={Position.Right}
              id={`branch-${index}`}
              className="result-node-handle-branch"
            />
          </div>
        ))}
      </div>

      {/* Default output handle if no branches */}
      {branches.length === 0 && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="output"
          className="result-node-handle-output"
        />
      )}
    </div>
  );
});

ResultNode.displayName = 'ResultNode';