import React from 'react';

interface AddButtonProps {
  onClick: () => void;
  label: string;
}

export const AddButton: React.FC<AddButtonProps> = ({ onClick, label }) => {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '6px 8px',
        margin: '4px 0',
        backgroundColor: '#37373d',
        color: '#cccccc',
        border: '1px dashed #3e3e42',
        borderRadius: '3px',
        cursor: 'pointer',
        fontSize: '11px',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#404040';
        e.currentTarget.style.borderColor = '#555';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#37373d';
        e.currentTarget.style.borderColor = '#3e3e42';
      }}
    >
      <span style={{ marginRight: '4px' }}>+</span>
      {label}
    </button>
  );
};