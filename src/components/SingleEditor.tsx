import React from 'react';
import Editor from '@monaco-editor/react';
import { printConfig, printDescribe } from 'webpipe-js';
import { SelectedElement, PipelineStep } from '../types';
import { getLanguageForType } from '../utils';

interface SingleEditorProps {
  selectedElement: SelectedElement | null;
  pipelineSteps: PipelineStep[];
}

export const SingleEditor: React.FC<SingleEditorProps> = ({
  selectedElement,
  pipelineSteps
}) => {
  const getEditorLanguage = (): string => {
    if (!selectedElement) return 'text';
    
    switch (selectedElement.type) {
      case 'config':
        return 'text';
      case 'variable':
        return getLanguageForType(selectedElement.data.varType);
      case 'test':
        return 'text';
      case 'route':
        return 'yaml';
      default:
        return 'text';
    }
  };

  const getEditorValue = (): string => {
    if (!selectedElement) {
      return 'Select an element from the sidebar to edit';
    }
    
    switch (selectedElement.type) {
      case 'config':
        return printConfig(selectedElement.data);
      case 'variable':
        return selectedElement.data.value;
      case 'test':
        return printDescribe(selectedElement.data);
      case 'route':
        return pipelineSteps.length > 0 ? pipelineSteps[0]?.code || '' : 'Select an element to edit';
      default:
        return 'Select an element to edit';
    }
  };

  const handleChange = (_value: string | undefined) => {
    // do nothing
  };

  return (
    <Editor
      height="100%"
      language={getEditorLanguage()}
      value={getEditorValue()}
      onChange={handleChange}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        automaticLayout: true,
        readOnly: selectedElement?.type === 'test',
        fontFamily: 'Liga Menlo, SF Mono, Monaco, Inconsolata, Roboto Mono, Oxygen Mono, Ubuntu Monospace, Source Code Pro, Fira Mono, Droid Sans Mono, Courier New, monospace',
        fontLigatures: true
      }}
    />
  );
};