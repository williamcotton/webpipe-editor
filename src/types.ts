export interface PipelineStep {
  id: string;
  type: string;
  language: string;
  code: string;
  output?: string;
}

export interface SelectedElement {
  type: 'config' | 'route' | 'pipeline' | 'variable' | 'test';
  data: any;
}

export type ViewMode = 'all' | 'single' | 'source';

export interface AvailableOperation {
  type: string;
  label: string;
  language: string;
}