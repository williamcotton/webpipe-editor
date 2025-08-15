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
}

export const MainEditor: React.FC<MainEditorProps> = ({
  viewMode,
  webpipeSource,
  setWebpipeSource,
  selectedElement,
  pipelineSteps,
  updateStepCode
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '8px 12px',
        backgroundColor: '#2d2d30',
        borderBottom: '1px solid #3e3e42',
        fontSize: '12px',
        color: '#cccccc'
      }}>
        {getHeaderText()}
      </div>
      
      {selectedElement && (selectedElement.type === 'route' || selectedElement.type === 'pipeline') && viewMode === 'flow' ? (
        <BoxAndNoodleEditor
          pipelineSteps={pipelineSteps}
          updateStepCode={updateStepCode}
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
        />
      )}
    </div>
  );
};