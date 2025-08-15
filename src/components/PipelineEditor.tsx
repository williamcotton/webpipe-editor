import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { PipelineStep } from '../types';

interface PipelineEditorProps {
  pipelineSteps: PipelineStep[];
  updateStepCode: (stepId: string, code: string) => void;
}

const ResultBlockEditor: React.FC<{
  step: PipelineStep;
  updateStepCode: (stepId: string, code: string) => void;
}> = ({ step, updateStepCode }) => {
  const [selectedBranchIndex, setSelectedBranchIndex] = useState(0);
  
  if (!step.branches || step.branches.length === 0) {
    return <div style={{ color: '#cccccc', padding: '12px' }}>No branches found</div>;
  }
  
  const selectedBranch = step.branches[selectedBranchIndex];
  
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Branch tabs */}
      <div style={{ 
        display: 'flex', 
        backgroundColor: '#2d2d30',
        borderBottom: '1px solid #3e3e42'
      }}>
        {step.branches.map((branch, index) => (
          <button
            key={branch.id}
            onClick={() => setSelectedBranchIndex(index)}
            style={{
              padding: '6px 12px',
              backgroundColor: selectedBranchIndex === index ? '#0e639c' : 'transparent',
              border: 'none',
              color: '#cccccc',
              cursor: 'pointer',
              fontSize: '11px',
              borderRight: '1px solid #3e3e42'
            }}
          >
            {branch.branchType}
          </button>
        ))}
      </div>
      
      {/* Branch content */}
      <div style={{ flex: 1, display: 'flex', gap: '1px' }}>
        {selectedBranch.steps.map((branchStep) => (
          <div key={branchStep.id} style={{ 
            width: '350px',
            flexShrink: 0,
            display: 'flex', 
            flexDirection: 'column',
            backgroundColor: '#1e1e1e'
          }}>
            <div style={{
              padding: '4px 8px',
              backgroundColor: '#252526',
              borderBottom: '1px solid #3e3e42',
              fontSize: '11px',
              color: '#cccccc'
            }}>
              {branchStep.type}
            </div>
            
            <div style={{ height: '300px' }}>
              <Editor
                height="300px"
                language={branchStep.language}
                value={branchStep.code}
                onChange={(value) => updateStepCode(branchStep.id, value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineNumbers: 'off',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: 'on',
                  fontFamily: 'Liga Menlo, SF Mono, Monaco, Inconsolata, Roboto Mono, Oxygen Mono, Ubuntu Monospace, Source Code Pro, Fira Mono, Droid Sans Mono, Courier New, monospace',
                  fontLigatures: true
                }}
              />
            </div>
            
            <div style={{
              height: '150px',
              backgroundColor: '#0e0e0e',
              border: '1px solid #3e3e42',
              borderTop: 'none'
            }}>
              <Editor
                height="150px"
                language="json"
                value={branchStep.output || '// Output will appear here'}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 11,
                  lineNumbers: 'off',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: 'on',
                  fontFamily: 'Liga Menlo, SF Mono, Monaco, Inconsolata, Roboto Mono, Oxygen Mono, Ubuntu Monospace, Source Code Pro, Fira Mono, Droid Sans Mono, Courier New, monospace',
                  fontLigatures: true
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PipelineEditor: React.FC<PipelineEditorProps> = ({
  pipelineSteps,
  updateStepCode
}) => {
  return (
    <div style={{ 
      display: 'flex', 
      height: '100%',
      gap: '1px',
      backgroundColor: '#3e3e42',
      overflowX: 'auto'
    }}>
      {pipelineSteps.map((step) => (
        <div key={step.id} style={{ 
          width: step.type === 'result' ? '600px' : '400px',
          flexShrink: 0,
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: '#1e1e1e'
        }}>
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#2d2d30',
            borderBottom: '1px solid #3e3e42',
            fontSize: '12px',
            color: '#cccccc'
          }}>
            {step.type === 'result' ? 'result block' : step.type}
          </div>
          
          {step.type === 'result' ? (
            <ResultBlockEditor step={step} updateStepCode={updateStepCode} />
          ) : (
            <div style={{ flex: 1 }}>
              <div style={{ height: '300px' }}>
                <Editor
                  height="300px"
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
                    wordWrap: 'on',
                    fontFamily: 'Liga Menlo, SF Mono, Monaco, Inconsolata, Roboto Mono, Oxygen Mono, Ubuntu Monospace, Source Code Pro, Fira Mono, Droid Sans Mono, Courier New, monospace',
                    fontLigatures: true
                  }}
                />
              </div>
              
              <div style={{
                height: '150px',
                backgroundColor: '#0e0e0e',
                border: '1px solid #3e3e42',
                borderTop: 'none'
              }}>
                <Editor
                  height="150px"
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
                    wordWrap: 'on',
                    fontFamily: 'Liga Menlo, SF Mono, Monaco, Inconsolata, Roboto Mono, Oxygen Mono, Ubuntu Monospace, Source Code Pro, Fira Mono, Droid Sans Mono, Courier New, monospace',
                    fontLigatures: true
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};