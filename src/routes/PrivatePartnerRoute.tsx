import React, { JSX, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionManager } from '../utils/sessionManager';
import { toast } from 'react-hot-toast';

const PrivatePartnerRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPartnerSession = async () => {
      try {
        const { token, driverData } = sessionManager.getDriverSession();
        
        if (!token || !driverData) {
          setIsAuthenticated(false);
          navigate('/partner', { replace: true });
          return;
        }

        if (driverData.role !== 'partner') {
          sessionManager.clearDriverSession();
          toast.error('Invalid session. Please login again.');
          navigate('/partner', { replace: true });
          return;
        }

        const isValid = await sessionManager.verifyPartnerToken();
        
        if (!isValid) {
          sessionManager.clearDriverSession();
          toast.error('Session expired. Please login again.');
          navigate('/partner', { replace: true });
          return;
        }

        // Prevent back navigation after successful verification
        window.history.pushState(null, '', window.location.pathname);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Partner session verification failed:', error);
        sessionManager.clearDriverSession();
        toast.error('Authentication failed. Please login again.');
        navigate('/partner', { replace: true });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPartnerSession();

    // Add popstate event listener
    const handlePopState = (event: PopStateEvent) => {
      window.history.pushState(null, '', window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : null;
};

export default PrivatePartnerRoute; 