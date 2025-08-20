import { useEffect } from 'react';
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
      className="context-menu"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="context-menu-header">Add Node</div>
      <div className="context-menu-divider" />

      {availableOperations.map((op) => (
        <div
          key={op.type}
          onClick={() => {
            onCreateNode(op.type);
            onClose();
          }}
          className="context-menu-item"
        >
          <span>{op.label}</span>
          <span className="context-menu-tag">{op.language}</span>
        </div>
      ))}

      <div className="context-menu-divider" />

      <div
        onClick={() => {
          onCreateNode('result');
          onClose();
        }}
        className="context-menu-item"
      >
        <span>result block</span>
        <span className="context-menu-tag">flow</span>
      </div>
    </div>
  );
};