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

  return {
    webpipeSource,
    setWebpipeSource,
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
    updateStepCode
  };
};