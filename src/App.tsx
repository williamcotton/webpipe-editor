 
import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainEditor } from './components/MainEditor';
import { OutputPanel } from './components/OutputPanel';
import { EditableHeader } from './components/EditableHeader';
import { ThemeToggle } from './components/ThemeToggle';
import { useWebpipe } from './hooks/useWebpipe';
import { useTheme } from './hooks/useTheme';
import { jumpToCursorEditor } from './utils/processUtils';

function App() {
  const { theme, toggleTheme } = useTheme();
  
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
    updateElementValue,
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

  // State for Jump To Cursor checkbox
  const [jumpToCursor, setJumpToCursor] = useState(false);

  // Temporary flag to disable pipeline jump to Cursor (for variables it still works)
  const DISABLE_PIPELINE_JUMP_TO_CURSOR = true;
  // Temporary flag to disable partial jump to Cursor (for variables it still works)
  const DISABLE_PARTIAL_JUMP_TO_CURSOR = false; // Enable partial jump to Cursor

  // Handle jump-to-definition functionality
  const handleJumpToDefinition = (variableName: string, lineNumber?: number) => {
    // Find the variable in the parsed data and select it
    const variable = parsedData?.variables?.find((v: any) => v.name === variableName);
    
    if (variable) {
      const isHandlebarsPartial = variable.varType === 'handlebars';
      const shouldJumpToCursor = jumpToCursor && currentFilePath && 
        (isHandlebarsPartial ? !DISABLE_PARTIAL_JUMP_TO_CURSOR : true);
      
      if (shouldJumpToCursor) {
        // Jump to Cursor editor with the file path and line number
        jumpToCursorEditor(currentFilePath, lineNumber);
      } else {
        // Select the variable element to show it in the sidebar
        setSelectedElement({
          type: 'variable',
          data: variable
        });
        
        // Switch to single view to show the variable details
        setViewMode('single');
      }
      
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
      if (jumpToCursor && currentFilePath && !DISABLE_PIPELINE_JUMP_TO_CURSOR) {
        // Jump to Cursor editor with the file path and line number
        jumpToCursorEditor(currentFilePath, lineNumber);
      } else {
        // Select the pipeline element to show it in the sidebar
        setSelectedElement({
          type: 'pipeline',
          data: pipeline
        });
        
        // Switch to flow view to show the pipeline visually
        setViewMode('flow');
      }
      
      // console.log(`Jumped to pipeline definition: ${pipelineName}`);
    } else {
      console.log(`Pipeline not found: ${pipelineName}`);
    }
  };

  return (
    <div className="app">
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
        jumpToCursor={jumpToCursor}
        onJumpToCursorChange={setJumpToCursor}
      />

      {/* Main Editor Area */}
      <div className="main-editor-area">
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
          theme={theme}
          onThemeToggle={toggleTheme}
        />

        {/* Main Content Area */}
        <div className="main-editor-content">
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
            updateElementValue={updateElementValue}
            theme={theme}
          />
        </div>
      </div>

      <OutputPanel lastResponse={lastResponse} />
    </div>
  );
}

export default App;