import { useState, useCallback } from 'react';
import { parseProgram } from 'webpipe-js';
import { PipelineStep, SelectedElement, ViewMode } from '../types';
import { extractStepsFromPipeline } from '../utils';
import { useFileOperations } from './useFileOperations';
import { useWebpipeParser } from './useWebpipeParser';
import { usePipelineSteps } from './usePipelineSteps';
import { useElementOperations } from './useElementOperations';
import { useServerTesting } from './useServerTesting';


export const useWebpipe = () => {
  const [webpipeSource, setWebpipeSource] = useState<string>('');
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('flow');
  const [isUpdatingFromSave, setIsUpdatingFromSave] = useState<boolean>(false);
  const [isUpdatingFromExternalChange, setIsUpdatingFromExternalChange] = useState<boolean>(false);


  // Initialize pipeline steps management first (no dependencies)
  const pipelineSteps = usePipelineSteps({
    selectedElement
  });
  
  // Create stable callback functions
  const handleFirstRouteSelect = useCallback((route: any, steps: PipelineStep[]) => {
    pipelineSteps.setPipelineSteps(steps);
    pipelineSteps.setSelectedRoute(`${route.method} ${route.path}`);
  }, [pipelineSteps]);
  
  const handleExternalFileChange = useCallback((content: string) => {
    if (selectedElement?.type === 'route') {
      setTimeout(() => {
        try {
          const parsed = parseProgram(content);
          if (parsed?.routes) {
            const currentRoute = parsed.routes.find((route: any) =>
              route.method === selectedElement.data.method && route.path === selectedElement.data.path
            );
            
            if (currentRoute && (currentRoute.pipeline as any)?.pipeline?.steps) {
              const routePrefix = `${currentRoute.method}-${currentRoute.path}`;
              const updatedSteps = extractStepsFromPipeline((currentRoute.pipeline as any).pipeline.steps, routePrefix);
              pipelineSteps.setPipelineSteps(updatedSteps);
            }
          }
        } catch (error) {
          console.error('Failed to refresh pipeline steps after external change:', error);
        }
      }, 50);
    }
  }, [selectedElement, pipelineSteps]);
  
  // Initialize parser
  const parser = useWebpipeParser({
    webpipeSource,
    selectedElement,
    isUpdatingFromSave,
    isUpdatingFromExternalChange,
    setIsUpdatingFromSave,
    setIsUpdatingFromExternalChange,
    onFirstRouteSelect: handleFirstRouteSelect
  });
  
  const updateWebpipeSource = useCallback(() => {
    return parser.updateParsedDataFromSteps(
      pipelineSteps.getCurrentSteps(),
      selectedElement,
      setWebpipeSource,
      setIsUpdatingFromSave
    ) || webpipeSource;
  }, [parser, pipelineSteps, selectedElement, setIsUpdatingFromSave, webpipeSource]);
  
  // Initialize server testing early so we can use it in file change callback
  const serverTesting = useServerTesting();

  // Enhanced external file change handler that also re-runs tests
  const handleExternalFileChangeWithTesting = useCallback((content: string) => {
    handleExternalFileChange(content);
    
    // Auto re-test current route if conditions are met
    if (selectedElement?.type === 'route' && serverTesting.serverBaseUrl) {
      setTimeout(() => {
        serverTesting.testRouteGet(selectedElement.data);
      }, 200); // Small delay to ensure parsing is complete
    }
  }, [handleExternalFileChange, selectedElement, serverTesting]);
  
  // Initialize file operations
  const fileOperations = useFileOperations({
    webpipeSource,
    setWebpipeSource,
    setSelectedElement,
    setViewMode,
    updateWebpipeSource,
    setIsUpdatingFromExternalChange,
    onExternalFileChange: handleExternalFileChangeWithTesting
  });
  
  // Update pipeline steps setIsModified callback now that file operations is initialized
  pipelineSteps.updateSetIsModified(fileOperations.setIsModified);
  
  // Initialize element operations
  const elementOperations = useElementOperations({
    parsedData: parser.parsedData,
    selectedElement,
    setSelectedElement,
    setViewMode,
    updateParsedData: parser.updateParsedData,
    setWebpipeSource
  });
  
  const setWebpipeSourceWithModified = useCallback((source: string) => {
    setWebpipeSource(source);
    fileOperations.setIsModified(true);
  }, [fileOperations]);


  return {
    // Core state
    webpipeSource,
    setWebpipeSource: setWebpipeSourceWithModified,
    selectedElement,
    setSelectedElement,
    viewMode,
    setViewMode,
    
    // File operations
    currentFilePath: fileOperations.currentFilePath,
    isModified: fileOperations.isModified,
    handleOpenFile: fileOperations.handleOpenFile,
    
    // Parser data
    parsedData: parser.parsedData,
    variableDefinitions: parser.variableDefinitions,
    pipelineDefinitions: parser.pipelineDefinitions,
    updateWebpipeSource,
    
    // Pipeline steps
    pipelineSteps: pipelineSteps.pipelineSteps,
    setPipelineSteps: pipelineSteps.setPipelineSteps,
    selectedRoute: pipelineSteps.selectedRoute,
    setSelectedRoute: pipelineSteps.setSelectedRoute,
    selectedStep: pipelineSteps.selectedStep,
    setSelectedStep: pipelineSteps.setSelectedStep,
    addStep: pipelineSteps.addStep,
    deleteStep: pipelineSteps.deleteStep,
    updatePipelineStructure: pipelineSteps.updatePipelineStructure,
    updateStepCode: pipelineSteps.updateStepCode,
    
    // Element operations
    createNewRoute: elementOperations.createNewRoute,
    createNewTest: elementOperations.createNewTest,
    createNewVariable: elementOperations.createNewVariable,
    createNewPipeline: elementOperations.createNewPipeline,
    createNewConfig: elementOperations.createNewConfig,
    updateElementName: elementOperations.updateElementName,
    updateElementValue: elementOperations.updateElementValue,
    deleteElement: elementOperations.deleteElement,
    deleteSpecificElement: elementOperations.deleteSpecificElement,
    
    // Server testing
    serverBaseUrl: serverTesting.serverBaseUrl,
    setServerBaseUrl: serverTesting.setServerBaseUrl,
    routeTestInputs: serverTesting.routeTestInputs,
    setRouteTestInput: serverTesting.setRouteTestInput,
    lastResponse: serverTesting.lastResponse,
    testRouteGet: serverTesting.testRouteGet,
    handleInstanceSelect: serverTesting.handleInstanceSelect
  };
};