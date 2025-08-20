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
    return <div className="no-branches">No branches found</div>;
  }

  const selectedBranch = step.branches[selectedBranchIndex];

  return (
    <div className="result-editor">
      {/* Branch tabs */}
      <div className="branch-tabs">
        {step.branches.map((branch, index) => (
          <button
            key={branch.id}
            onClick={() => setSelectedBranchIndex(index)}
            className={`branch-tab ${selectedBranchIndex === index ? 'active' : ''}`}
          >
            {branch.branchType}
          </button>
        ))}
      </div>

      {/* Branch content */}
      <div className="branch-steps">
        {selectedBranch.steps.map((branchStep) => (
          <div key={branchStep.id} className="branch-step">
            <div className="branch-step-header">{branchStep.type}</div>

            <div className="editor-container">
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
                  fontFamily:
                    'Liga Menlo, SF Mono, Monaco, Inconsolata, Roboto Mono, Oxygen Mono, Ubuntu Monospace, Source Code Pro, Fira Mono, Droid Sans Mono, Courier New, monospace',
                  fontLigatures: true,
                }}
              />
            </div>

            <div className="output-container">
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
                  fontFamily:
                    'Liga Menlo, SF Mono, Monaco, Inconsolata, Roboto Mono, Oxygen Mono, Ubuntu Monospace, Source Code Pro, Fira Mono, Droid Sans Mono, Courier New, monospace',
                  fontLigatures: true,
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
  updateStepCode,
}) => {
  return (
    <div className="pipeline-editor">
      {pipelineSteps.map((step) => (
        <div
          key={step.id}
          className={`pipeline-step ${step.type === 'result' ? 'result' : ''}`}
        >
          <div className="pipeline-step-header">
            {step.type === 'result' ? 'result block' : step.type}
          </div>

          {step.type === 'result' ? (
            <ResultBlockEditor step={step} updateStepCode={updateStepCode} />
          ) : (
            <div className="step-editors">
              <div className="editor-container">
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
                    fontFamily:
                      'Liga Menlo, SF Mono, Monaco, Inconsolata, Roboto Mono, Oxygen Mono, Ubuntu Monospace, Source Code Pro, Fira Mono, Droid Sans Mono, Courier New, monospace',
                    fontLigatures: true,
                  }}
                />
              </div>

              <div className="output-container">
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
                    fontFamily:
                      'Liga Menlo, SF Mono, Monaco, Inconsolata, Roboto Mono, Oxygen Mono, Ubuntu Monospace, Source Code Pro, Fira Mono, Droid Sans Mono, Courier New, monospace',
                    fontLigatures: true,
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
