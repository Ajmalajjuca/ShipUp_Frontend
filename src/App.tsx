// src/App.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from './Redux/store';
import { Toaster } from 'react-hot-toast';
import { sessionManager } from './utils/sessionManager';
import { loginSuccess } from './Redux/slices/authSlice';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { DialogProvider } from './utils/confirmDialog';
import { GoogleMapsProvider } from './contexts/GoogleMapsProvider';

import AppRoutes from './routes/AppRoutes';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const [isSessionRestored, setIsSessionRestored] = useState(false);
  const navigate = useNavigate();
  const stripePromise = loadStripe('pk_test_51RLduuQ6G2nx1510KNlbxScOpOASA81ywCSBMFJddFr2AjmgLy2g5HqPlGnVPDXQd8bOwwlAGr0R62wbariePe4x00plYo5Add');

  useEffect(() => {
    const initializeApp = async () => {
      const MIN_LOADING_TIME = 2000;
      const startTime = Date.now();

      try {
        const { token, user } = sessionManager.getSession();
        
        if (token && user) {
          const isValid = await sessionManager.verifyToken();
          
          if (isValid) {
            const updatedSession = sessionManager.getSession();            
            dispatch(loginSuccess({ user: updatedSession.user, token:updatedSession.token||'', refreshToken: updatedSession.refreshToken|| '' }));
          } else {
            sessionManager.clearSession();
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Session restoration error:', error);
        sessionManager.clearSession();
      }

      const elapsedTime = Date.now() - startTime;
      const remainingTime = MIN_LOADING_TIME - elapsedTime;
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      setIsSessionRestored(true);
    };

    initializeApp();
  }, [dispatch, navigate]);

  if (!isSessionRestored) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full max-w-md"
          src="/loading-video.mp4"
          onError={(e) => console.error('Video loading error:', e)}
        >
          <source src="/loading-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <GoogleMapsProvider>
      <Elements stripe={stripePromise}>
      <DialogProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </DialogProvider>
      </Elements>
      </GoogleMapsProvider>
    </GoogleOAuthProvider>
  );
}

export default App;