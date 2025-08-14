import React, { useState, useEffect } from 'react';
import { SelectedElement } from '../types';

interface EditableHeaderProps {
  selectedElement: SelectedElement | null;
  onNameChange: (newName: string) => void;
  onDelete: () => void;
  currentFilePath: string | null;
  isModified: boolean;
}

export const EditableHeader: React.FC<EditableHeaderProps> = ({
  selectedElement,
  onNameChange,
  onDelete,
  currentFilePath,
  isModified
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
    );
  }

  const prefix = getElementPrefix(selectedElement);
  const suffix = getElementSuffix(selectedElement);
  const name = getElementName(selectedElement);

  return (
    <div style={{
      padding: '12px 16px',
      backgroundColor: '#2d2d30',
      borderBottom: '1px solid #3e3e42',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <span style={{ fontSize: '14px', color: '#888' }}>
        {currentFilePath ? 
          `${currentFilePath.split('/').pop()}${isModified ? ' •' : ''} - WebPipe Editor` : 
          `Untitled${isModified ? ' •' : ''} - WebPipe Editor`
        }
      </span>
      <span style={{ color: '#3e3e42' }}>|</span>
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', color: '#cccccc' }}>
          {prefix}
        </span>
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              backgroundColor: '#37373d',
              border: '1px solid #0e639c',
              borderRadius: '3px',
              padding: '2px 6px',
              fontSize: '14px',
              color: '#cccccc',
              outline: 'none',
              minWidth: '100px'
            }}
          />
        ) : (
          <span
            onClick={handleStartEdit}
            style={{
              fontSize: '14px',
              color: '#cccccc',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '3px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#37373d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {name}
          </span>
        )}
          <span style={{ fontSize: '14px', color: '#cccccc' }}>
            {suffix}
          </span>
        </div>
        <button
          onClick={onDelete}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#cccccc',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '3px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ff4444';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#cccccc';
          }}
          title="Delete this element"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};