import { useState, useEffect, useRef, useCallback } from 'react';
import { PipelineStep, SelectedElement } from '../types';
import { getDefaultCode, availableOperations, extractStepsFromPipeline } from '../utils';

interface UsePipelineStepsProps {
  selectedElement: SelectedElement | null;
  setIsModified?: (value: boolean) => void;
}

export const usePipelineSteps = ({ selectedElement, setIsModified = () => {} }: UsePipelineStepsProps) => {
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [selectedStep, setSelectedStep] = useState<string>('');
  const pipelineStepsRef = useRef<PipelineStep[]>([]);
  const setIsModifiedRef = useRef(setIsModified);
  
  // Update the ref when setIsModified changes
  useEffect(() => {
    setIsModifiedRef.current = setIsModified;
  }, [setIsModified]);

  useEffect(() => {
    pipelineStepsRef.current = pipelineSteps;
  }, [pipelineSteps]);

  useEffect(() => {
    if (!selectedElement) return;
    
    if (selectedElement.type === 'route') {
      const routeData = selectedElement.data;
      if (routeData.pipeline?.pipeline?.steps) {
        const routePrefix = `${routeData.method}-${routeData.path}`;
        const steps = extractStepsFromPipeline(routeData.pipeline.pipeline.steps, routePrefix);
        setPipelineSteps(steps);
        setSelectedRoute(`${routeData.method} ${routeData.path}`);
      }
    } else if (selectedElement.type === 'pipeline') {
      const pipelineData = selectedElement.data;
      const stepsArray = pipelineData.steps || pipelineData.pipeline?.steps;
      if (stepsArray) {
        const pipelinePrefix = `pipeline-${pipelineData.name}`;
        const steps = extractStepsFromPipeline(stepsArray, pipelinePrefix);
        setPipelineSteps(steps);
        setSelectedRoute('');
      }
    }
  }, [selectedElement]);

  const addStep = useCallback((type: string) => {
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
    setIsModifiedRef.current(true);
  }, [pipelineSteps, setIsModified]);

  const deleteStep = useCallback((stepId: string) => {
    setPipelineSteps(steps => {
      const updatedSteps = steps.filter(step => {
        if (step.id === stepId) {
          return false;
        }
        
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
    setIsModifiedRef.current(true);
  }, [setIsModified]);

  const updatePipelineStructure = useCallback((newSteps: PipelineStep[]) => {
    setPipelineSteps(newSteps);
    pipelineStepsRef.current = newSteps;
    setIsModifiedRef.current(true);
  }, [setIsModified]);

  const updateStepCode = useCallback((stepId: string, code: string) => {
    setPipelineSteps(steps => {
      const updatedSteps = steps.map(step => {
        if (step.id === stepId) {
          return { ...step, code };
        }
        
        if (step.type === 'result' && step.branches) {
          const updatedBranches = step.branches.map(branch => ({
            ...branch,
            steps: branch.steps.map(branchStep =>
              branchStep.id === stepId ? { ...branchStep, code } : branchStep
            )
          }));
          
          const wasUpdated = step.branches.some(branch =>
            branch.steps.some(branchStep => branchStep.id === stepId)
          );
          
          if (wasUpdated) {
            return { ...step, branches: updatedBranches };
          }
        }
        
        return step;
      });
      pipelineStepsRef.current = updatedSteps;
      return updatedSteps;
    });
    setIsModifiedRef.current(true);
  }, [setIsModified]);

  const getCurrentSteps = useCallback(() => {
    return pipelineStepsRef.current.length > 0 ? pipelineStepsRef.current : pipelineSteps;
  }, [pipelineSteps]);

  const updateSetIsModified = useCallback((newSetIsModified: (value: boolean) => void) => {
    setIsModifiedRef.current = newSetIsModified;
  }, []);

  return {
    pipelineSteps,
    setPipelineSteps,
    selectedRoute,
    setSelectedRoute,
    selectedStep,
    setSelectedStep,
    addStep,
    deleteStep,
    updatePipelineStructure,
    updateStepCode,
    getCurrentSteps,
    updateSetIsModified
  };
};