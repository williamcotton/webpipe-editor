import { useState, useEffect, useCallback } from 'react';
import { ViewMode, SelectedElement } from '../types';

const DEFAULT_CONTENT = [
  '# Test App',
  '',
  'GET /hello/:world',
  '  |> jq: `{ world: .params.world }`',
  '  |> handlebars: `<p>hello, {{world}}</p>`',
  '',
  'describe "hello, world"',
  '  it "calls the route"',
  '    when calling GET /hello/world',
  '    then status is 200',
  '    and output equals `<p>hello, world</p>`',
  '',
  'GET /lua/:id/example',
  '  |> lua: `',
  '    local id = request.params.id',
  '    local name = request.query.name',
  '    return {',
  '      message = "Hello from Lua!",',
  '      id = id,',
  '      name = name',
  '    }',
  '  `'
].join('\n');

interface UseFileOperationsProps {
  webpipeSource: string;
  setWebpipeSource: (source: string) => void;
  setSelectedElement: (element: SelectedElement | null) => void;
  setViewMode: (mode: ViewMode) => void;
  updateWebpipeSource: () => string | null;
  setIsUpdatingFromExternalChange: (value: boolean) => void;
  onExternalFileChange?: (content: string) => void;
}

export const useFileOperations = ({
  webpipeSource,
  setWebpipeSource,
  setSelectedElement,
  setViewMode,
  updateWebpipeSource,
  setIsUpdatingFromExternalChange,
  onExternalFileChange
}: UseFileOperationsProps) => {
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isModified, setIsModified] = useState<boolean>(false);

  const handleNewFile = useCallback(() => {
    setWebpipeSource(DEFAULT_CONTENT);
    setCurrentFilePath(null);
    setIsModified(false);
    setSelectedElement(null);
    setViewMode('source');
    if (window.electronAPI) {
      window.electronAPI.setWindowTitle('WebPipe Editor - Untitled');
    }
  }, [setWebpipeSource, setSelectedElement, setViewMode]);

  const handleFileOpened = useCallback((data: { filePath: string; content: string }) => {
    setWebpipeSource(data.content);
    setCurrentFilePath(data.filePath);
    setIsModified(false);
    setSelectedElement(null);
    setViewMode('source');
  }, [setWebpipeSource, setSelectedElement, setViewMode]);

  const handleFileChangedExternally = useCallback((data: { filePath: string; content: string }) => {
    if (data.filePath === currentFilePath) {
      setIsUpdatingFromExternalChange(true);
      setWebpipeSource(data.content);
      setIsModified(false);
      
      if (onExternalFileChange) {
        onExternalFileChange(data.content);
      }
    }
  }, [currentFilePath, setIsUpdatingFromExternalChange, setWebpipeSource, onExternalFileChange]);

  const handleSave = useCallback(async () => {
    if (!window.electronAPI) return;

    const updatedSource = updateWebpipeSource();
    let sourceToSave = updatedSource !== null ? updatedSource : webpipeSource;
    
    if (typeof sourceToSave !== 'string') {
      console.error('sourceToSave is not a string:', typeof sourceToSave, sourceToSave);
      sourceToSave = String(sourceToSave);
    }

    if (currentFilePath) {
      const success = await window.electronAPI.saveFileToPath(currentFilePath, sourceToSave);
      if (success) {
        setIsModified(false);
      }
    } else {
      handleSaveAs();
    }
  }, [currentFilePath, updateWebpipeSource, webpipeSource]);

  const handleSaveAs = useCallback(async () => {
    if (!window.electronAPI) return;

    const updatedSource = updateWebpipeSource();
    const sourceToSave = updatedSource !== null ? updatedSource : webpipeSource;

    const filePath = await window.electronAPI.showSaveDialog(currentFilePath || 'untitled.wp');
    if (filePath) {
      const success = await window.electronAPI.saveFileToPath(filePath, sourceToSave);
      if (success) {
        setCurrentFilePath(filePath);
        setIsModified(false);
      }
    }
  }, [currentFilePath, updateWebpipeSource, webpipeSource]);

  const handleClose = useCallback(() => {
    if (isModified) {
      console.warn('File has unsaved changes');
    }
    handleNewFile();
  }, [isModified, handleNewFile]);

  const handleOpenFile = useCallback(async (filePath: string) => {
    if (!window.electronAPI) return;
    
    try {
      const content = await window.electronAPI.loadFile(filePath);
      setWebpipeSource(content);
      setCurrentFilePath(filePath);
      setIsModified(false);
      setSelectedElement(null);
      setViewMode('source');
      if (window.electronAPI) {
        window.electronAPI.setWindowTitle(`WebPipe Editor - ${filePath}`);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  }, [setWebpipeSource, setSelectedElement, setViewMode]);

  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.onFileNew(handleNewFile);
    window.electronAPI.onFileOpened(handleFileOpened);
    window.electronAPI.onFileSave(handleSave);
    window.electronAPI.onFileSaveAs(handleSaveAs);
    window.electronAPI.onFileClose(handleClose);
    window.electronAPI.onFileChangedExternally(handleFileChangedExternally);

    return () => {
      window.electronAPI.removeAllListeners('file-new');
      window.electronAPI.removeAllListeners('file-opened');
      window.electronAPI.removeAllListeners('file-save');
      window.electronAPI.removeAllListeners('file-save-as');
      window.electronAPI.removeAllListeners('file-close');
      window.electronAPI.removeAllListeners('file-changed-externally');
    };
  }, [handleNewFile, handleFileOpened, handleSave, handleSaveAs, handleClose, handleFileChangedExternally]);

  return {
    currentFilePath,
    isModified,
    setIsModified,
    handleOpenFile
  };
};