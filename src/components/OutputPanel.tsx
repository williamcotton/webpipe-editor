import React, { useState, useMemo } from 'react';

interface OutputPanelProps {
  lastResponse: any;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ lastResponse }) => {
  const [mode, setMode] = useState<'auto' | 'html' | 'json' | 'live'>('auto');
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

  const canLivePreview = useMemo(() => {
    if (!lastResponse) return false;
    const { url, headers, body } = lastResponse || {};
    return Boolean(url) && isHtmlResponse(headers, body);
  }, [lastResponse]);

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

  const renderContent = () => {
    if (!lastResponse) return (
      <pre style={{ margin: 0, color: '#d4d4d4', whiteSpace: 'pre-wrap' }}>{`// Output will appear here`}</pre>
    );
    const isHtml = isHtmlResponse(lastResponse.headers, lastResponse.body);
    const selected = mode === 'auto' ? (isHtml ? 'html' : 'json') : mode;
    if (selected === 'live' && canLivePreview) {
      return (
        <iframe
          src={lastResponse.url}
          style={{ width: '100%', height: '100%', border: '0', backgroundColor: '#ffffff' }}
          sandbox="allow-scripts allow-forms allow-same-origin"
        />
      );
    }
    if (selected === 'html') {
      return renderBody();
    }
    return (
      <pre style={{ margin: 0, color: '#d4d4d4', whiteSpace: 'pre-wrap' }}>
        {JSON.stringify({
          url: lastResponse.url,
          ok: lastResponse.ok,
          status: lastResponse.status,
          statusText: lastResponse.statusText,
          headers: lastResponse.headers,
          body: lastResponse.body,
          error: lastResponse.error
        }, null, 2)}
      </pre>
    );
  };
  return (
    <div style={{
      width: '420px',
      minWidth: '420px',
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
        color: '#cccccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        <span>Output</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setMode('auto')}
            title="Auto"
            style={{
              backgroundColor: mode === 'auto' ? '#0e639c' : 'transparent',
              border: '1px solid #3e3e42',
              color: '#cccccc',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '12px'
            }}
          >Auto</button>
          <button
            onClick={() => setMode('json')}
            title="JSON"
            style={{
              backgroundColor: mode === 'json' ? '#0e639c' : 'transparent',
              border: '1px solid #3e3e42',
              color: '#cccccc',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '12px'
            }}
          >JSON</button>
          <button
            onClick={() => setMode('html')}
            title="Render HTML"
            style={{
              backgroundColor: mode === 'html' ? '#0e639c' : 'transparent',
              border: '1px solid #3e3e42',
              color: '#cccccc',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '12px'
            }}
          >HTML</button>
          <button
            onClick={() => setMode('live')}
            title={canLivePreview ? 'Live Preview' : 'Live Preview (HTML only)'}
            disabled={!canLivePreview}
            style={{
              backgroundColor: mode === 'live' ? '#0e639c' : 'transparent',
              border: '1px solid #3e3e42',
              color: canLivePreview ? '#cccccc' : '#777777',
              cursor: canLivePreview ? 'pointer' : 'not-allowed',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '12px'
            }}
          >Live</button>
        </div>
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
          {renderContent()}
        </div>
      </div>
    </div>
  );
};