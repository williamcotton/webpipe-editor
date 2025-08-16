import { useState, useEffect, useRef } from 'react';
import { parseProgram, prettyPrint } from 'webpipe-js';
import { PipelineStep, SelectedElement, ViewMode } from '../types';
import { getDefaultCode, availableOperations, extractStepsFromPipeline } from '../utils';
import { WebpipeInstance, buildServerUrlFromInstance } from '../utils/processUtils';
import { extractVariableDefinitions, VariableDefinition } from '../utils/jumpToDefinition';

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
  const pipelineStepsRef = useRef<PipelineStep[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [selectedStep, setSelectedStep] = useState<string>('');
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('flow');
  const [parsedData, setParsedData] = useState<any>(null);
  const [serverBaseUrl, setServerBaseUrl] = useState<string>('');
  const [routeTestInputs, setRouteTestInputs] = useState<Record<string, string>>({});
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [isUpdatingFromSave, setIsUpdatingFromSave] = useState<boolean>(false);
  const [variableDefinitions, setVariableDefinitions] = useState<VariableDefinition[]>([]);

  // Sync pipelineSteps state with ref
  useEffect(() => {
    pipelineStepsRef.current = pipelineSteps;
  }, [pipelineSteps]);

  // Initialize with empty content
  useEffect(() => {
    setWebpipeSource('');
  }, []);

  // Parse webpipe source when it changes
  useEffect(() => {
    if (!webpipeSource.trim()) return;
    
    const parseWebpipeSource = async () => {
      try {
        const parsed = parseProgram(webpipeSource);
        setParsedData(parsed);
        
        // Extract variable definitions for jump-to-definition functionality
        const definitions = extractVariableDefinitions(parsed, webpipeSource);
        setVariableDefinitions(definitions);
        
        // Only auto-select first route if no route is currently selected and not updating from save
        if (parsed && parsed.routes && parsed.routes.length > 0 && !selectedElement && !isUpdatingFromSave) {
          const firstRoute = parsed.routes[0];
          
          let steps: PipelineStep[] = [];
          // Handle the actual webpipe-js structure: route.pipeline.pipeline.steps
          if ((firstRoute.pipeline as any)?.pipeline?.steps) {
            const routePrefix = `${firstRoute.method}-${firstRoute.path}`;
            steps = extractStepsFromPipeline((firstRoute.pipeline as any).pipeline.steps, routePrefix);
          }

          setPipelineSteps(steps);
          setSelectedRoute(`${firstRoute.method} ${firstRoute.path}`);
        }
      } catch (error) {
        console.error('Failed to parse webpipe source:', error);
      }
    };
    
    parseWebpipeSource();
    
    // Reset the flag after parsing
    if (isUpdatingFromSave) {
      setIsUpdatingFromSave(false);
    }
  }, [webpipeSource, selectedElement, isUpdatingFromSave]);

  // Convert pipeline steps back to webpipe format
  const convertStepsToWebpipeFormat = (steps: PipelineStep[]): any[] => {
    return steps.map(step => {
      if (step.type === 'result' && step.branches) {
        // Handle result blocks
        return {
          kind: 'Result',
          branches: step.branches.map(branch => {
            // Extract branch type from the format like "ok(200)" or "error(404)"
            const branchTypeMatch = branch.branchType.match(/^([^(]+)\((\d+)\)$/);
            const branchTypeName = branchTypeMatch ? branchTypeMatch[1] : 'ok';
            const statusCode = branchTypeMatch ? parseInt(branchTypeMatch[2]) : 200;
            
            // Convert branch type back to webpipe format
            let branchTypeObj;
            if (branchTypeName === 'ok') {
              branchTypeObj = { kind: 'Ok' };
            } else if (branchTypeName === 'error') {
              branchTypeObj = { kind: 'Error' };
            } else {
              branchTypeObj = { kind: 'Custom', name: branchTypeName };
            }
            
            return {
              branchType: branchTypeObj,
              statusCode: statusCode,
              pipeline: {
                steps: convertStepsToWebpipeFormat(branch.steps)
              }
            };
          })
        };
      } else {
        // Handle regular steps
        return {
          kind: 'Regular',
          name: step.type,
          config: step.code
        };
      }
    });
  };

  // Update webpipe source when pipeline steps change
  const updateWebpipeSource = (): string | null => {
    try {
      const currentSteps = pipelineStepsRef.current.length > 0 ? pipelineStepsRef.current : pipelineSteps;
      
      if (parsedData && selectedElement?.type === 'route' && currentSteps.length > 0) {
        const updatedData = {
          ...parsedData,
          routes: parsedData.routes.map((route: any) => {
            // Use method and path to match instead of object reference
            if (route.method === selectedElement.data.method && route.path === selectedElement.data.path) {
              return {
                ...route,
                pipeline: {
                  ...route.pipeline,
                  pipeline: {
                    steps: convertStepsToWebpipeFormat(currentSteps)
                  }
                }
              };
            }
            return route;
          })
        };
        
        const formatted = prettyPrint(updatedData);
        
        if (formatted) {
          setIsUpdatingFromSave(true);
          setWebpipeSource(formatted);
          return formatted;
        } else {
          console.error('prettyPrint returned empty result');
          return null;
        }
      } else {
        return webpipeSource; // Return current source if no update needed
      }
    } catch (error) {
      console.error('Failed to update webpipe source:', error);
      return null;
    }
  };

  const normalizeBaseUrl = (base: string): string => {
    if (!base) return '';
    let normalized = base.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `http://${normalized}`;
    }
    // remove trailing slash
    normalized = normalized.replace(/\/$/, '');
    return normalized;
  };

  const buildRouteUrl = (baseUrl: string, routePath: string, override?: string): string | null => {
    if (override && /^https?:\/\//i.test(override.trim())) {
      return override.trim();
    }
    const base = normalizeBaseUrl(baseUrl || '');
    if (!base) return null;
    const path = (override && override.trim()) || routePath || '';
    const withLeading = path.startsWith('/') ? path : `/${path}`;
    return `${base}${withLeading}`;
  };

  const setRouteTestInput = (routeKey: string, value: string) => {
    setRouteTestInputs(prev => ({ ...prev, [routeKey]: value }));
  };

  const testRouteGet = async (route: any, overridePathOrUrl?: string) => {
    try {
      const routeKey = `${route.method} ${route.path}`;
      const input = overridePathOrUrl ?? routeTestInputs[routeKey] ?? route.path;
      const url = buildRouteUrl(serverBaseUrl, route.path, input);
      if (!url) {
        setLastResponse({ ok: false, timestamp: Date.now(), error: 'Base URL is not set' });
        return;
      }
      if (window.electronAPI && window.electronAPI.httpGet) {
        const res = await window.electronAPI.httpGet(url);
        setLastResponse({ url, timestamp: Date.now(), ...res });
      } else {
        // Fallback in web dev mode: try fetch directly (may hit CORS)
        const r = await fetch(url);
        const text = await r.text();
        let body: any = text;
        try { body = JSON.parse(text); } catch {}
        setLastResponse({
          url,
          timestamp: Date.now(),
          ok: r.ok,
          status: r.status,
          statusText: r.statusText,
          headers: Object.fromEntries(r.headers.entries()),
          body
        });
      }
    } catch (error) {
      setLastResponse({ ok: false, timestamp: Date.now(), error: String(error) });
    }
  };

  const addStep = (type: string) => {
    let newStep: PipelineStep;
    
    if (type === 'result') {
      newStep = {
        id: Date.now().toString(),
        type: 'result',
        language: 'text',
        code: '',
        output: '',
        branches: [
          {
            id: `branch-ok-${Date.now()}`,
            branchType: 'ok(200)',
            statusCode: 200,
            steps: []
          },
          {
            id: `branch-error-${Date.now() + 1}`,
            branchType: 'error(500)',
            statusCode: 500,
            steps: []
          }
        ]
      };
    } else {
      const operation = availableOperations.find(op => op.type === type);
      if (!operation) return;
      
      newStep = {
        id: Date.now().toString(),
        type: operation.type,
        language: operation.language,
        code: getDefaultCode(operation.type),
        output: ''
      };
    }
    
    const newSteps = [...pipelineSteps, newStep];
    setPipelineSteps(newSteps);
  };

  const deleteStep = (stepId: string) => {
    setPipelineSteps(steps => {
      // Remove the step from the main pipeline
      const updatedSteps = steps.filter(step => {
        if (step.id === stepId) {
          return false; // Remove this step
        }
        
        // Also remove from result block branches
        if (step.type === 'result' && step.branches) {
          step.branches = step.branches.map(branch => ({
            ...branch,
            steps: branch.steps.filter(branchStep => branchStep.id !== stepId)
          }));
        }
        
        return true;
      });
      
      pipelineStepsRef.current = updatedSteps;
      return updatedSteps;
    });
    setIsModified(true);
  };

  const updatePipelineStructure = (newSteps: PipelineStep[]) => {
    setPipelineSteps(newSteps);
    pipelineStepsRef.current = newSteps;
    setIsModified(true);
  };

  const updateStepCode = (stepId: string, code: string) => {
    setPipelineSteps(steps => {
      const updatedSteps = steps.map(step => {
        // Direct match for regular steps
        if (step.id === stepId) {
          return { ...step, code };
        }
        
        // Check branches for result blocks
        if (step.type === 'result' && step.branches) {
          const updatedBranches = step.branches.map(branch => ({
            ...branch,
            steps: branch.steps.map(branchStep =>
              branchStep.id === stepId ? { ...branchStep, code } : branchStep
            )
          }));
          
          // Check if any branch step was updated
          const wasUpdated = step.branches.some(branch =>
            branch.steps.some(branchStep => branchStep.id === stepId)
          );
          
          if (wasUpdated) {
            return { ...step, branches: updatedBranches };
          }
        }
        
        return step;
      });
      pipelineStepsRef.current = updatedSteps; // Update ref immediately
      return updatedSteps;
    });
    // Mark as modified when step code changes
    setIsModified(true);
  };

  const createNewRoute = () => {
    // Generate unique route path by checking existing routes
    let counter = 1;
    let newPath = '/new-route';
    
    if (parsedData && parsedData.routes) {
      while (parsedData.routes.some((route: any) => route.path === newPath)) {
        counter++;
        newPath = `/new-route-${counter}`;
      }
    }
    
    const newRoute = {
      method: 'GET',
      path: newPath,
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

    // Update webpipe source from current pipeline steps before saving
    const updatedSource = updateWebpipeSource();
    let sourceToSave = updatedSource !== null ? updatedSource : webpipeSource;
    
    // Ensure sourceToSave is always a string
    if (typeof sourceToSave !== 'string') {
      console.error('sourceToSave is not a string:', typeof sourceToSave, sourceToSave);
      sourceToSave = String(sourceToSave);
    }

    if (currentFilePath) {
      // Save to existing file
      const success = await window.electronAPI.saveFileToPath(currentFilePath, sourceToSave);
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

    // Update webpipe source from current pipeline steps before saving
    const updatedSource = updateWebpipeSource();
    const sourceToSave = updatedSource !== null ? updatedSource : webpipeSource;

    const filePath = await window.electronAPI.showSaveDialog(currentFilePath || 'untitled.wp');
    if (filePath) {
      const success = await window.electronAPI.saveFileToPath(filePath, sourceToSave);
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
    setIsModified(true);
  };

  // Handle webpipe instance selection
  const handleInstanceSelect = (instance: WebpipeInstance) => {
    const serverUrl = buildServerUrlFromInstance(instance);
    setServerBaseUrl(serverUrl);
  };

  // Handle opening file from webpipe instance
  const handleOpenFile = async (filePath: string) => {
    if (!window.electronAPI) return;
    
    try {
      const content = await window.electronAPI.loadFile(filePath);
      setWebpipeSource(content);
      setCurrentFilePath(filePath);
      setIsModified(false);
      setSelectedElement(null);
      setViewMode('source');
      if (window.electronAPI) {
        window.electronAPI.setWindowTitle(`WebPipe Editor - ${filePath}`);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
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
    deleteStep,
    updatePipelineStructure,
    updateStepCode,
    createNewRoute,
    createNewTest,
    createNewVariable,
    createNewPipeline,
    createNewConfig,
    updateElementName,
    deleteElement,
    deleteSpecificElement,
    serverBaseUrl,
    setServerBaseUrl,
    routeTestInputs,
    setRouteTestInput,
    lastResponse,
    testRouteGet,
    handleInstanceSelect,
    handleOpenFile,
    variableDefinitions
  };
};