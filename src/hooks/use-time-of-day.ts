import { useState, useEffect } from 'react';

export type TimeOfDay = 'day' | 'sunset' | 'night';

export function useTimeOfDay(): TimeOfDay {
  const [time, setTime] = useState<TimeOfDay>('day');

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      if (hour >= 20 || hour <= 5) {
        setTime('night');
      } else if (hour === 6 || hour === 7 || hour === 18 || hour === 19) {
        setTime('sunset');
      } else {
        setTime('day');
      }
    };
    
    checkTime();
    // Check periodically in case they leave it open for a long time
    const interval = setInterval(checkTime, 1000 * 60 * 10);
    return () => clearInterval(interval);
  }, []);

  return time;
}

export function getSkyConfig(time: TimeOfDay) {
  switch (time) {
    case 'night':
      return {
        sunPosition: [0, -10, 0] as [number, number, number],
        turbidity: 20,
        rayleigh: 0.1,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.8,
        ambientIntensity: 0.7,  // Sky is dark but scene stays lit
        dirIntensity: 0.6,
        dirColor: "#C8D8FF"     // Cool moonlight blue tint
      };
    case 'sunset':
      return {
        sunPosition: [100, 2, 100] as [number, number, number],
        turbidity: 10,
        rayleigh: 3,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.8,
        ambientIntensity: 0.5,
        dirIntensity: 0.8,
        dirColor: "#FFA07A"
      };
    case 'day':
    default:
      return {
        sunPosition: [100, 20, 100] as [number, number, number],
        turbidity: 8,
        rayleigh: 2,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.8,
        ambientIntensity: 0.8,
        dirIntensity: 1.0,
        dirColor: "#FFFFFF"
      };
  }
}
