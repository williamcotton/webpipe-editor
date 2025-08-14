export interface WebpipeRoute {
  method: string;
  path: string;
  pipeline: PipelineStep[];
}

export interface PipelineStep {
  type: 'jq' | 'lua' | 'handlebars' | 'pg' | 'auth' | 'validate' | 'cache' | 'log' | 'fetch' | 'result' | 'pipeline';
  code: string;
  language: string;
}

export interface WebpipeConfig {
  name: string;
  properties: Record<string, any>;
}

export interface WebpipeTest {
  description: string;
  steps: TestStep[];
}

export interface TestStep {
  type: 'when' | 'then' | 'and' | 'with';
  condition: string;
}

export interface WebpipeVariable {
  type: 'pg' | 'handlebars';
  name: string;
  value: string;
}

export interface WebpipePipeline {
  name: string;
  steps: PipelineStep[];
}

export interface WebpipeDocument {
  routes: WebpipeRoute[];
  configs: WebpipeConfig[];
  tests: WebpipeTest[];
  variables: WebpipeVariable[];
  pipelines: WebpipePipeline[];
}