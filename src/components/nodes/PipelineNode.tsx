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
    <div className={`pipeline-node ${selected ? 'selected' : ''}`}>
      {/* Header */}
      <div className="pipeline-node-header">
        <span className="pipeline-node-title">
          Pipeline: {pipelineInfo.name}
        </span>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="pipeline-node-handle"
      />
    </div>
  );
});

PipelineNode.displayName = 'PipelineNode';
