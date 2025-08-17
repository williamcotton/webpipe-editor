import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FlowNodeData } from '../../types';

interface PipelineNodeProps extends NodeProps {
  data: FlowNodeData;
}

export const PipelineNode = memo<PipelineNodeProps>(({ data, selected }) => {
  const { pipelineInfo } = data;

  if (!pipelineInfo) {
    return null;
  }

  return (
    <div style={{
      width: '350px',
      backgroundColor: selected ? '#404040' : '#1e1e1e',
      border: selected ? '2px solid #0e639c' : '1px solid #3e3e42',
      borderRadius: '8px',
      overflow: 'hidden',
      fontSize: '14px',
      boxShadow: selected ? '0 0 0 1px #0e639c' : '0 2px 8px rgba(0,0,0,0.3)',
      position: 'relative',
      zIndex: selected ? 1000 : 100
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#2d2d30',
        borderRadius: '8px',
        color: '#cccccc',
        display: 'flex',
      }}>
        <span style={{
          fontSize: '12px',
          color: '#ffffff'
        }}>
          Pipeline: {pipelineInfo.name}
        </span>
      </div>

      {/* Output Handle */}
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
    </div>
  );
});

PipelineNode.displayName = 'PipelineNode';