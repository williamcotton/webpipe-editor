export const getLanguageForType = (type: string): string => {
  const langMap: { [key: string]: string } = {
    'jq': 'text', // Monaco doesn't have jq highlighting, use plain text to avoid errors
    'lua': 'lua',
    'handlebars': 'handlebars',
    'pg': 'sql',
    'auth': 'yaml',
    'validate': 'json',
    'cache': 'yaml',
    'log': 'yaml',
    'fetch': 'text'
  };
  return langMap[type] || 'text';
};

export const getDefaultCode = (type: string): string => {
  switch (type) {
    case 'fetch':
      return 'https://api.example.com/data';
    case 'jq':
      return '. | { transformed: .data }';
    case 'lua':
      return 'return { message = "Hello from Lua!" }';
    case 'handlebars':
      return '<h1>{{title}}</h1>';
    case 'pg':
      return 'SELECT * FROM users LIMIT 10';
    default:
      return '';
  }
};

export const availableOperations = [
  { type: 'fetch', label: 'fetch', language: 'text' },
  { type: 'jq', label: 'jq', language: 'text' },
  { type: 'lua', label: 'lua', language: 'lua' },
  { type: 'handlebars', label: 'handlebars', language: 'handlebars' },
  { type: 'pg', label: 'pg', language: 'sql' },
  { type: 'auth', label: 'auth', language: 'yaml' },
  { type: 'validate', label: 'validate', language: 'json' },
  { type: 'cache', label: 'cache', language: 'yaml' },
  { type: 'log', label: 'log', language: 'yaml' }
];

export const extractStepsFromPipeline = (steps: any[], routePrefix: string): import('./types').PipelineStep[] => {
  return steps.map((step: any, index: number) => {
    if (step.kind === 'Result') {
      // Handle result blocks
      const branches: import('./types').ResultBranch[] = step.branches.map((branch: any, branchIndex: number) => {
        const branchType = branch.branchType.kind === 'Ok' ? 'ok' : 
                          branch.branchType.kind === 'Custom' ? branch.branchType.name : 
                          branch.branchType.kind.toLowerCase();
        
        return {
          id: `${routePrefix}-result-${index}-branch-${branchIndex}`,
          branchType: `${branchType}(${branch.statusCode})`,
          statusCode: branch.statusCode,
          steps: extractStepsFromPipeline(branch.pipeline.steps, `${routePrefix}-result-${index}-branch-${branchIndex}`)
        };
      });

      return {
        id: `${routePrefix}-${index}`,
        type: 'result',
        language: 'text',
        code: '',
        output: '',
        branches
      };
    } else {
      // Handle regular steps
      const stepType = step.name;
      const stepCode = step.config;
      
      return {
        id: `${routePrefix}-${index}`,
        type: stepType,
        language: getLanguageForType(stepType),
        code: stepCode,
        output: ''
      };
    }
  });
};