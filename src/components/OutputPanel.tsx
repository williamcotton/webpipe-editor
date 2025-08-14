import React from 'react';

interface OutputPanelProps {
  lastResponse: any;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ lastResponse }) => {
  const getHeader = (headers: Record<string, string> | undefined, key: string): string | undefined => {
    if (!headers) return undefined;
    if (key in headers) return headers[key];
    const alt = Object.keys(headers).find(k => k.toLowerCase() === key.toLowerCase());
    return alt ? headers[alt] : undefined;
  };

  const isHtmlResponse = (headers?: Record<string, string>, body?: unknown): boolean => {
    const ct = getHeader(headers, 'content-type') || '';
    if (ct.toLowerCase().includes('text/html')) return true;
    return typeof body === 'string' && /<\s*(!doctype|html|head|body|div|span|p)[\s>]/i.test(body);
  };

  const renderBody = () => {
    if (!lastResponse) {
      return `// Output will appear here`;
    }
    const { headers, body } = lastResponse;

    if (isHtmlResponse(headers, body) && typeof body === 'string') {
      return (
        <div
          style={{
            backgroundColor: '#ffffff',
            color: '#000000',
            borderRadius: '4px',
            overflow: 'auto',
            height: '100%'
          }}
          dangerouslySetInnerHTML={{ __html: body }}
        />
      );
    }

    const { url, ok, status, statusText, error } = lastResponse;
    return (
      <pre style={{ margin: 0, color: '#d4d4d4', whiteSpace: 'pre-wrap' }}>
        {JSON.stringify({ url, ok, status, statusText, headers, body, error }, null, 2)}
      </pre>
    );
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
          fontFamily: 'monospace',
          height: '100%',
          overflow: 'auto'
        }}>
          {renderBody()}
        </div>
      </div>
    </div>
  );
};