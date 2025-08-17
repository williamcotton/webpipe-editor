import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  Node as RFNode,
  Edge as RFEdge,
  NodeChange,
  EdgeChange
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { PipelineStepNode } from './nodes/PipelineStepNode';
import { ResultNode } from './nodes/ResultNode';
import { BranchStepNode } from './nodes/BranchStepNode';
import { RouteNode } from './nodes/RouteNode';
import { PipelineNode } from './nodes/PipelineNode';
import { FlowContextMenu } from './FlowContextMenu';
import { PipelineStep, FlowNodeData } from '../types';
import { pipelineToFlow, autoLayout, flowToPipeline } from '../utils/flowTransforms';
 

interface BoxAndNoodleEditorProps {
  pipelineSteps: PipelineStep[];
  updateStepCode: (stepId: string, code: string) => void;
  addStep?: (type: string) => void;
  deleteStep?: (stepId: string) => void;
  updatePipelineStructure?: (steps: PipelineStep[]) => void;
  variableDefinitions?: Array<{ name: string; type: string; value: string; lineNumber?: number }>;
  pipelineDefinitions?: Array<{ name: string; steps: any[]; lineNumber?: number }>;
  onJumpToDefinition?: (variableName: string, lineNumber?: number) => void;
  onJumpToPipeline?: (pipelineName: string, lineNumber?: number) => void;
  routeInfo?: { method: string; path: string };
  pipelineInfo?: { name: string };
}

const nodeTypes = {
  pipelineStep: PipelineStepNode,
  result: ResultNode,
  branchStep: BranchStepNode,
  route: RouteNode,
  pipeline: PipelineNode,
};

export const BoxAndNoodleEditor: React.FC<BoxAndNoodleEditorProps> = ({
  pipelineSteps,
  updateStepCode,
  addStep,
  deleteStep,
  updatePipelineStructure,
  variableDefinitions = [],
  pipelineDefinitions = [],
  onJumpToDefinition,
  onJumpToPipeline,
  routeInfo,
  pipelineInfo
}) => {
  const lastPipelineStepsRef = useRef<PipelineStep[]>(pipelineSteps);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    visible: boolean;
  }>({
    x: 0,
    y: 0,
    visible: false
  });
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const flowData = pipelineToFlow(pipelineSteps, updateStepCode, variableDefinitions, pipelineDefinitions, onJumpToDefinition, onJumpToPipeline, routeInfo, pipelineInfo);
    return {
      nodes: autoLayout(flowData.nodes, flowData.edges),
      edges: flowData.edges
    };
  }, [pipelineSteps, updateStepCode, variableDefinitions, pipelineDefinitions, onJumpToDefinition, onJumpToPipeline, routeInfo, pipelineInfo]);

  const [nodes, setNodes, baseOnNodesChange] = useNodesState<RFNode<FlowNodeData>>(initialNodes);
  const [edges, setEdges, baseOnEdgesChange] = useEdgesState<RFEdge>(initialEdges);
  const [structureDirty, setStructureDirty] = useState(false);

  // Update ref when pipelineSteps changes from outside
  useEffect(() => {
    lastPipelineStepsRef.current = pipelineSteps;
    setStructureDirty(false);
  }, [pipelineSteps]);
  const onNodesChange = useCallback((changes: NodeChange<RFNode<FlowNodeData>>[]) => {
    if (changes.some(c => c.type === 'add' || c.type === 'remove')) {
      setStructureDirty(true);
    }
    baseOnNodesChange(changes);
  }, [baseOnNodesChange]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    if (changes.some(c => c.type === 'add' || c.type === 'remove')) {
      setStructureDirty(true);
    }
    baseOnEdgesChange(changes);
  }, [baseOnEdgesChange]);


  // Update nodes when pipeline steps change (but preserve existing edges)
  useEffect(() => {
    const flowData = pipelineToFlow(pipelineSteps, updateStepCode, variableDefinitions, pipelineDefinitions, onJumpToDefinition, onJumpToPipeline, routeInfo, pipelineInfo);
    const layoutedNodes = autoLayout(flowData.nodes, flowData.edges);
    
    // Only update if the node structure actually changed (not just edge changes)
    const currentNodeIds = new Set(nodes.map(n => n.id));
    const newNodeIds = new Set(layoutedNodes.map(n => n.id));
    
    const nodesChanged = currentNodeIds.size !== newNodeIds.size || 
                        [...currentNodeIds].some(id => !newNodeIds.has(id)) ||
                        [...newNodeIds].some(id => !currentNodeIds.has(id));
    
    // Check if route/pipeline context changed (e.g., jumping from route to pipeline)
    const hasRouteNode = nodes.some(n => n.type === 'route');
    const hasPipelineNode = nodes.some(n => n.type === 'pipeline');
    const newHasRouteNode = layoutedNodes.some(n => n.type === 'route');
    const newHasPipelineNode = layoutedNodes.some(n => n.type === 'pipeline');
    const contextChanged = (hasRouteNode !== newHasRouteNode) || (hasPipelineNode !== newHasPipelineNode);
    
    if (nodesChanged || contextChanged) {
      // Structural change - update nodes and reset edges
      setNodes(layoutedNodes);
      setEdges(flowData.edges);
    } else {
      // No structural change - only update node data, preserve edges
      setNodes(prevNodes => {
        const nextNodes = prevNodes.map(node => {
          const updatedNode = layoutedNodes.find(n => n.id === node.id);
          if (!updatedNode) return node;
          // Only replace when data actually changed to avoid unnecessary renders
          const dataChanged = JSON.stringify(node.data) !== JSON.stringify(updatedNode.data);
          return dataChanged ? { ...node, data: updatedNode.data } : node;
        });
        return nextNodes;
      });
    }
  }, [pipelineSteps, updateStepCode, variableDefinitions, pipelineDefinitions, onJumpToDefinition, onJumpToPipeline, routeInfo, pipelineInfo]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      setStructureDirty(true);
      // If connecting from a result branch handle, convert the target node into a branch step
      const handleId = params.sourceHandle ?? undefined;
      if (params.source && params.target && handleId && handleId.startsWith('branch-')) {
        setNodes((prev) => {
          const sourceNode = prev.find((n) => n.id === params.source);
          if (!sourceNode || sourceNode.type !== 'result') return prev;
          const branchIndexStr = handleId.replace('branch-', '');
          const branchIndex = parseInt(branchIndexStr, 10);
          const resultStep = (sourceNode.data as FlowNodeData).step;
          const branch = resultStep.branches && resultStep.branches[branchIndex];
          if (!branch) return prev;
          return prev.map((n) => {
            if (n.id !== params.target) return n;
            const existingData = n.data as FlowNodeData;
            return {
              ...n,
              type: 'branchStep',
              data: {
                ...existingData,
                branchId: branch.id,
                branchType: branch.branchType
              }
            } as RFNode<FlowNodeData>;
          });
        });
      }
    },
    [setEdges, setNodes]
  );

  const handleContextMenu = useCallback((event: MouseEvent | React.MouseEvent<Element, MouseEvent>) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      visible: true
    });
  }, []);

  const handleCreateNode = useCallback((type: string) => {
    if (!addStep) return;
    addStep(type);
  }, [addStep]);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // Handle node deletion
  const onNodesDelete = useCallback((deletedNodes: RFNode[]) => {
    if (!deleteStep) return;
    
    deletedNodes.forEach(node => {
      deleteStep(node.id);
    });
    setStructureDirty(true);
  }, [deleteStep]);

  // Handle edge deletion
  const onEdgesDelete = useCallback((_deletedEdges: RFEdge[]) => {
    // Edge deletion is handled automatically by ReactFlow state
    // The structure change will be picked up by the effect below
    setStructureDirty(true);
  }, []);

  // Effect to sync structural changes back to pipeline state
  useEffect(() => {
    if (!structureDirty) return;
    if (!updatePipelineStructure) return;
    if (nodes.length === 0 && pipelineSteps.length > 0) return;
    const timeoutId = setTimeout(() => {
      try {
        const newPipelineSteps = flowToPipeline(nodes, edges);
        const currentJson = JSON.stringify(lastPipelineStepsRef.current);
        const newJson = JSON.stringify(newPipelineSteps);
        if (newJson !== currentJson) {
          lastPipelineStepsRef.current = newPipelineSteps;
          updatePipelineStructure(newPipelineSteps);
        }
      } catch (error) {
        console.warn('Failed to convert flow to spipeline:', error);
      } finally {
        setStructureDirty(false);
      }
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [structureDirty, nodes, edges, updatePipelineStructure]);

  // Custom edge styling based on selection
  const getEdgeStyle = (selected?: boolean) => ({
    stroke: selected ? '#00ff88' : '#0e639c', // Bright green for selected, blue for normal
    strokeWidth: selected ? 3 : 2, // Thicker when selected
    filter: selected ? 'drop-shadow(0 0 6px #00ff8866)' : 'none', // Glow effect for selected
  });

  const defaultEdgeOptions = {
    style: getEdgeStyle(false),
    type: 'smoothstep',
  };

  // Update edges with custom styling
  const styledEdges = edges.map(edge => ({
    ...edge,
    style: getEdgeStyle(edge.selected),
  }));

  return (
    <div style={{ 
      height: '100%', 
      width: '100%',
      backgroundColor: '#1e1e1e'
    }}>
      {/* Custom CSS for selected edges and controls */}
      <style>{`
        .react-flow__edge.selected .react-flow__edge-path {
          stroke: #00ff88 !important;
          stroke-width: 3px !important;
          filter: drop-shadow(0 0 6px #00ff8866) !important;
        }
        .react-flow__edge:hover .react-flow__edge-path {
          stroke: #66ccff !important;
          stroke-width: 2.5px !important;
        }
        .react-flow__controls {
          background-color: #2d2d30 !important;
          border: 1px solid #3e3e42 !important;
        }
        .react-flow__controls button {
          background-color: #2d2d30 !important;
          border: 1px solid #3e3e42 !important;
          color: #cccccc !important;
          fill: #cccccc !important;
        }
        .react-flow__controls button:hover {
          background-color: #404040 !important;
          color: #ffffff !important;
          fill: #ffffff !important;
        }
        .react-flow__controls button svg {
          fill: #cccccc !important;
        }
        .react-flow__controls button:hover svg {
          fill: #ffffff !important;
        }
        .react-flow__handle.connectionindicator {
          background-color: #0e639c !important;
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onPaneContextMenu={handleContextMenu}
        deleteKeyCode={['Delete', 'Backspace']}
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
      
      <FlowContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        visible={contextMenu.visible}
        onClose={handleCloseContextMenu}
        onCreateNode={handleCreateNode}
      />
    </div>
  );
};