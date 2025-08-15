import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import Editor from '@monaco-editor/react';
import { FlowNodeData } from '../../types';

interface PipelineStepNodeProps extends NodeProps {
  data: FlowNodeData;
}

export const PipelineStepNode = memo<PipelineStepNodeProps>(({ data, selected }) => {
  const { step, updateCode, branchType } = data;

  return (
    <div style={{
      width: '350px',
      backgroundColor: selected ? '#404040' : '#1e1e1e',
      border: selected ? '2px solid #0e639c' : '1px solid #3e3e42',
      borderRadius: '8px',
      overflow: 'hidden',
      fontSize: '12px',
      boxShadow: selected ? '0 0 0 1px #0e639c' : '0 2px 8px rgba(0,0,0,0.3)'
    }}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#666',
          border: '2px solid #1e1e1e'
        }}
      />

      {/* Header */}
      <div style={{
        padding: '8px 12px',
        backgroundColor: '#2d2d30',
        borderBottom: '1px solid #3e3e42',
        color: '#cccccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>{step.type}</span>
        {branchType && (
          <span style={{
            fontSize: '10px',
            backgroundColor: '#0e639c',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {branchType}
          </span>
        )}
      </div>

      {/* Code Editor */}
      <div style={{ height: '250px' }}>
        <Editor
          height="250px"
          language={step.language}
          value={step.code}
          onChange={(value) => updateCode(step.id, value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 11,
            lineNumbers: 'off',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            fontFamily: 'Liga Menlo, SF Mono, Monaco, Inconsolata, Roboto Mono, Oxygen Mono, Ubuntu Monospace, Source Code Pro, Fira Mono, Droid Sans Mono, Courier New, monospace',
            fontLigatures: true,
            scrollbar: {
              vertical: 'hidden',
              horizontal: 'hidden'
            }
          }}
        />
      </div>

      {/* Output Panel */}
      <div style={{
        height: '120px',
        backgroundColor: '#0e0e0e',
        borderTop: '1px solid #3e3e42'
      }}>
        <Editor
          height="120px"
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
            fontFamily: 'Liga Menlo, SF Mono, Monaco, Inconsolata, Roboto Mono, Oxygen Mono, Ubuntu Monospace, Source Code Pro, Fira Mono, Droid Sans Mono, Courier New, monospace',
            fontLigatures: true,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'hidden'
            }
          }}
        />
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#666',
          border: '2px solid #1e1e1e'
        }}
      />
    </div>
  );
});

PipelineStepNode.displayName = 'PipelineStepNode';