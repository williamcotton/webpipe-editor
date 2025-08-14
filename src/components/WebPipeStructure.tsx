import React from 'react';
import { PipelineStep, SelectedElement, ViewMode } from '../types';
import { getLanguageForType } from '../utils';

interface WebPipeStructureProps {
  parsedData: any;
  selectedElement: SelectedElement | null;
  setSelectedElement: (element: SelectedElement) => void;
  setViewMode: (mode: ViewMode) => void;
  setPipelineSteps: (steps: PipelineStep[]) => void;
  setSelectedRoute: (route: string) => void;
}

export const WebPipeStructure: React.FC<WebPipeStructureProps> = ({
  parsedData,
  selectedElement,
  setSelectedElement,
  setViewMode,
  setPipelineSteps,
  setSelectedRoute
}) => {
  const extractPipelineSteps = (pipeline: any, prefix: string): PipelineStep[] => {
    if (!pipeline?.pipeline?.steps) return [];
    
    return pipeline.pipeline.steps.map((step: any, stepIndex: number) => {
      const stepType = step.name; // webpipe-js uses 'name' for the step type
      const stepCode = step.config; // webpipe-js uses 'config' for the step code
      
      return {
        id: `${prefix}-${stepIndex}`,
        type: stepType,
        language: getLanguageForType(stepType),
        code: stepCode,
        output: ''
      };
    });
  };

  const extractRouteSteps = (route: any): PipelineStep[] => {
    if (!route.pipeline?.pipeline?.steps) return [];
    
    return route.pipeline.pipeline.steps.map((step: any, stepIndex: number) => {
      const stepType = step.name;
      const stepCode = step.config;
      
      console.log('Processing step:', step, 'Type:', stepType, 'Code:', stepCode);
      
      return {
        id: `${route.method}-${route.path}-${stepIndex}`,
        type: stepType,
        language: getLanguageForType(stepType),
        code: stepCode,
        output: ''
      };
    });
  };

  if (!parsedData) return null;

  return (
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
                const steps = extractRouteSteps(route);
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
                const steps = extractPipelineSteps(pipeline, `pipeline-${pipeline.name}`);
                if (steps.length > 0) {
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
  );
};