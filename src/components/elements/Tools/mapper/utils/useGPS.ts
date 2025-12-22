import { useState, useEffect, useCallback } from 'react';
import { toLocal } from './helpers';
import type { GPSState, UseGPSReturn, Origin } from './types';

export const useGPS = (): UseGPSReturn => {
  const [gpsState, setGpsState] = useState<GPSState>({
    isActive: false,
    position: { x: 0, y: 0, z: 0, lat: null, lng: null, alt: null, accuracy: null },
    origin: null,
    error: null,
    watchId: null
  });

  const startGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsState(prev => ({ ...prev, error: 'GPS not available' }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position: GeolocationPosition) => {
        const { latitude, longitude, altitude, accuracy } = position.coords;
        
        setGpsState(prev => {
          // Set origin on first position
          const origin: Origin = prev.origin || { 
            lat: latitude, 
            lng: longitude, 
            alt: altitude || 0 
          };

          const local = toLocal(latitude, longitude, altitude, origin);

          return {
            ...prev,
            isActive: true,
            origin,
            position: {
              x: local.x,
              y: local.y,
              z: local.z,
              lat: latitude,
              lng: longitude,
              alt: altitude,
              accuracy
            },
            error: null
          };
        });
      },
      (error: GeolocationPositionError) => {
        const messages: { [key: number]: string } = {
          1: 'Permission denied',
          2: 'Position unavailable',
          3: 'Timeout'
        };
        setGpsState(prev => ({
          ...prev,
          isActive: false,
          error: messages[error.code] || 'GPS error'
        }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 500,
        timeout: 10000
      }
    );

    setGpsState(prev => ({ ...prev, watchId }));
  }, []);

  const stopGPS = useCallback(() => {
    if (gpsState.watchId) {
      navigator.geolocation.clearWatch(gpsState.watchId);
    }
    setGpsState(prev => ({
      ...prev,
      isActive: false,
      watchId: null
    }));
  }, [gpsState.watchId]);

  useEffect(() => {
    return () => {
      if (gpsState.watchId) {
        navigator.geolocation.clearWatch(gpsState.watchId);
      }
    };
  }, [gpsState.watchId]);

  return {
    ...gpsState,
    startGPS,
    stopGPS
  };
};