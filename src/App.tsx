 
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
    handleOpenFile,
    variableDefinitions,
    pipelineDefinitions
  } = useWebpipe();

  // Handle jump-to-definition functionality
  const handleJumpToDefinition = (variableName: string, lineNumber?: number) => {
    // Find the variable in the parsed data and select it
    const variable = parsedData?.variables?.find((v: any) => v.name === variableName);
    
    if (variable) {
      // Select the variable element to show it in the sidebar
      setSelectedElement({
        type: 'variable',
        data: variable
      });
      
      // Switch to single view to show the variable details
      setViewMode('single');
      
      // console.log(`Jumped to variable definition: ${variableName}`);
    } else {
      console.log(`Variable not found: ${variableName}`);
    }
  };

  // Handle jump-to-pipeline functionality
  const handleJumpToPipeline = (pipelineName: string, lineNumber?: number) => {
    // Find the pipeline in the parsed data and select it
    const pipeline = parsedData?.pipelines?.find((p: any) => p.name === pipelineName);
    
    if (pipeline) {
      // Select the pipeline element to show it in the sidebar
      setSelectedElement({
        type: 'pipeline',
        data: pipeline
      });
      
      // Switch to flow view to show the pipeline visually
      setViewMode('flow');
      
      // console.log(`Jumped to pipeline definition: ${pipelineName}`);
    } else {
      console.log(`Pipeline not found: ${pipelineName}`);
    }
  };

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
            variableDefinitions={variableDefinitions}
            pipelineDefinitions={pipelineDefinitions}
            onJumpToDefinition={handleJumpToDefinition}
            onJumpToPipeline={handleJumpToPipeline}
          />
        </div>
      </div>

      <OutputPanel lastResponse={lastResponse} />
    </div>
  );
}

export default App;