// src/RouteTracker.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../backend/firebaseConfig'; 

const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    // Log to Firebase
    logEvent(analytics, 'screen_view', {
      firebase_screen: path,
      firebase_screen_class: 'RouteComponent',
    });

    // Debug log to console
    console.log(`[Analytics] screen_view logged: ${path}`);
  }, [location]);

  return null;
};

export default RouteTracker;
