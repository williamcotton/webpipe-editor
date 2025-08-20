import React from 'react';
import { ViewMode } from '../types';

interface ViewModeButtonsProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  updateWebpipeSource: () => string | null;
}

export const ViewModeButtons: React.FC<ViewModeButtonsProps> = ({
  viewMode,
  setViewMode,
  updateWebpipeSource
}) => {
  return (
    <div className="viewmode-buttons">
      <button
        onClick={() => {
          updateWebpipeSource();
          setViewMode('source');
        }}
        className={`viewmode-button ${viewMode === 'source' ? 'active' : ''}`}
      >
        📝 Source
      </button>

      <button
        onClick={() => setViewMode('all')}
        className={`viewmode-button ${viewMode === 'all' ? 'active' : ''}`}
      >
        📋 View All
      </button>

      <button
        onClick={() => setViewMode('single')}
        className={`viewmode-button ${viewMode === 'single' ? 'active' : ''}`}
      >
        📄 View Single
      </button>

      <button
        onClick={() => setViewMode('flow')}
        className={`viewmode-button ${viewMode === 'flow' ? 'active' : ''}`}
      >
        🔗 Box & Noodle
      </button>
    </div>
  );
};
