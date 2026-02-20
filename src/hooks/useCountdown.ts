import { useState, useEffect, useRef, useCallback } from "react";

export function useCountdown(initialSeconds: number, autoStart = true, onExpire?: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const runningRef = useRef(autoStart);

  useEffect(() => {
    runningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (!runningRef.current) {
        clearInterval(interval);
        return;
      }
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          runningRef.current = false;
          setIsRunning(false);
          setTimeout(() => onExpireRef.current?.(), 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const start = useCallback(() => {
    setSeconds(initialSeconds);
    setIsRunning(true);
  }, [initialSeconds]);

  const reset = useCallback((newSeconds?: number) => {
    setSeconds(newSeconds ?? initialSeconds);
    setIsRunning(true);
  }, [initialSeconds]);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const formatted = {
    minutes: Math.floor(seconds / 60),
    secs: seconds % 60,
    display: `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`,
    isLow: seconds <= 60,
    isVeryLow: seconds <= 30,
    seconds,
  };

  return { formatted, reset, start, stop, isRunning };
}

