import { useRef, useCallback, useState } from "react";
import { applyOp } from "../utils/ot.js";

export const useSessionPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);

  const timeoutsRef = useRef([]);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const pauseTimeRef = useRef(null);

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    clearInterval(intervalRef.current);
  }, []);

  const playFrom = useCallback(
    (events, startMs, duration, onEvent, onComplete) => {
      clearTimeouts();

      const futureEvents = events.filter((e) => e.t >= startMs);

      futureEvents.forEach((event) => {
        const delay = (event.t - startMs) / speed;
        const timeout = setTimeout(() => {
          onEvent(event);
          setCurrentTime(event.t);
        }, delay);
        timeoutsRef.current.push(timeout);
      });

      startTimeRef.current = Date.now() - startMs / speed;
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) * speed;
        setCurrentTime(Math.min(elapsed, duration));
      }, 100);

      const totalDelay = (duration - startMs) / speed;
      const completeTimeout = setTimeout(() => {
        setIsPlaying(false);
        clearInterval(intervalRef.current);
        if (onComplete) onComplete();
      }, totalDelay);
      timeoutsRef.current.push(completeTimeout);

      setIsPlaying(true);
    },
    [speed, clearTimeouts],
  );

  const seekTo = useCallback(
    (targetMs, events, duration, onEvent, onComplete) => {
      clearTimeouts();

      const pastEvents = events.filter((e) => e.t <= targetMs);
      pastEvents.forEach((e) => onEvent(e));

      setCurrentTime(targetMs);

      if (isPlaying) {
        playFrom(events, targetMs, duration, onEvent, onComplete);
      }
    },
    [clearTimeouts, isPlaying, playFrom],
  );

  const pause = useCallback(() => {
    clearTimeouts();
    pauseTimeRef.current = currentTime;
    setIsPlaying(false);
  }, [clearTimeouts, currentTime]);

  const resume = useCallback(
    (events, duration, onEvent, onComplete) => {
      playFrom(
        events,
        pauseTimeRef.current || 0,
        duration,
        onEvent,
        onComplete,
      );
    },
    [playFrom],
  );

  const stop = useCallback(() => {
    clearTimeouts();
    setIsPlaying(false);
    setCurrentTime(0);
  }, [clearTimeouts]);

  return {
    isPlaying,
    currentTime,
    speed,
    setSpeed,
    playFrom,
    seekTo,
    pause,
    resume,
    stop,
    clearTimeouts,
  };
};
