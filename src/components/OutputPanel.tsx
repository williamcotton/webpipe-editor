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
          className="output-html"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      );
    }

    return (
      <pre className="output-pre">
        {JSON.stringify(body, null, 2)}
      </pre>
    );
  };

  const renderContent = () => {
    if (!lastResponse) return (
      <pre className="output-pre">{`// Output will appear here`}</pre>
    );

    const isHtml = isHtmlResponse(lastResponse.headers, lastResponse.body);
    const selected = mode === 'auto' ? (isHtml ? 'html' : 'json') : mode;

    if (selected === 'live' && canLivePreview) {
      const timestamp = lastResponse && typeof lastResponse === 'object' && 'timestamp' in lastResponse 
        ? lastResponse.timestamp 
        : Date.now();

      return (
        <iframe
          key={`live-${timestamp}-${lastResponse?.url}`}
          src={lastResponse.url}
          className="output-iframe"
          sandbox="allow-scripts allow-forms allow-same-origin"
        />
      );
    }

    if (selected === 'html') {
      return renderBody();
    }

    return (
      <pre className="output-pre">
        {JSON.stringify(lastResponse.body, null, 2)}
      </pre>
    );
  };

  return (
    <div className="output-panel">
      <div className="output-header">
        <span>Output</span>
        <div className="mode-buttons">
          <button
            onClick={() => setMode('auto')}
            title="Auto"
            className={`mode-button ${mode === 'auto' ? 'active' : ''}`}
          >Auto</button>
          <button
            onClick={() => setMode('json')}
            title="JSON"
            className={`mode-button ${mode === 'json' ? 'active' : ''}`}
          >JSON</button>
          <button
            onClick={() => setMode('html')}
            title="Render HTML"
            className={`mode-button ${mode === 'html' ? 'active' : ''}`}
          >HTML</button>
          <button
            onClick={() => setMode('live')}
            title={canLivePreview ? 'Live Preview' : 'Live Preview (HTML only)'}
            disabled={!canLivePreview}
            className={`mode-button ${mode === 'live' ? 'active' : ''} ${!canLivePreview ? 'disabled' : ''}`}
          >Live</button>
        </div>
      </div>

      <div className="output-body">
        <div className="output-content">
          {renderContent()}
        </div>

        {lastResponse && (
          <div className="response-info">
            <div className="response-info-title">Response Info</div>
            <div className="response-info-content">
              <div><span className="header-key">URL:</span> {lastResponse.url}</div>
              <div><span className="header-key">Status:</span> {lastResponse.status} {lastResponse.statusText}</div>
              <div><span className="header-key">OK:</span> {lastResponse.ok ? 'true' : 'false'}</div>
              {lastResponse.error && (
                <div><span className="error-text">Error:</span> {lastResponse.error}</div>
              )}
              {lastResponse.headers && Object.keys(lastResponse.headers).length > 0 && (
                <div className="headers-section">
                  <div className="headers-title">Headers:</div>
                  {Object.entries(lastResponse.headers).map(([key, value]) => (
                    <div key={key} className="header-item">
                      <span className="header-key">{key}:</span> {String(value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
