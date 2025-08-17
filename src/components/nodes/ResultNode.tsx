import React, { memo, useMemo } from 'react';
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
    <div style={{
      width: '350px',
      height: `${contentHeight}px`,
      backgroundColor: selected ? '#404040' : '#1e1e1e',
      border: selected ? '2px solid #0e639c' : '1px solid #3e3e42',
      borderRadius: '12px',
      overflow: 'hidden',
      fontSize: '12px',
      boxShadow: selected ? '0 0 0 1px #0e639c' : '0 2px 8px rgba(0,0,0,0.3)',
      position: 'relative'
    }}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#666',
          border: '2px solid #1e1e1e',
          top: '3px',
          left: '50%',
          transform: 'translateX(-50%)',
          position: 'absolute'
        }}
      />

      {/* Header */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#2d2d30',
        borderBottom: '1px solid #3e3e42',
        color: '#cccccc'
      }}>
        result
      </div>

      {/* Branch Info */}
      <div style={{
        padding: '16px',
        backgroundColor: '#252526',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{
          color: '#cccccc',
          fontSize: '11px',
          marginBottom: '8px'
        }}>
          {branches.length} Branch{branches.length !== 1 ? 'es' : ''}
        </div>
        
        {branches.map((branch, index) => (
          <div
            key={branch.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              backgroundColor: '#1e1e1e',
              borderRadius: '4px',
              border: '1px solid #3e3e42',
              position: 'relative'
            }}
          >
            <span style={{ color: '#cccccc', fontSize: '10px' }}>
              {branch.branchType}
            </span>
            <span style={{
              fontSize: '9px',
              backgroundColor: '#0e639c',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '3px'
            }}>
              {branch.steps.length} step{branch.steps.length !== 1 ? 's' : ''}
            </span>
            
            {/* Handle positioned directly on this branch item */}
            <Handle
              type="source"
              position={Position.Right}
              id={`branch-${index}`}
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: '#0e639c',
                border: '2px solid #1e1e1e',
                right: '-17px', // Position outside the main node container
                top: '50%',
                transform: 'translateY(-50%)',
                position: 'absolute'
              }}
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
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: '#666',
            border: '2px solid #1e1e1e',
            bottom: '3px',
            left: '50%',
            transform: 'translateX(-50%)',
            position: 'absolute'
          }}
        />
      )}
    </div>
  );
});

ResultNode.displayName = 'ResultNode';