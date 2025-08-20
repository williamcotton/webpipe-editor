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
    <div className={`route-node ${selected ? 'selected' : ''}`}>
      {/* Header */}
      <div className="route-node-header">
        <span className="route-node-title">
          {routeInfo.method} {routeInfo.path}
        </span>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="node-handle output-handle"
      />
    </div>
  );
});

RouteNode.displayName = 'RouteNode';
