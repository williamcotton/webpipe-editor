import React from 'react';
import { ViewModeButtons } from './ViewModeButtons';
import { WebPipeStructure } from './WebPipeStructure';
import { WebpipeInstanceDropdown } from './WebpipeInstanceDropdown';
import { PipelineStep, SelectedElement, ViewMode } from '../types';
import { WebpipeInstance } from '../utils/processUtils';

interface SidebarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  updateWebpipeSource: () => string | null;
  parsedData: any;
  selectedElement: SelectedElement | null;
  setSelectedElement: (element: SelectedElement) => void;
  setPipelineSteps: (steps: PipelineStep[]) => void;
  setSelectedRoute: (route: string) => void;
  createNewRoute: () => void;
  createNewTest: () => void;
  createNewVariable: () => void;
  createNewPipeline: () => void;
  createNewConfig: () => void;
  deleteSpecificElement: (elementType: string, elementData: any) => void;
  serverBaseUrl: string;
  setServerBaseUrl: (url: string) => void;
  onInstanceSelect: (instance: WebpipeInstance) => void;
  onOpenFile: (filePath: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  viewMode,
  setViewMode,
  updateWebpipeSource,
  parsedData,
  selectedElement,
  setSelectedElement,
  setPipelineSteps,
  setSelectedRoute,
  createNewRoute,
  createNewTest,
  createNewVariable,
  createNewPipeline,
  createNewConfig,
  deleteSpecificElement,
  serverBaseUrl,
  setServerBaseUrl,
  onInstanceSelect,
  onOpenFile
}) => {
  return (
    <div style={{
      width: '200px',
      minWidth: '200px',
      flexShrink: 0,
      backgroundColor: '#252526',
      borderRight: '1px solid #3e3e42',
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', color: '#cccccc', fontSize: '11px', marginBottom: '4px' }}>Server Base URL</label>
        <input
          type="text"
          placeholder="http://localhost:9080"
          value={serverBaseUrl}
          onChange={(e) => setServerBaseUrl(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            backgroundColor: '#1e1e1e',
            border: '1px solid #3e3e42',
            borderRadius: '3px',
            color: '#cccccc',
            fontSize: '12px'
          }}
        />
      </div>
      
      <WebpipeInstanceDropdown
        onInstanceSelect={onInstanceSelect}
        onOpenFile={onOpenFile}
      />
      
      <ViewModeButtons
        viewMode={viewMode}
        setViewMode={setViewMode}
        updateWebpipeSource={updateWebpipeSource}
      />
      
      <WebPipeStructure
        parsedData={parsedData}
        selectedElement={selectedElement}
        setSelectedElement={setSelectedElement}
        setViewMode={setViewMode}
        setPipelineSteps={setPipelineSteps}
        setSelectedRoute={setSelectedRoute}
        createNewRoute={createNewRoute}
        createNewTest={createNewTest}
        createNewVariable={createNewVariable}
        createNewPipeline={createNewPipeline}
        createNewConfig={createNewConfig}
        deleteSpecificElement={deleteSpecificElement}
      />
    </div>
  );
};