import { useState, useEffect, useCallback, useRef } from 'react';
import { parseProgram, prettyPrint } from 'webpipe-js';
import { SelectedElement, PipelineStep } from '../types';
import { extractStepsFromPipeline } from '../utils';
import { extractVariableDefinitions, extractPipelineDefinitions, VariableDefinition, PipelineDefinition } from '../utils/jumpToDefinition';

interface UseWebpipeParserProps {
  webpipeSource: string;
  selectedElement: SelectedElement | null;
  isUpdatingFromSave: boolean;
  isUpdatingFromExternalChange: boolean;
  setIsUpdatingFromSave: (value: boolean) => void;
  setIsUpdatingFromExternalChange: (value: boolean) => void;
  onParsedDataChange?: (data: any) => void;
  onFirstRouteSelect?: (route: any, steps: PipelineStep[]) => void;
}

export const useWebpipeParser = ({
  webpipeSource,
  selectedElement,
  isUpdatingFromSave,
  isUpdatingFromExternalChange,
  setIsUpdatingFromSave,
  setIsUpdatingFromExternalChange,
  onParsedDataChange,
  onFirstRouteSelect
}: UseWebpipeParserProps) => {
  const [parsedData, setParsedData] = useState<any>(null);
  const [variableDefinitions, setVariableDefinitions] = useState<VariableDefinition[]>([]);
  const [pipelineDefinitions, setPipelineDefinitions] = useState<PipelineDefinition[]>([]);
  
  // Use refs to store the latest callback functions
  const onParsedDataChangeRef = useRef(onParsedDataChange);
  const onFirstRouteSelectRef = useRef(onFirstRouteSelect);
  
  // Update refs when callbacks change
  useEffect(() => {
    onParsedDataChangeRef.current = onParsedDataChange;
  }, [onParsedDataChange]);
  
  useEffect(() => {
    onFirstRouteSelectRef.current = onFirstRouteSelect;
  }, [onFirstRouteSelect]);

  useEffect(() => {
    if (!webpipeSource.trim()) return;
    
    const parseWebpipeSource = async () => {
      try {
        const parsed = parseProgram(webpipeSource);
        setParsedData(parsed);
        
        if (onParsedDataChangeRef.current) {
          onParsedDataChangeRef.current(parsed);
        }
        
        const definitions = extractVariableDefinitions(parsed, webpipeSource);
        setVariableDefinitions(definitions);
        
        const pipelineDefinitions = extractPipelineDefinitions(parsed, webpipeSource);
        setPipelineDefinitions(pipelineDefinitions);
        
        if (parsed && parsed.routes && parsed.routes.length > 0 && !selectedElement && !isUpdatingFromSave && !isUpdatingFromExternalChange) {
          const firstRoute = parsed.routes[0];
          
          let steps: PipelineStep[] = [];
          if ((firstRoute.pipeline as any)?.pipeline?.steps) {
            const routePrefix = `${firstRoute.method}-${firstRoute.path}`;
            steps = extractStepsFromPipeline((firstRoute.pipeline as any).pipeline.steps, routePrefix);
          }

          if (onFirstRouteSelectRef.current) {
            onFirstRouteSelectRef.current(firstRoute, steps);
          }
        }
      } catch (error) {
        console.error('Failed to parse webpipe source:', error);
      }
    };
    
    parseWebpipeSource();
    
    if (isUpdatingFromSave) {
      setIsUpdatingFromSave(false);
    }
    if (isUpdatingFromExternalChange) {
      setIsUpdatingFromExternalChange(false);
    }
  }, [
    webpipeSource, 
    selectedElement, 
    isUpdatingFromSave, 
    isUpdatingFromExternalChange,
    setIsUpdatingFromSave,
    setIsUpdatingFromExternalChange
  ]);

  const convertStepsToWebpipeFormat = useCallback((steps: PipelineStep[]): any[] => {
    return steps.map(step => {
      if (step.type === 'result' && step.branches) {
        return {
          kind: 'Result',
          branches: step.branches.map(branch => {
            const branchTypeMatch = branch.branchType.match(/^([^(]+)\((\d+)\)$/);
            const branchTypeName = branchTypeMatch ? branchTypeMatch[1] : 'ok';
            const statusCode = branchTypeMatch ? parseInt(branchTypeMatch[2]) : 200;
            
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
        // Determine the correct configType based on the step type and content
        let configType = 'backtick';
        if (step.type === 'pipeline') {
          configType = 'identifier';
        } else if (step.code) {
          // Trim whitespace to handle multiline content properly
          const trimmedCode = step.code.trim();
          // Check if it's a simple identifier (no backticks, no whitespace, no special chars)
          const isSimpleIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedCode);
          
          if (isSimpleIdentifier) {
            configType = 'identifier';
          }
          // Otherwise keep 'backtick' for all other content (including multiline backtick content)
        }
        
        return {
          kind: 'Regular',
          name: step.type,
          config: step.code,
          configType: configType
        };
      }
    });
  }, []);

  const updateParsedDataFromSteps = useCallback((
    currentSteps: PipelineStep[], 
    selectedElement: SelectedElement | null,
    setWebpipeSource: (source: string) => void,
    setIsUpdatingFromSave: (value: boolean) => void
  ): string | null => {
    try {
      if (parsedData && selectedElement?.type === 'route' && currentSteps.length > 0) {
        const updatedData = {
          ...parsedData,
          routes: parsedData.routes.map((route: any) => {
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
          setParsedData(updatedData);
          return formatted;
        } else {
          console.error('prettyPrint returned empty result');
          return null;
        }
      } else if (parsedData && selectedElement?.type === 'pipeline' && currentSteps.length > 0) {
        const updatedData = {
          ...parsedData,
          pipelines: parsedData.pipelines.map((pipeline: any) => {
            if (pipeline.name === selectedElement.data.name) {
              return {
                ...pipeline,
                pipeline: {
                  steps: convertStepsToWebpipeFormat(currentSteps)
                }
              };
            }
            return pipeline;
          })
        };
        
        const formatted = prettyPrint(updatedData);
        
        if (formatted) {
          setIsUpdatingFromSave(true);
          setWebpipeSource(formatted);
          setParsedData(updatedData);
          return formatted;
        } else {
          console.error('prettyPrint returned empty result for pipeline');
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to update webpipe source:', error);
      return null;
    }
  }, [parsedData, convertStepsToWebpipeFormat]);

  const updateParsedData = useCallback((newData: any, setWebpipeSource: (source: string) => void) => {
    setParsedData(newData);
    const formatted = prettyPrint(newData);
    if (formatted) {
      setWebpipeSource(formatted);
    }
  }, []);

  return {
    parsedData,
    setParsedData,
    variableDefinitions,
    pipelineDefinitions,
    convertStepsToWebpipeFormat,
    updateParsedDataFromSteps,
    updateParsedData
  };
};