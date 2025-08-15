import dagre from 'dagre';
import { PipelineStep, FlowNode, FlowEdge } from '../types';

const NODE_WIDTH = 350;
const NODE_HEIGHT = 450;
const RESULT_NODE_HEIGHT = 200;

export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export const pipelineToFlow = (
  steps: PipelineStep[],
  updateStepCode: (stepId: string, code: string) => void
): FlowData => {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  let yOffset = 0;
  const xBase = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    if (step.type === 'result') {
      // Create result node
      const resultNode: FlowNode = {
        id: step.id,
        type: 'result',
        position: { x: xBase, y: yOffset },
        data: {
          step,
          updateCode: updateStepCode
        },
        width: NODE_WIDTH,
        height: RESULT_NODE_HEIGHT
      };
      nodes.push(resultNode);

      // Connect to previous step if exists
      if (i > 0) {
        edges.push({
          id: `${steps[i - 1].id}-${step.id}`,
          source: steps[i - 1].id,
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
            const branchNode: FlowNode = {
              id: branchStep.id,
              type: 'branchStep',
              position: { 
                x: resultNodeRightX + stepIndex * (NODE_WIDTH + 50), // Horizontal flow for branch steps
                y: branchStartY + branchIndex * (NODE_HEIGHT + 100) // Vertical offset per branch
              },
              data: {
                step: branchStep,
                branchId: branch.id,
                updateCode: updateStepCode
              },
              width: NODE_WIDTH,
              height: NODE_HEIGHT
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
        yOffset += RESULT_NODE_HEIGHT + (maxBranchCount * (NODE_HEIGHT + 100)) + 100;
      } else {
        yOffset += RESULT_NODE_HEIGHT + 100;
      }
    } else {
      // Create regular pipeline step node
      const stepNode: FlowNode = {
        id: step.id,
        type: 'pipelineStep',
        position: { x: xBase, y: yOffset },
        data: {
          step,
          updateCode: updateStepCode
        },
        width: NODE_WIDTH,
        height: NODE_HEIGHT
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
      }

      yOffset += NODE_HEIGHT + 100;
    }
  }

  return { nodes, edges };
};

export const autoLayout = (nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 150 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: node.width || NODE_WIDTH, 
      height: node.height || NODE_HEIGHT 
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
        y: nodeWithPosition.y - (node.height || NODE_HEIGHT) / 2,
      },
    };
  });
};

export const flowToPipeline = (nodes: FlowNode[], edges: FlowEdge[]): PipelineStep[] => {
  // Find the root nodes (nodes without incoming edges)
  const incomingEdges = new Set(edges.map(e => e.target));
  const rootNodes = nodes.filter(node => !incomingEdges.has(node.id));

  const pipeline: PipelineStep[] = [];
  const visited = new Set<string>();

  const traverse = (nodeId: string): PipelineStep | null => {
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    const step = { ...node.data.step };

    if (node.type === 'result' && step.branches) {
      // Reconstruct branches
      step.branches = step.branches.map(branch => {
        const branchNodes = nodes.filter(n => 
          n.data.branchId === branch.id && n.type === 'branchStep'
        );
        
        // Sort branch nodes by their position or connection order
        branchNodes.sort((a, b) => a.position.y - b.position.y);
        
        return {
          ...branch,
          steps: branchNodes.map(n => ({ ...n.data.step }))
        };
      });
    }

    return step;
  };

  // Process nodes in topological order
  const processedNodes = new Set<string>();
  
  const processNode = (nodeId: string) => {
    if (processedNodes.has(nodeId)) return;
    
    const step = traverse(nodeId);
    if (step && step.type !== 'branchStep') {
      pipeline.push(step);
      processedNodes.add(nodeId);
    }
  };

  // Start with root nodes and follow edges
  rootNodes.forEach(node => processNode(node.id));

  return pipeline;
};