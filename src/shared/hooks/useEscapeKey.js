import { useEffect } from "react";

/**
 * Custom hook to handle Escape key press
 * @param {boolean} isActive - Whether the escape key should be active
 * @param {Function} onEscape - Callback function to call when Escape is pressed
 */
export const useEscapeKey = (isActive, onEscape) => {
  useEffect(() => {
    if (!isActive) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onEscape();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isActive, onEscape]);
};
