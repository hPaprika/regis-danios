import { useEffect } from "react";

/**
 * Hook that automatically clears luggageRecords from localStorage at 23:59:59
 * @param onClear - Optional callback to execute when records are cleared
 */
export const useAutoClearRecords = (onClear?: () => void) => {
  useEffect(() => {
    const checkAndClearRecords = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      // Check if it's 23:59:59
      if (hours === 23 && minutes === 59 && seconds === 59) {
        localStorage.removeItem("luggageRecords");
        localStorage.removeItem("luggageMetadata");
        console.log("Auto-cleared luggageRecords at 23:59:59");
        
        // Execute callback if provided
        if (onClear) {
          onClear();
        }
      }
    };

    // Check every second
    const interval = setInterval(checkAndClearRecords, 1000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [onClear]);
};
