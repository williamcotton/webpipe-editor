import React, { useState, useEffect } from 'react';
import { availableOperations } from '../utils';

interface FlowContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onCreateNode: (type: string) => void;
  visible: boolean;
}

export const FlowContextMenu: React.FC<FlowContextMenuProps> = ({
  x,
  y,
  onClose,
  onCreateNode,
  visible
}) => {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    if (visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        backgroundColor: '#2d2d30',
        border: '1px solid #3e3e42',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        padding: '8px 0',
        zIndex: 1000,
        minWidth: '160px',
        fontSize: '12px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{
        padding: '4px 12px',
        color: '#888',
        fontSize: '10px',
        textTransform: 'uppercase',
        fontWeight: 'bold'
      }}>
        Add Node
      </div>
      <div style={{ borderTop: '1px solid #3e3e42', margin: '4px 0' }} />
      
      {availableOperations.map((op) => (
        <div
          key={op.type}
          onClick={() => {
            onCreateNode(op.type);
            onClose();
          }}
          style={{
            padding: '6px 12px',
            cursor: 'pointer',
            color: '#cccccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0e639c';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span>{op.label}</span>
          <span style={{ 
            fontSize: '9px', 
            color: '#888',
            backgroundColor: '#37373d',
            padding: '2px 4px',
            borderRadius: '3px'
          }}>
            {op.language}
          </span>
        </div>
      ))}
      
      <div style={{ borderTop: '1px solid #3e3e42', margin: '4px 0' }} />
      
      <div
        onClick={() => {
          onCreateNode('result');
          onClose();
        }}
        style={{
          padding: '6px 12px',
          cursor: 'pointer',
          color: '#cccccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#0e639c';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span>result block</span>
        <span style={{ 
          fontSize: '9px', 
          color: '#888',
          backgroundColor: '#37373d',
          padding: '2px 4px',
          borderRadius: '3px'
        }}>
          flow
        </span>
      </div>
    </div>
  );
};