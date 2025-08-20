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
  updateGlobalPipelineDefinitions
} from '../../utils/jumpToDefinition';

interface BranchStepNodeProps extends NodeProps {
  data: FlowNodeData;
}

export const BranchStepNode = memo<BranchStepNodeProps>(({ data, selected }) => {
  const { step, updateCode, variableDefinitions = [], pipelineDefinitions = [], onJumpToDefinition, onJumpToPipeline } = data;
  const editorRef = useRef<any>(null);

  const { codeHeight, outputHeight } = useMemo(() => {
    const codeLines = (step.code || '').split('\n').length;
    const outputLines = (step.output || '').split('\n').length;

    const minCodeHeight = 60;
    const maxCodeHeight = 300;
    const lineHeight = 18;
    const calculatedCodeHeight = Math.max(minCodeHeight, Math.min(maxCodeHeight, codeLines * lineHeight + 20));

    const minOutputHeight = 40;
    const maxOutputHeight = 150;
    const calculatedOutputHeight = Math.max(minOutputHeight, Math.min(maxOutputHeight, outputLines * lineHeight + 20));

    return { codeHeight: calculatedCodeHeight, outputHeight: calculatedOutputHeight };
  }, [step.code, step.output]);

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    updateGlobalVariableDefinitions(variableDefinitions);
    updateGlobalPipelineDefinitions(pipelineDefinitions);
    registerHoverProvider(monaco);

    editor.onMouseDown((e: any) => {
      if ((e.event.ctrlKey || e.event.metaKey) && e.target.type === 6) {
        const position = e.target.position;
        if (position) {
          const partialInfo = getPartialAtPosition(editor.getModel(), position, variableDefinitions);
          if (partialInfo && onJumpToDefinition) {
            const definition = variableDefinitions.find(def => def.name === partialInfo.partialName && def.type === 'handlebars');
            onJumpToDefinition(partialInfo.partialName, definition?.lineNumber);
            return;
          }

          const variableInfo = getVariableAtPosition(editor.getModel(), position, variableDefinitions);
          if (variableInfo && onJumpToDefinition) {
            const definition = variableDefinitions.find(def => def.name === variableInfo.variableName);
            onJumpToDefinition(variableInfo.variableName, definition?.lineNumber);
            return;
          }

          const pipelineInfo = getPipelineAtPosition(editor.getModel(), position, pipelineDefinitions);
          if (pipelineInfo && onJumpToPipeline) {
            const definition = pipelineDefinitions.find(def => def.name === pipelineInfo.pipelineName);
            onJumpToPipeline(pipelineInfo.pipelineName, definition?.lineNumber);
          }
        }
      }
    });
  };

  return (
    <div className={`flow-node-base branch-node overflow-visible ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="input" className="flow-node-handle primary input-top" />

      <div className="flow-node-header compact">
        <span>{step.type}</span>
      </div>

      <div className="flow-node-code nodrag" style={{ height: `${codeHeight}px` }}>
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
            scrollbar: {
              vertical: 'hidden',
              horizontal: 'hidden'
            }
          }}
        />
      </div>

      <div className="flow-node-output nodrag" style={{ height: `${outputHeight}px` }}>
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
            scrollbar: {
              vertical: 'auto',
              horizontal: 'hidden'
            }
          }}
        />
      </div>

      <Handle type="source" position={Position.Bottom} id="output" className="flow-node-handle primary output-bottom" />
    </div>
  );
});

BranchStepNode.displayName = 'BranchStepNode';
