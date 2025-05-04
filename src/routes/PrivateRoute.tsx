import React, { JSX, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { RootState } from '../Redux/store';
import { sessionManager } from '../utils/sessionManager';

const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifySession = async () => {
      const isValidToken = await sessionManager.verifyToken();
      setIsValid(isValidToken);
      setIsVerifying(false);

      if (isValidToken && location.pathname.startsWith('/admin') && user?.role !== 'admin') {
        navigate('/admin');
      }
    };
    verifySession();
  }, []);

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-900"></div>
      </div>
    );
  }

  return isValid ? children : <Navigate to="/" state={{ from: location }} replace />;
};

export default PrivateRoute; 