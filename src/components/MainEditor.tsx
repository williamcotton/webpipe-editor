import React from 'react';
import Editor from '@monaco-editor/react';
import { PipelineEditor } from './PipelineEditor';
import { BoxAndNoodleEditor } from './BoxAndNoodleEditor';
import { SingleEditor } from './SingleEditor';
import { PipelineStep, SelectedElement, ViewMode } from '../types';

interface MainEditorProps {
  viewMode: ViewMode;
  webpipeSource: string;
  setWebpipeSource: (source: string) => void;
  selectedElement: SelectedElement | null;
  pipelineSteps: PipelineStep[];
  updateStepCode: (stepId: string, code: string) => void;
  addStep: (type: string) => void;
  deleteStep: (stepId: string) => void;
  updatePipelineStructure: (steps: PipelineStep[]) => void;
  variableDefinitions: Array<{ name: string; type: string; value: string; lineNumber?: number }>;
  pipelineDefinitions?: Array<{ name: string; steps: any[]; lineNumber?: number }>;
  onJumpToDefinition: (variableName: string, lineNumber?: number) => void;
  onJumpToPipeline?: (pipelineName: string, lineNumber?: number) => void;
  updateElementValue?: (newValue: string) => void;
}

export const MainEditor: React.FC<MainEditorProps> = ({
  viewMode,
  webpipeSource,
  setWebpipeSource,
  selectedElement,
  pipelineSteps,
  updateStepCode,
  addStep,
  deleteStep,
  updatePipelineStructure,
  variableDefinitions,
  pipelineDefinitions = [],
  onJumpToDefinition,
  onJumpToPipeline,
  updateElementValue
}) => {
  const getHeaderText = (): string => {
    if (!selectedElement) {
      return 'Select an element from the sidebar to edit';
    }
    
    switch (selectedElement.type) {
      case 'config':
        return `Config: ${selectedElement.data.name}`;
      case 'route':
        return `Route: ${selectedElement.data.method} ${selectedElement.data.path}`;
      case 'pipeline':
        return `Pipeline: ${selectedElement.data.name}`;
      case 'variable':
        return `Variable: ${selectedElement.data.varType} ${selectedElement.data.name}`;
      case 'test':
        return `Test: ${selectedElement.data.name}`;
      default:
        return 'Select an element from the sidebar to edit';
    }
  };

  if (viewMode === 'source') {
    return (
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
          wordWrap: 'on',
          fontFamily: 'Liga Menlo, SF Mono, Monaco, Inconsolata, Roboto Mono, Oxygen Mono, Ubuntu Monospace, Source Code Pro, Fira Mono, Droid Sans Mono, Courier New, monospace',
          fontLigatures: true
        }}
      />
    );
  }

  return (
    <div className="main-editor">
      <div className="main-editor-header">
        {getHeaderText()}
      </div>
      
      {selectedElement && (selectedElement.type === 'route' || selectedElement.type === 'pipeline') && viewMode === 'flow' ? (
        <BoxAndNoodleEditor
          pipelineSteps={pipelineSteps}
          updateStepCode={updateStepCode}
          addStep={addStep}
          deleteStep={deleteStep}
          updatePipelineStructure={updatePipelineStructure}
          variableDefinitions={variableDefinitions}
          pipelineDefinitions={pipelineDefinitions}
          onJumpToDefinition={onJumpToDefinition}
          onJumpToPipeline={onJumpToPipeline}
          routeInfo={selectedElement.type === 'route' ? { method: selectedElement.data.method, path: selectedElement.data.path } : undefined}
          pipelineInfo={selectedElement.type === 'pipeline' ? { name: selectedElement.data.name } : undefined}
        />
      ) : selectedElement && (selectedElement.type === 'route' || selectedElement.type === 'pipeline') && viewMode === 'all' ? (
        <PipelineEditor
          pipelineSteps={pipelineSteps}
          updateStepCode={updateStepCode}
        />
      ) : (
        <SingleEditor
          selectedElement={selectedElement}
          pipelineSteps={pipelineSteps}
          updateElementValue={updateElementValue}
        />
      )}
    </div>
  );
};