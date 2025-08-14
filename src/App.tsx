import React from 'react';
import { Sidebar } from './components/Sidebar';
import { MainEditor } from './components/MainEditor';
import { OutputPanel } from './components/OutputPanel';
import { useWebpipe } from './hooks/useWebpipe';

function App() {
  const {
    webpipeSource,
    setWebpipeSource,
    pipelineSteps,
    setPipelineSteps,
    selectedRoute,
    setSelectedRoute,
    selectedElement,
    setSelectedElement,
    viewMode,
    setViewMode,
    parsedData,
    updateWebpipeSource,
    updateStepCode
  } = useWebpipe();

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      backgroundColor: '#1e1e1e',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Sidebar
        viewMode={viewMode}
        setViewMode={setViewMode}
        updateWebpipeSource={updateWebpipeSource}
        parsedData={parsedData}
        selectedElement={selectedElement}
        setSelectedElement={setSelectedElement}
        setPipelineSteps={setPipelineSteps}
        setSelectedRoute={setSelectedRoute}
      />

      {/* Main Editor Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#2d2d30',
          borderBottom: '1px solid #3e3e42',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '14px', color: '#cccccc' }}>
            test.wp - WebPipe Editor
          </span>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <MainEditor
            viewMode={viewMode}
            webpipeSource={webpipeSource}
            setWebpipeSource={setWebpipeSource}
            selectedElement={selectedElement}
            pipelineSteps={pipelineSteps}
            updateStepCode={updateStepCode}
          />
        </div>
      </div>

      <OutputPanel />
    </div>
  );
}

export default App;