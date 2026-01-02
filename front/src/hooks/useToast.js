import { useCallback, useRef, useState } from "react";

export function useToast({ duration = 4000 } = {}) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const clearToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message, variant = "info") => {
      if (!message) return;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setToast({ message, variant });
      timerRef.current = setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, duration);
    },
    [duration]
  );

  return {
    toast,
    showToast,
    clearToast,
  };
}

export default useToast;
