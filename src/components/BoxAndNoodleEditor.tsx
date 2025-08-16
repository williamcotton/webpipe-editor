import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
  Node as RFNode,
  Edge as RFEdge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { PipelineStepNode } from './nodes/PipelineStepNode';
import { ResultNode } from './nodes/ResultNode';
import { BranchStepNode } from './nodes/BranchStepNode';
import { FlowContextMenu } from './FlowContextMenu';
import { PipelineStep, FlowNodeData } from '../types';
import { pipelineToFlow, autoLayout, flowToPipeline } from '../utils/flowTransforms';
import { getDefaultCode, availableOperations } from '../utils';

interface BoxAndNoodleEditorProps {
  pipelineSteps: PipelineStep[];
  updateStepCode: (stepId: string, code: string) => void;
  addStep?: (type: string) => void;
  deleteStep?: (stepId: string) => void;
  updatePipelineStructure?: (steps: PipelineStep[]) => void;
}

const nodeTypes = {
  pipelineStep: PipelineStepNode,
  result: ResultNode,
  branchStep: BranchStepNode,
};

export const BoxAndNoodleEditor: React.FC<BoxAndNoodleEditorProps> = ({
  pipelineSteps,
  updateStepCode,
  addStep,
  deleteStep,
  updatePipelineStructure
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
    const flowData = pipelineToFlow(pipelineSteps, updateStepCode);
    return {
      nodes: autoLayout(flowData.nodes, flowData.edges),
      edges: flowData.edges
    };
  }, [pipelineSteps, updateStepCode]);

  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode<FlowNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge>(initialEdges);

  // Update ref when pipelineSteps changes from outside
  useEffect(() => {
    lastPipelineStepsRef.current = pipelineSteps;
  }, [pipelineSteps]);

  // Update nodes when pipeline steps change (but preserve existing edges)
  useEffect(() => {
    const flowData = pipelineToFlow(pipelineSteps, updateStepCode);
    const layoutedNodes = autoLayout(flowData.nodes, flowData.edges);
    
    // Only update if the node structure actually changed (not just edge changes)
    const currentNodeIds = new Set(nodes.map(n => n.id));
    const newNodeIds = new Set(layoutedNodes.map(n => n.id));
    
    const nodesChanged = currentNodeIds.size !== newNodeIds.size || 
                        [...currentNodeIds].some(id => !newNodeIds.has(id)) ||
                        [...newNodeIds].some(id => !currentNodeIds.has(id));
    
    if (nodesChanged) {
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
  }, [pipelineSteps, updateStepCode]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
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
  }, [deleteStep]);

  // Handle edge deletion
  const onEdgesDelete = useCallback((_deletedEdges: RFEdge[]) => {
    // Edge deletion is handled automatically by ReactFlow state
    // The structure change will be picked up by the effect below
  }, []);

  // Effect to sync structural changes back to pipeline state
  useEffect(() => {
    
    if (!updatePipelineStructure) {
      console.log('No updatePipelineStructure function, skipping');
      return;
    }
    
    // Only update if we have nodes and edges (avoid initial empty state)
    if (nodes.length === 0 && pipelineSteps.length > 0) {
      console.log('Empty nodes but pipeline has steps, skipping');
      return;
    }
    
    // Debounce the update to avoid excessive calls
    const timeoutId = setTimeout(() => {
      try {
        console.log('Converting flow to pipeline...');
        const newPipelineSteps = flowToPipeline(nodes, edges);
        console.log('Conversion result:', newPipelineSteps.map(s => ({ id: s.id, type: s.type })));
        
        // Only update if the structure actually changed
        const currentJson = JSON.stringify(lastPipelineStepsRef.current);
        const newJson = JSON.stringify(newPipelineSteps);
        
        if (newJson !== currentJson) {
          console.log('Structure changed, calling updatePipelineStructure');
          lastPipelineStepsRef.current = newPipelineSteps;
          updatePipelineStructure(newPipelineSteps);
        } else {
          console.log('No change detected');
        }
      } catch (error) {
        console.warn('Failed to convert flow to pipeline:', error);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, updatePipelineStructure]);

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
      {/* Custom CSS for selected edges */}
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