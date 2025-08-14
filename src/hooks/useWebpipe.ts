import { useState, useEffect } from 'react';
import { parseProgram, prettyPrint } from 'webpipe-js';
import { PipelineStep, SelectedElement, ViewMode } from '../types';
import { getLanguageForType, getDefaultCode, availableOperations } from '../utils';

const DEFAULT_CONTENT = [
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

export const useWebpipe = () => {
  const [webpipeSource, setWebpipeSource] = useState<string>('');
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isModified, setIsModified] = useState<boolean>(false);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [selectedStep, setSelectedStep] = useState<string>('');
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('source');
  const [parsedData, setParsedData] = useState<any>(null);

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
        setWebpipeSource(DEFAULT_CONTENT);
      }
    };
    
    loadTestFile();
  }, []);

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
          if ((firstRoute.pipeline as any)?.pipeline?.steps) {
            steps = (firstRoute.pipeline as any).pipeline.steps.map((step: any, index: number) => {
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
  };

  const updateStepCode = (stepId: string, code: string) => {
    setPipelineSteps(steps => 
      steps.map(step => 
        step.id === stepId ? { ...step, code } : step
      )
    );
  };

  const createNewRoute = () => {
    const newRoute = {
      method: 'GET',
      path: '/new-route',
      pipeline: {
        kind: 'Inline',
        pipeline: {
          steps: [
            {
              kind: 'Regular',
              name: 'jq',
              config: '{ message: "Hello from new route" }'
            }
          ]
        }
      }
    };

    if (parsedData) {
      const updatedData = {
        ...parsedData,
        routes: [...(parsedData.routes || []), newRoute]
      };
      setParsedData(updatedData);
      const formatted = prettyPrint(updatedData);
      if (formatted) setWebpipeSource(formatted);
    }
  };

  const createNewTest = () => {
    const newTest = {
      name: 'new test',
      mocks: [],
      tests: [
        {
          name: 'should work',
          mocks: [],
          when: {
            kind: 'CallingRoute',
            method: 'GET',
            path: '/new-route'
          },
          input: null,
          conditions: [
            {
              field: 'status',
              comparison: 'equals',
              value: '200',
              conditionType: 'then'
            }
          ]
        }
      ]
    };

    if (parsedData) {
      const updatedData = {
        ...parsedData,
        describes: [...(parsedData.describes || []), newTest]
      };
      setParsedData(updatedData);
      const formatted = prettyPrint(updatedData);
      if (formatted) setWebpipeSource(formatted);
    }
  };

  const createNewVariable = () => {
    const newVariable = {
      varType: 'jq',
      name: 'newVariable',
      value: '{ message: "Hello from variable" }'
    };

    if (parsedData) {
      const updatedData = {
        ...parsedData,
        variables: [...(parsedData.variables || []), newVariable]
      };
      setParsedData(updatedData);
      const formatted = prettyPrint(updatedData);
      if (formatted) setWebpipeSource(formatted);
    }
  };

  const createNewPipeline = () => {
    const newPipeline = {
      name: 'newPipeline',
      pipeline: {
        steps: [
          {
            kind: 'Regular',
            name: 'jq',
            config: '{ message: "Hello from pipeline" }'
          }
        ]
      }
    };

    if (parsedData) {
      const updatedData = {
        ...parsedData,
        pipelines: [...(parsedData.pipelines || []), newPipeline]
      };
      setParsedData(updatedData);
      const formatted = prettyPrint(updatedData);
      if (formatted) setWebpipeSource(formatted);
    }
  };

  const createNewConfig = () => {
    const newConfig = {
      name: 'newConfig',
      properties: [
        {
          key: 'enabled',
          value: {
            kind: 'Boolean',
            value: true
          }
        }
      ]
    };

    if (parsedData) {
      const updatedData = {
        ...parsedData,
        configs: [...(parsedData.configs || []), newConfig]
      };
      setParsedData(updatedData);
      const formatted = prettyPrint(updatedData);
      if (formatted) setWebpipeSource(formatted);
    }
  };

  const updateElementName = (newName: string) => {
    if (!selectedElement || !parsedData) return;

    let updatedData = { ...parsedData };
    let updatedSelectedElement = { ...selectedElement };

    switch (selectedElement.type) {
      case 'route':
        // For routes, parse method and path from the new name
        const routeParts = newName.split(' ');
        if (routeParts.length >= 2) {
          const method = routeParts[0];
          const path = routeParts.slice(1).join(' ');
          updatedData.routes = parsedData.routes.map((route: any) => {
            if (route.method === selectedElement.data.method && route.path === selectedElement.data.path) {
              const updatedRoute = { ...route, method, path };
              updatedSelectedElement.data = updatedRoute;
              return updatedRoute;
            }
            return route;
          });
        }
        break;
        
      case 'test':
        updatedData.describes = parsedData.describes.map((test: any) => {
          if (test.name === selectedElement.data.name) {
            const updatedTest = { ...test, name: newName };
            updatedSelectedElement.data = updatedTest;
            return updatedTest;
          }
          return test;
        });
        break;
        
      case 'variable':
        updatedData.variables = parsedData.variables.map((variable: any) => {
          if (variable.name === selectedElement.data.name) {
            const updatedVariable = { ...variable, name: newName };
            updatedSelectedElement.data = updatedVariable;
            return updatedVariable;
          }
          return variable;
        });
        break;
        
      case 'pipeline':
        updatedData.pipelines = parsedData.pipelines.map((pipeline: any) => {
          if (pipeline.name === selectedElement.data.name) {
            const updatedPipeline = { ...pipeline, name: newName };
            updatedSelectedElement.data = updatedPipeline;
            return updatedPipeline;
          }
          return pipeline;
        });
        break;
        
      case 'config':
        updatedData.configs = parsedData.configs.map((config: any) => {
          if (config.name === selectedElement.data.name) {
            const updatedConfig = { ...config, name: newName };
            updatedSelectedElement.data = updatedConfig;
            return updatedConfig;
          }
          return config;
        });
        break;
    }

    setParsedData(updatedData);
    setSelectedElement(updatedSelectedElement);
    const formatted = prettyPrint(updatedData);
    if (formatted) setWebpipeSource(formatted);
  };

  const deleteElement = () => {
    if (!selectedElement || !parsedData) return;

    let updatedData = { ...parsedData };

    switch (selectedElement.type) {
      case 'route':
        updatedData.routes = parsedData.routes.filter((route: any) => 
          !(route.method === selectedElement.data.method && route.path === selectedElement.data.path)
        );
        break;
        
      case 'test':
        updatedData.describes = parsedData.describes.filter((test: any) => 
          test.name !== selectedElement.data.name
        );
        break;
        
      case 'variable':
        updatedData.variables = parsedData.variables.filter((variable: any) => 
          variable.name !== selectedElement.data.name
        );
        break;
        
      case 'pipeline':
        updatedData.pipelines = parsedData.pipelines.filter((pipeline: any) => 
          pipeline.name !== selectedElement.data.name
        );
        break;
        
      case 'config':
        updatedData.configs = parsedData.configs.filter((config: any) => 
          config.name !== selectedElement.data.name
        );
        break;
    }

    setParsedData(updatedData);
    setSelectedElement(null); // Clear selection after delete
    setViewMode('source'); // Return to source view
    const formatted = prettyPrint(updatedData);
    if (formatted) setWebpipeSource(formatted);
  };

  const deleteSpecificElement = (elementType: string, elementData: any) => {
    if (!parsedData) return;

    let updatedData = { ...parsedData };

    switch (elementType) {
      case 'route':
        updatedData.routes = parsedData.routes.filter((route: any) => 
          !(route.method === elementData.method && route.path === elementData.path)
        );
        break;
        
      case 'test':
        updatedData.describes = parsedData.describes.filter((test: any) => 
          test.name !== elementData.name
        );
        break;
        
      case 'variable':
        updatedData.variables = parsedData.variables.filter((variable: any) => 
          variable.name !== elementData.name
        );
        break;
        
      case 'pipeline':
        updatedData.pipelines = parsedData.pipelines.filter((pipeline: any) => 
          pipeline.name !== elementData.name
        );
        break;
        
      case 'config':
        updatedData.configs = parsedData.configs.filter((config: any) => 
          config.name !== elementData.name
        );
        break;
    }

    // Clear selection if we deleted the currently selected element
    if (selectedElement && 
        selectedElement.type === elementType && 
        ((elementType === 'route' && selectedElement.data.method === elementData.method && selectedElement.data.path === elementData.path) ||
         (elementType !== 'route' && selectedElement.data.name === elementData.name))) {
      setSelectedElement(null);
      setViewMode('source');
    }

    setParsedData(updatedData);
    const formatted = prettyPrint(updatedData);
    if (formatted) setWebpipeSource(formatted);
  };

  // File operations
  const handleNewFile = () => {
    setWebpipeSource(DEFAULT_CONTENT);
    setCurrentFilePath(null);
    setIsModified(false);
    setSelectedElement(null);
    setViewMode('source');
    if (window.electronAPI) {
      window.electronAPI.setWindowTitle('WebPipe Editor - Untitled');
    }
  };

  const handleFileOpened = (data: { filePath: string; content: string }) => {
    setWebpipeSource(data.content);
    setCurrentFilePath(data.filePath);
    setIsModified(false);
    setSelectedElement(null);
    setViewMode('source');
  };

  const handleSave = async () => {
    if (!window.electronAPI) return;

    if (currentFilePath) {
      // Save to existing file
      const success = await window.electronAPI.saveFileToPath(currentFilePath, webpipeSource);
      if (success) {
        setIsModified(false);
      }
    } else {
      // No current file, trigger Save As
      handleSaveAs();
    }
  };

  const handleSaveAs = async () => {
    if (!window.electronAPI) return;

    const filePath = await window.electronAPI.showSaveDialog(currentFilePath || 'untitled.wp');
    if (filePath) {
      const success = await window.electronAPI.saveFileToPath(filePath, webpipeSource);
      if (success) {
        setCurrentFilePath(filePath);
        setIsModified(false);
      }
    }
  };

  const handleClose = () => {
    if (isModified) {
      // TODO: Show unsaved changes dialog
      console.warn('File has unsaved changes');
    }
    handleNewFile();
  };

  // Set up menu event listeners
  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.onFileNew(handleNewFile);
    window.electronAPI.onFileOpened(handleFileOpened);
    window.electronAPI.onFileSave(handleSave);
    window.electronAPI.onFileSaveAs(handleSaveAs);
    window.electronAPI.onFileClose(handleClose);

    return () => {
      window.electronAPI.removeAllListeners('file-new');
      window.electronAPI.removeAllListeners('file-opened');
      window.electronAPI.removeAllListeners('file-save');
      window.electronAPI.removeAllListeners('file-save-as');
      window.electronAPI.removeAllListeners('file-close');
    };
  }, [currentFilePath, isModified, webpipeSource]);

  // Track modifications
  const setWebpipeSourceWithModified = (source: string) => {
    setWebpipeSource(source);
    if (currentFilePath) {
      setIsModified(true);
    }
  };

  return {
    webpipeSource,
    setWebpipeSource: setWebpipeSourceWithModified,
    currentFilePath,
    isModified,
    pipelineSteps,
    setPipelineSteps,
    selectedRoute,
    setSelectedRoute,
    selectedStep,
    setSelectedStep,
    selectedElement,
    setSelectedElement,
    viewMode,
    setViewMode,
    parsedData,
    updateWebpipeSource,
    addStep,
    updateStepCode,
    createNewRoute,
    createNewTest,
    createNewVariable,
    createNewPipeline,
    createNewConfig,
    updateElementName,
    deleteElement,
    deleteSpecificElement
  };
};