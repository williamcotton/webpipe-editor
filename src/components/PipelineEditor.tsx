import React from 'react';
import Editor from '@monaco-editor/react';
import { PipelineStep } from '../types';

interface PipelineEditorProps {
  pipelineSteps: PipelineStep[];
  updateStepCode: (stepId: string, code: string) => void;
}

export const PipelineEditor: React.FC<PipelineEditorProps> = ({
  pipelineSteps,
  updateStepCode
}) => {
  return (
    <div style={{ 
      display: 'flex', 
      height: '100%',
      gap: '1px',
      backgroundColor: '#3e3e42'
    }}>
      {pipelineSteps.map((step, index) => (
        <div key={step.id} style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: '#1e1e1e',
          minWidth: '300px'
        }}>
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#2d2d30',
            borderBottom: '1px solid #3e3e42',
            fontSize: '12px',
            color: '#cccccc'
          }}>
            {step.type}
          </div>
          
          <div style={{ flex: 1 }}>
            <Editor
              height="50%"
              language={step.language}
              value={step.code}
              onChange={(value) => updateStepCode(step.id, value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                lineNumbers: 'off',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                fontFamily: 'Liga Menlo, SF Mono, Monaco, Inconsolata, Roboto Mono, Oxygen Mono, Ubuntu Monospace, Source Code Pro, Fira Mono, Droid Sans Mono, Courier New, monospace',
                fontLigatures: true
              }}
            />
            
            <div style={{
              height: '50%',
              backgroundColor: '#0e0e0e',
              border: '1px solid #3e3e42',
              borderTop: 'none'
            }}>
              <Editor
                height="100%"
                language="json"
                value={step.output || '// Output will appear here'}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 11,
                  lineNumbers: 'off',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  fontFamily: 'Liga Menlo, SF Mono, Monaco, Inconsolata, Roboto Mono, Oxygen Mono, Ubuntu Monospace, Source Code Pro, Fira Mono, Droid Sans Mono, Courier New, monospace',
                  fontLigatures: true
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};