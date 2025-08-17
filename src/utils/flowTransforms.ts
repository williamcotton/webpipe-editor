import dagre from 'dagre';
import { Node as RFNode, Edge as RFEdge } from '@xyflow/react';
import { PipelineStep, FlowNodeData } from '../types';

const NODE_WIDTH = 350;

// Helper function to calculate dynamic node height
const calculateNodeHeight = (step: PipelineStep): number => {
  if (step.type === 'result') {
    // Result node height based on branch count
    const baseHeight = 60;
    const branchHeight = 42;
    const minHeight = baseHeight + 40;
    const branches = step.branches || [];
    
    if (branches.length === 0) {
      return minHeight;
    }
    
    return baseHeight + (branches.length * branchHeight) + 20;
  } else {
    // Pipeline step height based on content
    const codeLines = (step.code || '').split('\n').length;
    const outputLines = (step.output || '').split('\n').length;
    
    // Code height: 60px min, 300px max
    const minCodeHeight = 60;
    const maxCodeHeight = 300;
    const lineHeight = 18;
    const codeHeight = Math.max(minCodeHeight, Math.min(maxCodeHeight, codeLines * lineHeight + 20));
    
    // Output height: 40px min, 150px max  
    const minOutputHeight = 40;
    const maxOutputHeight = 150;
    const outputHeight = Math.max(minOutputHeight, Math.min(maxOutputHeight, outputLines * lineHeight + 20));
    
    // Header height + code height + output height + padding
    return 40 + codeHeight + outputHeight + 10;
  }
};

export interface FlowData {
  nodes: RFNode<FlowNodeData>[];
  edges: RFEdge[];
}

export const pipelineToFlow = (
  steps: PipelineStep[],
  updateStepCode: (stepId: string, code: string) => void,
  variableDefinitions?: Array<{ name: string; type: string; value: string; lineNumber?: number }>,
  onJumpToDefinition?: (variableName: string, lineNumber?: number) => void,
  routeInfo?: { method: string; path: string },
  pipelineInfo?: { name: string }
): FlowData => {
  const nodes: RFNode<FlowNodeData>[] = [];
  const edges: RFEdge[] = [];

  let yOffset = 0;
  const xBase = 0;
  
  // Add route node at the beginning if routeInfo is provided
  if (routeInfo && steps.length > 0) {
    const routeNode: RFNode<FlowNodeData> = {
      id: 'route-node',
      type: 'route',
      position: { x: xBase, y: yOffset },
      data: {
        step: {
          id: 'route-node',
          type: 'route',
          language: '',
          code: ''
        },
        updateCode: () => {}, // No-op for route nodes
        routeInfo,
        variableDefinitions,
        onJumpToDefinition
      },
      width: NODE_WIDTH,
      height: 60 // Fixed height for route nodes
    };
    nodes.push(routeNode);
    yOffset += 60 + 50; // Route node height + gap
  }
  
  // Add pipeline node at the beginning if pipelineInfo is provided (and no routeInfo)
  if (pipelineInfo && !routeInfo && steps.length > 0) {
    const pipelineNode: RFNode<FlowNodeData> = {
      id: 'pipeline-node',
      type: 'pipeline',
      position: { x: xBase, y: yOffset },
      data: {
        step: {
          id: 'pipeline-node',
          type: 'pipeline',
          language: '',
          code: ''
        },
        updateCode: () => {}, // No-op for pipeline nodes
        pipelineInfo,
        variableDefinitions,
        onJumpToDefinition
      },
      width: NODE_WIDTH,
      height: 60 // Fixed height for pipeline nodes
    };
    nodes.push(pipelineNode);
    yOffset += 60 + 50; // Pipeline node height + gap
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    if (step.type === 'result') {
      // Create result node
      const nodeHeight = calculateNodeHeight(step);
      const resultNode: RFNode<FlowNodeData> = {
        id: step.id,
        type: 'result',
        position: { x: xBase, y: yOffset },
        data: {
          step,
          updateCode: (code: string) => updateStepCode(step.id, code),
          variableDefinitions,
          onJumpToDefinition
        },
        width: NODE_WIDTH,
        height: nodeHeight
      };
      nodes.push(resultNode);

      // Connect to previous step if exists
      if (i > 0) {
        edges.push({
          id: `${steps[i - 1].id}-${step.id}`,
          source: steps[i - 1].id,
          target: step.id
        });
      } else if (routeInfo) {
        // Connect route node to first step
        edges.push({
          id: `route-node-${step.id}`,
          source: 'route-node',
          target: step.id
        });
      } else if (pipelineInfo) {
        // Connect pipeline node to first step
        edges.push({
          id: `pipeline-node-${step.id}`,
          source: 'pipeline-node',
          target: step.id
        });
      }

      // Create branch nodes
      if (step.branches) {
        const resultNodeRightX = xBase + NODE_WIDTH + 150; // Position branches to the right
        
        step.branches.forEach((branch, branchIndex) => {
          // Position branches vertically, starting from the same Y as the result node
          const branchStartY = yOffset + 50; // Small offset from result node top
          
          branch.steps.forEach((branchStep, stepIndex) => {
            const branchStepHeight = calculateNodeHeight(branchStep);
            const branchNode: RFNode<FlowNodeData> = {
              id: branchStep.id,
              type: 'branchStep',
              position: { 
                x: resultNodeRightX + stepIndex * (NODE_WIDTH + 50), // Horizontal flow for branch steps
                y: branchStartY + branchIndex * (branchStepHeight + 100) // Vertical offset per branch
              },
              data: {
                step: branchStep,
                branchId: branch.id,
                updateCode: (code: string) => updateStepCode(branchStep.id, code),
                variableDefinitions,
                onJumpToDefinition
              },
              width: NODE_WIDTH,
              height: branchStepHeight
            };
            nodes.push(branchNode);

            // Connect result to first branch step using right-side handle
            if (stepIndex === 0) {
              edges.push({
                id: `${step.id}-${branchStep.id}`,
                source: step.id,
                target: branchStep.id,
                sourceHandle: `branch-${branchIndex}`,
                targetHandle: 'input'
              });
            } else {
              // Connect branch steps together horizontally
              const prevStep = branch.steps[stepIndex - 1];
              edges.push({
                id: `${prevStep.id}-${branchStep.id}`,
                source: prevStep.id,
                target: branchStep.id,
                sourceHandle: 'output',
                targetHandle: 'input'
              });
            }
          });
        });

        // Update yOffset to account for branch layout
        const maxBranchCount = step.branches.length;
        const maxBranchHeight = Math.max(...step.branches.map(branch => 
          Math.max(...branch.steps.map(s => calculateNodeHeight(s)))
        ));
        yOffset += nodeHeight + (maxBranchCount * (maxBranchHeight + 100)) + 100;
      } else {
        yOffset += nodeHeight + 50; // 50px gap between nodes
      }
    } else {
      // Create regular pipeline step node
      const stepHeight = calculateNodeHeight(step);
      const stepNode: RFNode<FlowNodeData> = {
        id: step.id,
        type: 'pipelineStep',
        position: { x: xBase, y: yOffset },
        data: {
          step,
          updateCode: (code: string) => updateStepCode(step.id, code),
          variableDefinitions,
          onJumpToDefinition
        },
        width: NODE_WIDTH,
        height: stepHeight
      };
      nodes.push(stepNode);

      // Connect to previous step
      if (i > 0) {
        const prevStep = steps[i - 1];
        // Don't connect if previous step was a result with branches
        if (prevStep.type !== 'result' || !prevStep.branches?.length) {
          edges.push({
            id: `${prevStep.id}-${step.id}`,
            source: prevStep.id,
            target: step.id
          });
        }
      } else if (routeInfo) {
        // Connect route node to first step
        edges.push({
          id: `route-node-${step.id}`,
          source: 'route-node',
          target: step.id
        });
      } else if (pipelineInfo) {
        // Connect pipeline node to first step
        edges.push({
          id: `pipeline-node-${step.id}`,
          source: 'pipeline-node',
          target: step.id
        });
      }

      yOffset += stepHeight + 50; // 50px gap between nodes
    }
  }

  return { nodes, edges };
};

export const autoLayout = (nodes: RFNode<FlowNodeData>[], edges: RFEdge[]): RFNode<FlowNodeData>[] => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 50 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: node.width || NODE_WIDTH, 
      height: node.height || 200 // fallback height
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - (node.width || NODE_WIDTH) / 2,
        y: nodeWithPosition.y - (node.height || 200) / 2,
      },
    };
  });
};

export const flowToPipeline = (nodes: RFNode<FlowNodeData>[], edges: RFEdge[]): PipelineStep[] => {
  // Build lookup for quick access
  const nodeById = new Map<string, RFNode<FlowNodeData>>();
  nodes.forEach(n => nodeById.set(n.id, n));

  // Separate main nodes (pipelineStep/result) from branch nodes, route nodes, and pipeline nodes
  const mainNodes = nodes.filter(n => n.type !== 'branchStep' && n.type !== 'route' && n.type !== 'pipeline');

  // Build directed graph among main nodes using edges that connect main nodes
  const mainNodeIds = new Set(mainNodes.map(n => n.id));
  const outgoing = new Map<string, Set<string>>();
  const indegree = new Map<string, number>();
  mainNodes.forEach(n => {
    outgoing.set(n.id, new Set());
    indegree.set(n.id, 0);
  });

  edges.forEach(e => {
    if (!e.source || !e.target) return;
    if (!mainNodeIds.has(e.source) || !mainNodeIds.has(e.target)) return;
    // Ignore edges from result branching handles; those are for branches only
    if (typeof e.sourceHandle === 'string' && e.sourceHandle.startsWith('branch-')) return;
    const from = e.source;
    const to = e.target;
    if (!outgoing.has(from) || !indegree.has(to)) return;
    if (!outgoing.get(from)!.has(to)) {
      outgoing.get(from)!.add(to);
      indegree.set(to, (indegree.get(to) || 0) + 1);
    }
  });

  // Topological order of main nodes; stable by vertical position when ties
  const queue: RFNode<FlowNodeData>[] = mainNodes
    .filter(n => (indegree.get(n.id) || 0) === 0)
    .sort((a, b) => a.position.y - b.position.y);
  const visited = new Set<string>();
  const orderedMain: RFNode<FlowNodeData>[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (visited.has(node.id)) continue;
    visited.add(node.id);
    orderedMain.push(node);
    const outs = outgoing.get(node.id) || new Set<string>();
    const nexts = Array.from(outs)
      .map(id => nodeById.get(id)!)
      .filter(Boolean)
      .sort((a, b) => a.position.y - b.position.y);
    nexts.forEach(n => {
      const id = n.id;
      indegree.set(id, Math.max(0, (indegree.get(id) || 0) - 1));
      if ((indegree.get(id) || 0) === 0) {
        queue.push(n);
      }
    });
  }

  // Append any unvisited nodes in stable vertical order
  mainNodes
    .filter(n => !visited.has(n.id))
    .sort((a, b) => a.position.y - b.position.y)
    .forEach(n => orderedMain.push(n));

  const pipeline: PipelineStep[] = orderedMain.map(node => {
    const step = { ...(node.data as FlowNodeData).step };

    if (node.type === 'result' && step.branches) {
      // For each branch, order steps by branch-internal edges (fallback: x position)
      step.branches = step.branches.map(branch => {
        const branchNodes = nodes.filter(n => n.type === 'branchStep' && (n.data as FlowNodeData).branchId === branch.id);
        const branchIds = new Set(branchNodes.map(n => n.id));
        const outB = new Map<string, Set<string>>();
        const inB = new Map<string, number>();
        branchNodes.forEach(n => {
          outB.set(n.id, new Set());
          inB.set(n.id, 0);
        });
        edges.forEach(e => {
          if (!e.source || !e.target) return;
          if (!branchIds.has(e.source) || !branchIds.has(e.target)) return;
          if (!outB.get(e.source)!.has(e.target)) {
            outB.get(e.source)!.add(e.target);
            inB.set(e.target, (inB.get(e.target) || 0) + 1);
          }
        });
        // Kahn's algorithm within branch; tie-break by x position
        const q: RFNode<FlowNodeData>[] = branchNodes
          .filter(n => (inB.get(n.id) || 0) === 0)
          .sort((a, b) => a.position.x - b.position.x);
        const seen = new Set<string>();
        const orderedBranch: RFNode<FlowNodeData>[] = [];
        while (q.length > 0) {
          const n = q.shift()!;
          if (seen.has(n.id)) continue;
          seen.add(n.id);
          orderedBranch.push(n);
          const outs = outB.get(n.id) || new Set<string>();
          const nexts = Array.from(outs)
            .map(id => nodeById.get(id)!)
            .filter(Boolean)
            .sort((a, b) => a.position.x - b.position.x);
          nexts.forEach(nn => {
            const id = nn.id;
            inB.set(id, Math.max(0, (inB.get(id) || 0) - 1));
            if ((inB.get(id) || 0) === 0) {
              q.push(nn);
            }
          });
        }
        // Append any remaining by x position
        branchNodes
          .filter(n => !seen.has(n.id))
          .sort((a, b) => a.position.x - b.position.x)
          .forEach(n => orderedBranch.push(n));

        const sortedBranchSteps = orderedBranch.map(bn => ({ ...((bn.data as FlowNodeData).step) }));
        return {
          ...branch,
          steps: sortedBranchSteps
        };
      });
    }

    return step;
  });

  return pipeline;
};