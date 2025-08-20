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
    <div className={`flow-node-base pipeline-node overflow-hidden ${selected ? 'selected' : ''}`}>
      {/* Header */}
      <div className="flow-node-header standard">
        <span className="flow-node-title">
          Pipeline: {pipelineInfo.name}
        </span>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="flow-node-handle default output-bottom"
      />
    </div>
  );
});

PipelineNode.displayName = 'PipelineNode';
