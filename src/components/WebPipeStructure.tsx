import React from 'react';
import { PipelineStep, SelectedElement, ViewMode } from '../types';
import { getLanguageForType } from '../utils';
import { AddButton } from './AddButton';

interface WebPipeStructureProps {
  parsedData: any;
  selectedElement: SelectedElement | null;
  setSelectedElement: (element: SelectedElement) => void;
  setViewMode: (mode: ViewMode) => void;
  setPipelineSteps: (steps: PipelineStep[]) => void;
  setSelectedRoute: (route: string) => void;
  createNewRoute: () => void;
  createNewTest: () => void;
  createNewVariable: () => void;
  createNewPipeline: () => void;
  createNewConfig: () => void;
  deleteSpecificElement: (elementType: string, elementData: any) => void;
  serverBaseUrl: string;
  routeTestInputs: Record<string, string>;
  setRouteTestInput: (routeKey: string, value: string) => void;
  testRouteGet: (route: any, overridePathOrUrl?: string) => void;
}

export const WebPipeStructure: React.FC<WebPipeStructureProps> = ({
  parsedData,
  selectedElement,
  setSelectedElement,
  setViewMode,
  setPipelineSteps,
  setSelectedRoute,
  createNewRoute,
  createNewTest,
  createNewVariable,
  createNewPipeline,
  createNewConfig,
  deleteSpecificElement,
  serverBaseUrl,
  routeTestInputs,
  setRouteTestInput,
  testRouteGet
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
              style={{
                padding: '6px 8px',
                margin: '2px 0',
                backgroundColor: selectedElement?.type === 'config' && selectedElement?.data === config ? '#0e639c' : '#37373d',
                color: '#cccccc',
                borderRadius: '3px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span
                onClick={() => {
                  setSelectedElement({ type: 'config', data: config });
                  setViewMode('single');
                }}
                style={{ cursor: 'pointer', flex: 1 }}
              >
                config {config.name}
              </span>
              {selectedElement?.type === 'config' && selectedElement?.data === config && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSpecificElement('config', config);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#cccccc',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    fontSize: '10px',
                    borderRadius: '2px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff4444';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#cccccc';
                  }}
                  title="Delete config"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
          <AddButton onClick={createNewConfig} label="Add Config" />
          <div style={{ borderBottom: '1px solid #3e3e42', margin: '8px 0' }}></div>
        </div>
      )}

      {/* Add Config button when no configs exist */}
      {(!parsedData.configs || parsedData.configs.length === 0) && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#cccccc', textTransform: 'uppercase' }}>Config</h3>
          <AddButton onClick={createNewConfig} label="Add Config" />
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
              style={{
                padding: '6px 8px',
                margin: '2px 0',
                backgroundColor: selectedElement?.type === 'route' && selectedElement?.data === route ? '#0e639c' : '#37373d',
                color: '#cccccc',
                borderRadius: '3px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px'
              }}
            >
              <span
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
                style={{ cursor: 'pointer', flex: 1 }}
              >
                {route.method} {route.path}
              </span>
              <input
                type="text"
                placeholder={route.path}
                value={routeTestInputs[`${route.method} ${route.path}`] || ''}
                onChange={(e) => setRouteTestInput(`${route.method} ${route.path}`, e.target.value)}
                title={serverBaseUrl ? `${serverBaseUrl}${route.path}` : 'Enter full URL or path'}
                style={{
                  minWidth: '80px',
                  backgroundColor: '#1e1e1e',
                  border: '1px solid #3e3e42',
                  borderRadius: '3px',
                  color: '#cccccc',
                  fontSize: '11px',
                  padding: '2px 4px'
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  testRouteGet(route);
                }}
                title="GET route"
                style={{
                  backgroundColor: '#0e639c',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '3px',
                  fontSize: '10px'
                }}
              >
                GET
              </button>
              {selectedElement?.type === 'route' && selectedElement?.data === route && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSpecificElement('route', route);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#cccccc',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    fontSize: '10px',
                    borderRadius: '2px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff4444';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#cccccc';
                  }}
                  title="Delete route"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
          <AddButton onClick={createNewRoute} label="Add Route" />
          <div style={{ borderBottom: '1px solid #3e3e42', margin: '8px 0' }}></div>
        </div>
      )}

      {/* Add Route button when no routes exist */}
      {(!parsedData.routes || parsedData.routes.length === 0) && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#cccccc', textTransform: 'uppercase' }}>Routes</h3>
          <AddButton onClick={createNewRoute} label="Add Route" />
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
              style={{
                padding: '6px 8px',
                margin: '2px 0',
                backgroundColor: selectedElement?.type === 'pipeline' && selectedElement?.data === pipeline ? '#0e639c' : '#37373d',
                color: '#cccccc',
                borderRadius: '3px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span
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
                style={{ cursor: 'pointer', flex: 1 }}
              >
                pipeline {pipeline.name}
              </span>
              {selectedElement?.type === 'pipeline' && selectedElement?.data === pipeline && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSpecificElement('pipeline', pipeline);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#cccccc',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    fontSize: '10px',
                    borderRadius: '2px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff4444';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#cccccc';
                  }}
                  title="Delete pipeline"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
          <AddButton onClick={createNewPipeline} label="Add Pipeline" />
          <div style={{ borderBottom: '1px solid #3e3e42', margin: '8px 0' }}></div>
        </div>
      )}

      {/* Add Pipeline button when no pipelines exist */}
      {(!parsedData.pipelines || parsedData.pipelines.length === 0) && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#cccccc', textTransform: 'uppercase' }}>Pipelines</h3>
          <AddButton onClick={createNewPipeline} label="Add Pipeline" />
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
              style={{
                padding: '6px 8px',
                margin: '2px 0',
                backgroundColor: selectedElement?.type === 'variable' && selectedElement?.data === variable ? '#0e639c' : '#37373d',
                color: '#cccccc',
                borderRadius: '3px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span
                onClick={() => {
                  setSelectedElement({ type: 'variable', data: variable });
                  setViewMode('single');
                }}
                style={{ cursor: 'pointer', flex: 1 }}
              >
                {variable.varType} {variable.name}
              </span>
              {selectedElement?.type === 'variable' && selectedElement?.data === variable && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSpecificElement('variable', variable);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#cccccc',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    fontSize: '10px',
                    borderRadius: '2px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff4444';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#cccccc';
                  }}
                  title="Delete variable"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
          <AddButton onClick={createNewVariable} label="Add Variable" />
          <div style={{ borderBottom: '1px solid #3e3e42', margin: '8px 0' }}></div>
        </div>
      )}

      {/* Add Variable button when no variables exist */}
      {(!parsedData.variables || parsedData.variables.length === 0) && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#cccccc', textTransform: 'uppercase' }}>Variables</h3>
          <AddButton onClick={createNewVariable} label="Add Variable" />
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
              style={{
                padding: '6px 8px',
                margin: '2px 0',
                backgroundColor: selectedElement?.type === 'test' && selectedElement?.data === describe ? '#0e639c' : '#37373d',
                color: '#cccccc',
                borderRadius: '3px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span
                onClick={() => {
                  setSelectedElement({ type: 'test', data: describe });
                  setViewMode('single');
                }}
                style={{ cursor: 'pointer', flex: 1 }}
              >
                describe "{describe.name}"
              </span>
              {selectedElement?.type === 'test' && selectedElement?.data === describe && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSpecificElement('test', describe);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#cccccc',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    fontSize: '10px',
                    borderRadius: '2px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff4444';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#cccccc';
                  }}
                  title="Delete test"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
          <AddButton onClick={createNewTest} label="Add Test" />
          <div style={{ borderBottom: '1px solid #3e3e42', margin: '8px 0' }}></div>
        </div>
      )}

      {/* Add Test button when no tests exist */}
      {(!parsedData.describes || parsedData.describes.length === 0) && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#cccccc', textTransform: 'uppercase' }}>Tests</h3>
          <AddButton onClick={createNewTest} label="Add Test" />
          <div style={{ borderBottom: '1px solid #3e3e42', margin: '8px 0' }}></div>
        </div>
      )}
    </div>
  );
};