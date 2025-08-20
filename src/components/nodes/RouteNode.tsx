import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FlowNodeData } from '../../types';

interface RouteNodeProps extends NodeProps {
  data: FlowNodeData;
}

export const RouteNode = memo<RouteNodeProps>(({ data, selected }) => {
  const { routeInfo } = data;

  if (!routeInfo) {
    return null;
  }

  return (
    <div className={`flow-node-base route-node overflow-hidden ${selected ? 'selected' : ''}`}>
      {/* Header */}
      <div className="flow-node-header standard">
        <span className="flow-node-title">
          {routeInfo.method} {routeInfo.path}
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

RouteNode.displayName = 'RouteNode';
