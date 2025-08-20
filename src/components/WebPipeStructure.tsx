import React from 'react';
import { PipelineStep, SelectedElement, ViewMode } from '../types';
import { extractStepsFromPipeline } from '../utils';
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
}) => {
  const extractPipelineSteps = (pipeline: any, prefix: string): PipelineStep[] => {
    if (!pipeline?.pipeline?.steps) return [];
    return extractStepsFromPipeline(pipeline.pipeline.steps, prefix);
  };

  const extractRouteSteps = (route: any): PipelineStep[] => {
    if (!route.pipeline?.pipeline?.steps) return [];
    const routePrefix = `${route.method}-${route.path}`;
    return extractStepsFromPipeline(route.pipeline.pipeline.steps, routePrefix);
  };

  if (!parsedData) return null;

  return (
    <div className="structure">
      {(
        [
          { key: 'configs', label: 'Config', addFn: createNewConfig, type: 'config' },
          { key: 'routes', label: 'Routes', addFn: createNewRoute, type: 'route' },
          { key: 'pipelines', label: 'Pipelines', addFn: createNewPipeline, type: 'pipeline' },
          { key: 'variables', label: 'Variables', addFn: createNewVariable, type: 'variable' },
          { key: 'describes', label: 'Tests', addFn: createNewTest, type: 'test' },
        ] as const
      ).map(({ key, label, addFn, type }) => {
        const items = parsedData[key] || [];
        return (
          <div key={key} className="structure-section">
            <h3 className="structure-title">{label}</h3>

            {items.length > 0 ? (
              items.map((item: any, index: number) => {
                const isSelected =
                  selectedElement?.type === type &&
                  (type === 'route'
                    ? selectedElement?.data?.method === item.method &&
                      selectedElement?.data?.path === item.path
                    : selectedElement?.data?.name === item.name);

                return (
                  <div
                    key={`${type}-${index}`}
                    className={`structure-item ${isSelected ? 'selected' : ''}`}
                  >
                    <span
                      className="structure-item-label"
                      onClick={() => {
                        setSelectedElement({ type, data: item });
                        if (type === 'route') {
                          setSelectedRoute(`${item.method} ${item.path}`);
                          setViewMode('flow');
                          setPipelineSteps(extractRouteSteps(item));
                        } else if (type === 'pipeline') {
                          const steps = extractPipelineSteps(item, `pipeline-${item.name}`);
                          if (steps.length > 0) {
                            setPipelineSteps(steps);
                            setViewMode('flow');
                          } else {
                            setViewMode('single');
                          }
                        } else {
                          setViewMode('single');
                        }
                      }}
                    >
                      {type === 'config' && `config ${item.name}`}
                      {type === 'route' && `${item.method} ${item.path}`}
                      {type === 'pipeline' && `pipeline ${item.name}`}
                      {type === 'variable' && `${item.varType} ${item.name}`}
                      {type === 'test' && `describe "${item.name}"`}
                    </span>

                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSpecificElement(type, item);
                        }}
                        className="delete-btn"
                        title={`Delete ${type}`}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                );
              })
            ) : null}

            <AddButton onClick={addFn} label={`Add ${label}`} />
            <div className="structure-divider" />
          </div>
        );
      })}
    </div>
  );
};
