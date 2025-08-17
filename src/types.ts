export interface PipelineStep {
  id: string;
  type: string;
  language: string;
  code: string;
  output?: string;
  branches?: ResultBranch[];
}

export interface ResultBranch {
  id: string;
  branchType: string;
  statusCode: number;
  steps: PipelineStep[];
}

export interface SelectedElement {
  type: 'config' | 'route' | 'pipeline' | 'variable' | 'test';
  data: any;
}

export type ViewMode = 'all' | 'single' | 'source' | 'flow';

export interface AvailableOperation {
  type: string;
  label: string;
  language: string;
}

// Flow-related types
export interface FlowNodeData {
  step: PipelineStep;
  branchId?: string;
  updateCode: (code: string) => void;
  branchType?: string;
  variableDefinitions?: Array<{ name: string; type: string; value: string; lineNumber?: number }>;
  onJumpToDefinition?: (variableName: string, lineNumber?: number) => void;
  routeInfo?: { method: string; path: string };
  [key: string]: unknown;
}

export interface FlowNode {
  id: string;
  type: 'pipelineStep' | 'result' | 'branchStep' | 'route';
  position: { x: number; y: number };
  data: FlowNodeData;
  width?: number;
  height?: number;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  selected?: boolean;
}