import { useState, useEffect, useRef, useCallback } from "react";

export function useCountdown(initialSeconds: number, onExpire?: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!isRunning) return;
    if (seconds <= 0) {
      setIsRunning(false);
      onExpireRef.current?.();
      return;
    }
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          onExpireRef.current?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, seconds]);

  const reset = useCallback((newSeconds?: number) => {
    setSeconds(newSeconds ?? initialSeconds);
    setIsRunning(true);
  }, [initialSeconds]);

  const stop = useCallback(() => setIsRunning(false), []);

  const formatted = {
    minutes: Math.floor(seconds / 60),
    secs: seconds % 60,
    display: `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`,
    isLow: seconds <= 60,
    isVeryLow: seconds <= 30,
    seconds,
  };

  return { formatted, reset, stop, isRunning };
}
