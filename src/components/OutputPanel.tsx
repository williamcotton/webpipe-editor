import React from 'react';

interface OutputPanelProps {
  lastResponse: any;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ lastResponse }) => {
  const renderBody = () => {
    if (!lastResponse) {
      return `// Output will appear here`;
    }
    const { url, ok, status, statusText, headers, body, error } = lastResponse;
    return JSON.stringify({ url, ok, status, statusText, headers, body, error }, null, 2);
  };
  return (
    <div style={{
      width: '300px',
      minWidth: '300px',
      flexShrink: 0,
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
          <pre style={{ margin: 0, color: '#d4d4d4', whiteSpace: 'pre-wrap' }}>
            {renderBody()}
          </pre>
        </div>
      </div>
    </div>
  );
};