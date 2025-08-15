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
    <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button
        onClick={() => {
          // Update webpipe source from current pipeline steps before switching to source view
          updateWebpipeSource();
          setViewMode('source');
        }}
        style={{
          padding: '8px 12px',
          backgroundColor: viewMode === 'source' ? '#0e639c' : '#37373d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          width: '100%'
        }}
      >
        📝 Source
      </button>
      <button
        onClick={() => setViewMode('all')}
        style={{
          padding: '8px 12px',
          backgroundColor: viewMode === 'all' ? '#0e639c' : '#37373d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          width: '100%'
        }}
      >
        📋 View All
      </button>
      <button
        onClick={() => setViewMode('single')}
        style={{
          padding: '8px 12px',
          backgroundColor: viewMode === 'single' ? '#0e639c' : '#37373d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          width: '100%'
        }}
      >
        📄 View Single
      </button>
      <button
        onClick={() => setViewMode('flow')}
        style={{
          padding: '8px 12px',
          backgroundColor: viewMode === 'flow' ? '#0e639c' : '#37373d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          width: '100%'
        }}
      >
        🔗 Box & Noodle
      </button>
    </div>
  );
};