import React from 'react';

interface AddButtonProps {
  onClick: () => void;
  label: string;
}

export const AddButton: React.FC<AddButtonProps> = ({ onClick, label }) => {
  return (
    <button
      onClick={onClick}
      className="add-button"
    >
      <span className="add-button-icon">+</span>
      {label}
    </button>
  );
};