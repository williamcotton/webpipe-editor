import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { parseProgram, prettyPrint, printConfig, printDescribe } from 'webpipe-js';

interface PipelineStep {
  id: string;
  type: string;
  language: string;
  code: string;
  output?: string;
}

function App() {
  // Load test.wp content initially
  const [webpipeSource, setWebpipeSource] = useState<string>('');

  // Load test.wp file on mount
  useEffect(() => {
    const loadTestFile = async () => {
      if (window.electronAPI && window.electronAPI.loadFile) {
        try {
          const content = await window.electronAPI.loadFile('./test.wp');
          setWebpipeSource(content);
        } catch (error) {
          console.error('Failed to load test.wp:', error);
          // Fallback content
          setWebpipeSource(`# Test WebPipe

GET /hello/:world
  |> jq: \`{ world: .params.world }\`
  |> handlebars: \`<p>hello, {{world}}</p>\`

describe "hello, world"
  it "calls the route"
    when calling GET /hello/world
    then status is 200
    and output equals \`<p>hello, world</p>\``);
        }
      } else {
        // Use test.wp content directly for now
        const defaultContent = [
          '# Test App',
          '',
          'GET /hello/:world',
          '  |> jq: `{ world: .params.world }`',
          '  |> handlebars: `<p>hello, {{world}}</p>`',
          '',
          'describe "hello, world"',
          '  it "calls the route"',
          '    when calling GET /hello/world',
          '    then status is 200',
          '    and output equals `<p>hello, world</p>`',
          '',
          'GET /lua/:id/example',
          '  |> lua: `',
          '    local id = request.params.id',
          '    local name = request.query.name',
          '    return {',
          '      message = "Hello from Lua!",',
          '      id = id,',
          '      name = name',
          '    }',
          '  `'
        ].join('\n');
        
        setWebpipeSource(defaultContent);
      }
    };
    
    loadTestFile();
  }, []);

  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [selectedStep, setSelectedStep] = useState<string>('');
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'all' | 'single' | 'source'>('source');
  const [parsedData, setParsedData] = useState<any>(null);
  
  const availableOperations = [
    { type: 'curl', label: 'curl', language: 'shell' },
    { type: 'jq', label: 'jq', language: 'text' },
    { type: 'lua', label: 'lua', language: 'lua' },
    { type: 'handlebars', label: 'handlebars', language: 'handlebars' },
    { type: 'pg', label: 'pg', language: 'sql' },
    { type: 'auth', label: 'auth', language: 'yaml' },
    { type: 'validate', label: 'validate', language: 'json' },
    { type: 'cache', label: 'cache', language: 'yaml' },
    { type: 'log', label: 'log', language: 'yaml' }
  ];

  // Parse webpipe source when it changes
  useEffect(() => {
    if (!webpipeSource.trim()) return;
    
    const parseWebpipeSource = async () => {
      try {
        const parsed = parseProgram(webpipeSource);
        console.log('Parsed data:', parsed);
        setParsedData(parsed);
        
        if (parsed && parsed.routes && parsed.routes.length > 0) {
          const firstRoute = parsed.routes[0];
          console.log('First route:', firstRoute);
          console.log('First route pipeline:', firstRoute.pipeline);
          
          let steps: PipelineStep[] = [];
          // Handle the actual webpipe-js structure: route.pipeline.pipeline.steps
          if (firstRoute.pipeline?.pipeline?.steps) {
            steps = firstRoute.pipeline.pipeline.steps.map((step: any, index: number) => {
              const stepType = step.name; // webpipe-js uses 'name' for the step type
              const stepCode = step.config; // webpipe-js uses 'config' for the step code
              
              return {
                id: `${firstRoute.method}-${firstRoute.path}-${index}`,
                type: stepType,
                language: getLanguageForType(stepType),
                code: stepCode,
                output: ''
              };
            });
          }
          
          console.log('Initial steps:', steps);
          setPipelineSteps(steps);
          setSelectedRoute(`${firstRoute.method} ${firstRoute.path}`);
        }
      } catch (error) {
        console.error('Failed to parse webpipe source:', error);
      }
    };
    
    parseWebpipeSource();
  }, [webpipeSource]);

  // Update webpipe source when pipeline steps change
  const updateWebpipeSource = () => {
    try {
      console.log('updateWebpipeSource called');
      console.log('parsedData:', parsedData);
      console.log('selectedElement:', selectedElement);
      console.log('pipelineSteps:', pipelineSteps);
      
      if (parsedData && selectedElement?.type === 'route' && pipelineSteps.length > 0) {
        const updatedData = {
          ...parsedData,
          routes: parsedData.routes.map((route: any) => {
            // Use method and path to match instead of object reference
            if (route.method === selectedElement.data.method && route.path === selectedElement.data.path) {
              console.log('Updating route:', route.method, route.path);
              console.log('New steps:', pipelineSteps);
              
              return {
                ...route,
                pipeline: {
                  ...route.pipeline,
                  pipeline: {
                    steps: pipelineSteps.map(step => ({
                      kind: "Regular",
                      name: step.type,
                      config: step.code
                    }))
                  }
                }
              };
            }
            return route;
          })
        };
        
        console.log('Updated data:', updatedData);
        const formatted = prettyPrint(updatedData);
        console.log('Formatted result:', formatted);
        
        if (formatted) {
          setWebpipeSource(formatted);
          console.log('Source updated successfully');
        } else {
          console.error('prettyPrint returned empty result');
        }
      } else {
        console.log('Conditions not met for update:', {
          hasParsedData: !!parsedData,
          isRoute: selectedElement?.type === 'route',
          hasSteps: pipelineSteps.length > 0
        });
      }
    } catch (error) {
      console.error('Failed to update webpipe source:', error);
    }
  };

  const getLanguageForType = (type: string): string => {
    const langMap: { [key: string]: string } = {
      'jq': 'text', // Monaco doesn't have jq highlighting, use plain text to avoid errors
      'lua': 'lua',
      'handlebars': 'handlebars',
      'pg': 'sql',
      'auth': 'yaml',
      'validate': 'json',
      'cache': 'yaml',
      'log': 'yaml',
      'curl': 'shell'
    };
    return langMap[type] || 'text';
  };


  const addStep = (type: string) => {
    const operation = availableOperations.find(op => op.type === type);
    if (!operation) return;
    
    const newStep: PipelineStep = {
      id: Date.now().toString(),
      type: operation.type,
      language: operation.language,
      code: getDefaultCode(operation.type),
      output: ''
    };
    
    const newSteps = [...pipelineSteps, newStep];
    setPipelineSteps(newSteps);
    
    // Don't automatically update source - only when user switches to source view
  };

  const getDefaultCode = (type: string): string => {
    switch (type) {
      case 'curl':
        return 'curl -s "https://api.example.com/data"';
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

  const updateStepCode = (stepId: string, code: string) => {
    setPipelineSteps(steps => 
      steps.map(step => 
        step.id === stepId ? { ...step, code } : step
      )
    );
    
    // Don't automatically update source - only when user switches to source view
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      backgroundColor: '#1e1e1e',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '200px',
        backgroundColor: '#252526',
        borderRight: '1px solid #3e3e42',
        padding: '16px',
        overflowY: 'auto'
      }}>
        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => {
              // Update webpipe source from current pipeline steps before switching to source view
              updateWebpipeSource();
              setViewMode('source');
            }}
            style={{
              padding: '8px 12px',
              backgroundColor: viewMode === 'source' ? '#0e639c' : '#37373d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              width: '100%'
            }}
          >
            📝 Source
          </button>
          <button
            onClick={() => setViewMode('all')}
            style={{
              padding: '8px 12px',
              backgroundColor: viewMode === 'all' ? '#0e639c' : '#37373d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              width: '100%'
            }}
          >
            📋 View All
          </button>
          <button
            onClick={() => setViewMode('single')}
            style={{
              padding: '8px 12px',
              backgroundColor: viewMode === 'single' ? '#0e639c' : '#37373d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              width: '100%'
            }}
          >
            📄 View Single
          </button>
        </div>
        
        {/* WebPipe Structure */}
        {parsedData && (
          <div style={{ fontSize: '12px' }}>
            {/* Configs */}
            {parsedData.configs && parsedData.configs.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#cccccc', textTransform: 'uppercase' }}>Config</h3>
                {parsedData.configs.map((config: any, index: number) => (
                  <div
                    key={`config-${index}`}
                    onClick={() => {
                      setSelectedElement({ type: 'config', data: config });
                      setViewMode('single');
                    }}
                    style={{
                      padding: '6px 8px',
                      margin: '2px 0',
                      backgroundColor: selectedElement?.type === 'config' && selectedElement?.data === config ? '#0e639c' : '#37373d',
                      color: '#cccccc',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    config {config.name}
                  </div>
                ))}
                <div style={{ borderBottom: '1px solid #3e3e42', margin: '8px 0' }}></div>
              </div>
            )}

            {/* Routes */}
            {parsedData.routes && parsedData.routes.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#cccccc', textTransform: 'uppercase' }}>Routes</h3>
                {parsedData.routes.map((route: any, index: number) => (
                  <div
                    key={`route-${index}`}
                    onClick={() => {
                      console.log('Route clicked:', route);
                      setSelectedElement({ type: 'route', data: route });
                      setSelectedRoute(`${route.method} ${route.path}`);
                      setViewMode('all'); // Switch to all view to show pipeline
                      
                      // Extract pipeline steps from the route
                      let steps: PipelineStep[] = [];
                      if (route.pipeline?.pipeline?.steps) {
                        steps = route.pipeline.pipeline.steps.map((step: any, stepIndex: number) => {
                          const stepType = step.name; // webpipe-js uses 'name' for the step type
                          const stepCode = step.config; // webpipe-js uses 'config' for the step code
                          
                          console.log('Processing step:', step, 'Type:', stepType, 'Code:', stepCode);
                          
                          return {
                            id: `${route.method}-${route.path}-${stepIndex}`,
                            type: stepType,
                            language: getLanguageForType(stepType),
                            code: stepCode,
                            output: ''
                          };
                        });
                      }
                      
                      console.log('Setting pipeline steps:', steps);
                      setPipelineSteps(steps);
                    }}
                    style={{
                      padding: '6px 8px',
                      margin: '2px 0',
                      backgroundColor: selectedElement?.type === 'route' && selectedElement?.data === route ? '#0e639c' : '#37373d',
                      color: '#cccccc',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    {route.method} {route.path}
                  </div>
                ))}
                <div style={{ borderBottom: '1px solid #3e3e42', margin: '8px 0' }}></div>
              </div>
            )}

            {/* Pipelines */}
            {parsedData.pipelines && parsedData.pipelines.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#cccccc', textTransform: 'uppercase' }}>Pipelines</h3>
                {parsedData.pipelines.map((pipeline: any, index: number) => (
                  <div
                    key={`pipeline-${index}`}
                    onClick={() => {
                      setSelectedElement({ type: 'pipeline', data: pipeline });
                      if (pipeline.pipeline?.steps) {
                        const steps: PipelineStep[] = pipeline.pipeline.steps.map((step: any, stepIndex: number) => {
                          const stepType = step.name; // webpipe-js uses 'name' for the step type
                          const stepCode = step.config; // webpipe-js uses 'config' for the step code
                          
                          return {
                            id: `pipeline-${pipeline.name}-${stepIndex}`,
                            type: stepType,
                            language: getLanguageForType(stepType),
                            code: stepCode,
                            output: ''
                          };
                        });
                        setPipelineSteps(steps);
                        setViewMode('all');
                      } else {
                        setViewMode('single');
                      }
                    }}
                    style={{
                      padding: '6px 8px',
                      margin: '2px 0',
                      backgroundColor: selectedElement?.type === 'pipeline' && selectedElement?.data === pipeline ? '#0e639c' : '#37373d',
                      color: '#cccccc',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    pipeline {pipeline.name}
                  </div>
                ))}
                <div style={{ borderBottom: '1px solid #3e3e42', margin: '8px 0' }}></div>
              </div>
            )}

            {/* Variables */}
            {parsedData.variables && parsedData.variables.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#cccccc', textTransform: 'uppercase' }}>Variables</h3>
                {parsedData.variables.map((variable: any, index: number) => (
                  <div
                    key={`variable-${index}`}
                    onClick={() => {
                      setSelectedElement({ type: 'variable', data: variable });
                      setViewMode('single');
                    }}
                    style={{
                      padding: '6px 8px',
                      margin: '2px 0',
                      backgroundColor: selectedElement?.type === 'variable' && selectedElement?.data === variable ? '#0e639c' : '#37373d',
                      color: '#cccccc',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    {variable.varType} {variable.name}
                  </div>
                ))}
                <div style={{ borderBottom: '1px solid #3e3e42', margin: '8px 0' }}></div>
              </div>
            )}

            {/* Tests */}
            {parsedData.describes && parsedData.describes.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#cccccc', textTransform: 'uppercase' }}>Tests</h3>
                {parsedData.describes.map((describe: any, index: number) => (
                  <div
                    key={`test-${index}`}
                    onClick={() => {
                      setSelectedElement({ type: 'test', data: describe });
                      setViewMode('single');
                    }}
                    style={{
                      padding: '6px 8px',
                      margin: '2px 0',
                      backgroundColor: selectedElement?.type === 'test' && selectedElement?.data === describe ? '#0e639c' : '#37373d',
                      color: '#cccccc',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    describe "{describe.name}"
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Editor Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#2d2d30',
          borderBottom: '1px solid #3e3e42',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '14px', color: '#cccccc' }}>
            test.wp - WebPipe Editor
          </span>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {viewMode === 'source' ? (
            <Editor
              height="100%"
              language="webpipe"
              value={webpipeSource}
              onChange={(value) => setWebpipeSource(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                automaticLayout: true,
                wordWrap: 'on'
              }}
            />
          ) : (
            // Show specific editor based on selected element type
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#2d2d30',
                borderBottom: '1px solid #3e3e42',
                fontSize: '12px',
                color: '#cccccc'
              }}>
                {selectedElement ? (
                  <>
                    {selectedElement.type === 'config' && `Config: ${selectedElement.data.name}`}
                    {selectedElement.type === 'route' && `Route: ${selectedElement.data.method} ${selectedElement.data.path}`}
                    {selectedElement.type === 'pipeline' && `Pipeline: ${selectedElement.data.name}`}
                    {selectedElement.type === 'variable' && `Variable: ${selectedElement.data.varType} ${selectedElement.data.name}`}
                    {selectedElement.type === 'test' && `Test: ${selectedElement.data.name}`}
                  </>
                ) : (
                  'Select an element from the sidebar to edit'
                )}
              </div>
              
              {selectedElement && (selectedElement.type === 'route' || selectedElement.type === 'pipeline') && viewMode === 'all' ? (
                // Pipeline view for routes and pipelines
                <div style={{ 
                  display: 'flex', 
                  height: '100%',
                  gap: '1px',
                  backgroundColor: '#3e3e42'
                }}>
                  {pipelineSteps.map((step, index) => (
                    <div key={step.id} style={{ 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column',
                      backgroundColor: '#1e1e1e',
                      minWidth: '300px'
                    }}>
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#2d2d30',
                        borderBottom: '1px solid #3e3e42',
                        fontSize: '12px',
                        color: '#cccccc'
                      }}>
                        {step.type} {index > 0 && '← ' + pipelineSteps[index - 1].type}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <Editor
                          height="50%"
                          language={step.language}
                          value={step.code}
                          onChange={(value) => updateStepCode(step.id, value || '')}
                          theme="vs-dark"
                          options={{
                            minimap: { enabled: false },
                            fontSize: 12,
                            lineNumbers: 'off',
                            scrollBeyondLastLine: false,
                            automaticLayout: true
                          }}
                        />
                        
                        <div style={{
                          height: '50%',
                          backgroundColor: '#0e0e0e',
                          border: '1px solid #3e3e42',
                          borderTop: 'none'
                        }}>
                          <Editor
                            height="100%"
                            language="json"
                            value={step.output || '// Output will appear here'}
                            theme="vs-dark"
                            options={{
                              readOnly: true,
                              minimap: { enabled: false },
                              fontSize: 11,
                              lineNumbers: 'off',
                              scrollBeyondLastLine: false,
                              automaticLayout: true
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Single editor for configs, variables, tests, or single view mode
                <Editor
                  height="100%"
                  language={
                    selectedElement ? (
                      selectedElement.type === 'config' ? 'text' :
                      selectedElement.type === 'variable' ? getLanguageForType(selectedElement.data.varType) :
                      selectedElement.type === 'test' ? 'text' :
                      selectedElement.type === 'route' ? 'yaml' :
                      'text'
                    ) : 'text'
                  }
                  value={
                    selectedElement ? (
                      selectedElement.type === 'config' ? printConfig(selectedElement.data) :
                      selectedElement.type === 'variable' ? selectedElement.data.value :
                      selectedElement.type === 'test' ? printDescribe(selectedElement.data) :
                      selectedElement.type === 'route' && pipelineSteps.length > 0 ? pipelineSteps[0]?.code || '' :
                      'Select an element to edit'
                    ) : 'Select an element from the sidebar to edit'
                  }
                  onChange={(value) => {
                    // Handle updates to configs, variables, tests
                    if (selectedElement?.type === 'variable') {
                      // Update variable value
                      console.log('Update variable:', value);
                    } else if (selectedElement?.type === 'config') {
                      // Update config properties
                      console.log('Update config:', value);
                    }
                  }}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    automaticLayout: true,
                    readOnly: selectedElement?.type === 'test'
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Output Panel */}
      <div style={{
        width: '300px',
        backgroundColor: '#252526',
        borderLeft: '1px solid #3e3e42',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#2d2d30',
          borderBottom: '1px solid #3e3e42',
          fontSize: '14px',
          color: '#cccccc'
        }}>
          Output
        </div>
        <div style={{ flex: 1, padding: '16px' }}>
          <div style={{
            backgroundColor: '#0e0e0e',
            border: '1px solid #3e3e42',
            borderRadius: '4px',
            padding: '12px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            {/* Mock output for now */}
            <pre style={{ margin: 0, color: '#d4d4d4' }}>
{`{
  "result": "Pipeline output will appear here",
  "timestamp": "2025-08-13T19:46:36Z"
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;