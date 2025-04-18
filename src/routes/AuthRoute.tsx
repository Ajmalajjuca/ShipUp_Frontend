import React, { JSX, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState } from '../Redux/store';

const AuthRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/home';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  return !user ? children : null;
};

export default AuthRoute; 