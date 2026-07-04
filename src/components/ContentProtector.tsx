'use client';

import React, { useEffect } from 'react';

interface ContentProtectorProps {
  children: React.ReactNode;
  active?: boolean;
}

export default function ContentProtector({ children, active = true }: ContentProtectorProps) {
  useEffect(() => {
    if (!active) return;

    // 1. Disable Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Disable Keyboard Shortcuts (Ctrl+C, Ctrl+S, Ctrl+U, F12, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+Shift+I (Inspect)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+S (Save Page)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+C (Copy)
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+X (Cut)
      if (e.ctrlKey && e.key === 'x') {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+P (Print)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        return false;
      }
    };

    // 3. Disable Drag and Drop (Downloading images/videos)
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // Attach event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      // Clean up event listeners
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, [active]);

  return (
    <div className={active ? 'no-select select-none' : ''}>
      {children}
    </div>
  );
}
