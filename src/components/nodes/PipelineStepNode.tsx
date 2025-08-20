import { memo, useRef, useMemo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import Editor from '@monaco-editor/react';
import { FlowNodeData } from '../../types';
import {
  getVariableAtPosition,
  getPipelineAtPosition,
  getPartialAtPosition,
  registerHoverProvider,
  updateGlobalVariableDefinitions,
  updateGlobalPipelineDefinitions,
} from '../../utils/jumpToDefinition';

interface PipelineStepNodeProps extends NodeProps {
  data: FlowNodeData;
}

export const PipelineStepNode = memo<PipelineStepNodeProps>(({ data, selected }) => {
  const {
    step,
    updateCode,
    branchType,
    variableDefinitions = [],
    pipelineDefinitions = [],
    onJumpToDefinition,
    onJumpToPipeline,
  } = data;
  const editorRef = useRef<any>(null);

  const { codeHeight, outputHeight } = useMemo(() => {
    const codeLines = (step.code || '').split('\n').length;
    const outputLines = (step.output || '').split('\n').length;
    const lineHeight = 18;

    const codeHeight = Math.max(60, Math.min(300, codeLines * lineHeight + 20));
    const outputHeight = Math.max(40, Math.min(150, outputLines * lineHeight + 20));

    return { codeHeight, outputHeight };
  }, [step.code, step.output]);

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    updateGlobalVariableDefinitions(variableDefinitions);
    updateGlobalPipelineDefinitions(pipelineDefinitions);
    registerHoverProvider(monaco);

    editor.onMouseDown((e: any) => {
      if ((e.event.ctrlKey || e.event.metaKey) && e.target.type === 6) {
        const position = e.target.position;
        if (!position) return;

        const partialInfo = getPartialAtPosition(editor.getModel(), position, variableDefinitions);
        if (partialInfo && onJumpToDefinition) {
          const def = variableDefinitions.find(
            (d) => d.name === partialInfo.partialName && d.type === 'handlebars'
          );
          onJumpToDefinition(partialInfo.partialName, def?.lineNumber);
          return;
        }

        const variableInfo = getVariableAtPosition(editor.getModel(), position, variableDefinitions);
        if (variableInfo && onJumpToDefinition) {
          const def = variableDefinitions.find((d) => d.name === variableInfo.variableName);
          onJumpToDefinition(variableInfo.variableName, def?.lineNumber);
          return;
        }

        const pipelineInfo = getPipelineAtPosition(editor.getModel(), position, pipelineDefinitions);
        if (pipelineInfo && onJumpToPipeline) {
          const def = pipelineDefinitions.find((d) => d.name === pipelineInfo.pipelineName);
          onJumpToPipeline(pipelineInfo.pipelineName, def?.lineNumber);
        }
      }
    });
  };

  return (
    <div className={`pipeline-step-node ${selected ? 'selected' : ''}`}>
      {/* Input Handle */}
      <Handle type="target" position={Position.Top} id="input" className="pipeline-step-handle input" />

      {/* Header */}
      <div className="pipeline-step-header">
        <span>{step.type}</span>
        {branchType && <span className="pipeline-step-branch-label">{branchType}</span>}
      </div>

      {/* Code Editor */}
      <div className="pipeline-step-code nodrag" style={{ height: `${codeHeight}px` }}>
        <Editor
          height={`${codeHeight}px`}
          language={step.language}
          value={step.code}
          onChange={(value) => updateCode(value || '')}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 11,
            lineNumbers: 'off',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            fontFamily:
              'Liga Menlo, SF Mono, Monaco, Inconsolata, Roboto Mono, Oxygen Mono, Ubuntu Monospace, Source Code Pro, Fira Mono, Droid Sans Mono, Courier New, monospace',
            fontLigatures: true,
            scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
          }}
        />
      </div>

      {/* Output Panel */}
      <div className="pipeline-step-output nodrag" style={{ height: `${outputHeight}px` }}>
        <Editor
          height={`${outputHeight}px`}
          language="json"
          value={step.output || '// Output will appear here'}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 10,
            lineNumbers: 'off',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            fontFamily:
              'Liga Menlo, SF Mono, Monaco, Inconsolata, Roboto Mono, Oxygen Mono, Ubuntu Monospace, Source Code Pro, Fira Mono, Droid Sans Mono, Courier New, monospace',
            fontLigatures: true,
            scrollbar: { vertical: 'auto', horizontal: 'hidden' },
          }}
        />
      </div>

      {/* Output Handle */}
      <Handle type="source" position={Position.Bottom} id="output" className="pipeline-step-handle output" />
    </div>
  );
});

PipelineStepNode.displayName = 'PipelineStepNode';
