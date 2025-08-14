import React from 'react';

export const OutputPanel: React.FC = () => {
  return (
    <div style={{
      width: '300px',
      backgroundColor: '#252526',
      borderLeft: '1px solid #3e3e42',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#2d2d30',
        borderBottom: '1px solid #3e3e42',
        fontSize: '14px',
        color: '#cccccc'
      }}>
        Output
      </div>
      <div style={{ flex: 1, padding: '16px' }}>
        <div style={{
          backgroundColor: '#0e0e0e',
          border: '1px solid #3e3e42',
          borderRadius: '4px',
          padding: '12px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          {/* Mock output for now */}
          <pre style={{ margin: 0, color: '#d4d4d4' }}>
{`{
  "result": "Pipeline output will appear here",
  "timestamp": "2025-08-13T19:46:36Z"
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};