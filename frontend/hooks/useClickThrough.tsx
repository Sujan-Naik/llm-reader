import { useEffect } from 'react';

/**
 * Hook to make transparent areas click-through,
 * handled by the main process timer (safe even without renderer events).
 */
export function useClickThrough() {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !window.windowControl?.requestClickThrough
    ) {
      return;
    }

    const handleMouseDown = (e: MouseEvent) => {
      const element = document.elementFromPoint(e.clientX, e.clientY);
      if (!element) return;

      const style = window.getComputedStyle(element);
      const bgColor = style.backgroundColor;
      const opacity = parseFloat(style.opacity);

      const isTransparent =
        bgColor === 'rgba(0, 0, 0, 0)' ||
        bgColor === 'transparent' ||
        opacity === 0;

      if (isTransparent) {
        // tell main process to temporarily enable transparency
        window.windowControl.requestClickThrough();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.windowControl?.setIgnoreMouseEvents(false);
    };
  }, []);
}