import React, { useState, useEffect } from 'react';
import { SelectedElement } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface EditableHeaderProps {
  selectedElement: SelectedElement | null;
  onNameChange: (newName: string) => void;
  onDelete: () => void;
  currentFilePath: string | null;
  isModified: boolean;
  serverBaseUrl: string;
  routeTestInputs: Record<string, string>;
  setRouteTestInput: (routeKey: string, value: string) => void;
  testRouteGet: (route: any, overridePathOrUrl?: string) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export const EditableHeader: React.FC<EditableHeaderProps> = ({
  selectedElement,
  onNameChange,
  onDelete,
  currentFilePath,
  isModified,
  serverBaseUrl,
  routeTestInputs,
  setRouteTestInput,
  testRouteGet,
  theme,
  onThemeToggle
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (selectedElement) {
      setEditValue(getElementName(selectedElement));
    }
  }, [selectedElement]);

  const getElementName = (element: SelectedElement): string => {
    switch (element.type) {
      case 'route':
        return `${element.data.method} ${element.data.path}`;
      case 'test':
        return element.data.name;
      case 'variable':
        return element.data.name;
      case 'pipeline':
        return element.data.name;
      case 'config':
        return element.data.name;
      default:
        return 'Unknown';
    }
  };

  const getElementPrefix = (element: SelectedElement): string => {
    switch (element.type) {
      case 'route':
        return '';
      case 'test':
        return 'describe "';
      case 'variable':
        return `${element.data.varType} `;
      case 'pipeline':
        return 'pipeline ';
      case 'config':
        return 'config ';
      default:
        return '';
    }
  };

  const getElementSuffix = (element: SelectedElement): string => {
    return element.type === 'test' ? '"' : '';
  };

  const handleStartEdit = () => {
    if (!selectedElement) return;
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editValue.trim() && selectedElement) {
      onNameChange(editValue.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (selectedElement) {
      setEditValue(getElementName(selectedElement));
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!selectedElement) {
    return (
      <div className="editable-header">
        <span className="editable-header-title">
          test.wp - WebPipe Editor
        </span>
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
      </div>
    );
  }

  const prefix = getElementPrefix(selectedElement);
  const suffix = getElementSuffix(selectedElement);
  const name = getElementName(selectedElement);

  return (
    <div className="header">
      <span className="header-title">
        {currentFilePath ? 
          `${currentFilePath.split('/').pop()}${isModified ? ' •' : ''} - WebPipe Editor` : 
          `Untitled${isModified ? ' •' : ''} - WebPipe Editor`
        }
      </span>
      <span className="divider">|</span>
      <div className="header-main">
        <div className="name-container">
          <span className="prefix">{prefix}</span>
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              autoFocus
              className="name-input"
            />
          ) : (
            <span
              onClick={handleStartEdit}
              className="name-display"
            >
              {name}
            </span>
          )}
          <span className="suffix">{suffix}</span>
        </div>

        {selectedElement?.type === 'route' && (
          <div className="route-test">
            <input
              type="text"
              placeholder={selectedElement.data.path}
              value={
                routeTestInputs[`${selectedElement.data.method} ${selectedElement.data.path}`] ||
                selectedElement.data.path
              }
              onChange={(e) =>
                setRouteTestInput(
                  `${selectedElement.data.method} ${selectedElement.data.path}`,
                  e.target.value
                )
              }
              title={
                serverBaseUrl
                  ? `${serverBaseUrl}${selectedElement.data.path}`
                  : 'Enter full URL or path'
              }
              className="route-input"
            />
            <button
              onClick={() => testRouteGet(selectedElement.data)}
              title="GET route"
              className="get-button"
            >
              GET
            </button>
          </div>
        )}

        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        <button
          onClick={onDelete}
          className="delete-button"
          title="Delete this element"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};