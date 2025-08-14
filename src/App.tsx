import React from 'react';
import { Sidebar } from './components/Sidebar';
import { MainEditor } from './components/MainEditor';
import { OutputPanel } from './components/OutputPanel';
import { EditableHeader } from './components/EditableHeader';
import { useWebpipe } from './hooks/useWebpipe';

function App() {
  const {
    webpipeSource,
    setWebpipeSource,
    currentFilePath,
    isModified,
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
    updateStepCode,
    createNewRoute,
    createNewTest,
    createNewVariable,
    createNewPipeline,
    createNewConfig,
    updateElementName,
    deleteElement,
    deleteSpecificElement
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
        createNewRoute={createNewRoute}
        createNewTest={createNewTest}
        createNewVariable={createNewVariable}
        createNewPipeline={createNewPipeline}
        createNewConfig={createNewConfig}
        deleteSpecificElement={deleteSpecificElement}
      />

      {/* Main Editor Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <EditableHeader
          selectedElement={selectedElement}
          onNameChange={updateElementName}
          onDelete={deleteElement}
          currentFilePath={currentFilePath}
          isModified={isModified}
        />

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