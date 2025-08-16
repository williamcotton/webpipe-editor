 
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
    setSelectedRoute,
    selectedElement,
    setSelectedElement,
    viewMode,
    setViewMode,
    parsedData,
    updateWebpipeSource,
    addStep,
    deleteStep,
    updatePipelineStructure,
    updateStepCode,
    createNewRoute,
    createNewTest,
    createNewVariable,
    createNewPipeline,
    createNewConfig,
    updateElementName,
    deleteElement,
    deleteSpecificElement,
    serverBaseUrl,
    setServerBaseUrl,
    routeTestInputs,
    setRouteTestInput,
    lastResponse,
    testRouteGet,
    handleInstanceSelect,
    handleOpenFile
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
        serverBaseUrl={serverBaseUrl}
        setServerBaseUrl={setServerBaseUrl}
        onInstanceSelect={handleInstanceSelect}
        onOpenFile={handleOpenFile}
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
          serverBaseUrl={serverBaseUrl}
          routeTestInputs={routeTestInputs}
          setRouteTestInput={setRouteTestInput}
          testRouteGet={testRouteGet}
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
            addStep={addStep}
            deleteStep={deleteStep}
            updatePipelineStructure={updatePipelineStructure}
          />
        </div>
      </div>

      <OutputPanel lastResponse={lastResponse} />
    </div>
  );
}

export default App;