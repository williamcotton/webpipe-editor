import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  BackgroundVariant,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { PipelineStepNode } from './nodes/PipelineStepNode';
import { ResultNode } from './nodes/ResultNode';
import { BranchStepNode } from './nodes/BranchStepNode';
import { PipelineStep, FlowNode, FlowEdge } from '../types';
import { pipelineToFlow, autoLayout } from '../utils/flowTransforms';

interface BoxAndNoodleEditorProps {
  pipelineSteps: PipelineStep[];
  updateStepCode: (stepId: string, code: string) => void;
}

const nodeTypes = {
  pipelineStep: PipelineStepNode,
  result: ResultNode,
  branchStep: BranchStepNode,
};

export const BoxAndNoodleEditor: React.FC<BoxAndNoodleEditorProps> = ({
  pipelineSteps,
  updateStepCode
}) => {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const flowData = pipelineToFlow(pipelineSteps, updateStepCode);
    return {
      nodes: autoLayout(flowData.nodes, flowData.edges),
      edges: flowData.edges
    };
  }, [pipelineSteps, updateStepCode]);

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>(initialEdges);

  // Update nodes when pipeline steps change
  useEffect(() => {
    const flowData = pipelineToFlow(pipelineSteps, updateStepCode);
    const layoutedNodes = autoLayout(flowData.nodes, flowData.edges);
    setNodes(layoutedNodes);
    setEdges(flowData.edges);
  }, [pipelineSteps, updateStepCode, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const customEdgeStyles = {
    stroke: '#0e639c',
    strokeWidth: 2,
  };

  const defaultEdgeOptions = {
    style: customEdgeStyles,
    type: 'smoothstep',
  };

  return (
    <div style={{ 
      height: '100%', 
      width: '100%',
      backgroundColor: '#1e1e1e'
    }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        style={{ backgroundColor: '#1e1e1e' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#333"
        />
        <Controls 
          style={{
            backgroundColor: '#2d2d30',
            border: '1px solid #3e3e42',
          }}
          showZoom={true}
          showFitView={true}
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
};