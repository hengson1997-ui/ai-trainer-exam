import { useState, useEffect, useRef } from 'react';

export default function Timer({ duration, onTimeUp, isRunning = true }) {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert to seconds
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const percentage = (timeLeft / (duration * 60)) * 100;

  const getColor = () => {
    if (percentage > 50) return 'text-emerald-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBgColor = () => {
    if (percentage > 50) return 'bg-emerald-100';
    if (percentage > 20) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className={`inline-flex items-center px-3 py-1.5 rounded-lg ${getBgColor()}`}>
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className={`font-mono font-medium ${getColor()}`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
