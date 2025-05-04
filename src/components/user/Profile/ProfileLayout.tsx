import React from 'react';
import NavBar from '../NavBar';
import Global_map from '../Landing/Global_map';
import Footer from '../Footer';
import ProfileCard from '../../common/ProfileCard';
import { useSelector } from 'react-redux';
import { RootState } from '../../../Redux/store';
import { useNavigate } from 'react-router-dom';
import { sessionManager } from '../../../utils/sessionManager';
import { toast } from 'react-hot-toast';

interface ProfileLayoutProps {
  children: React.ReactNode;
}

const ProfileLayout: React.FC<ProfileLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    try {
      sessionManager.clearSession();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div>
      <NavBar />
      <div className="flex flex-col md:flex-row gap-6 p-6 max-w-6xl mx-auto">
        <ProfileCard 
          userData={user}
          onLogout={handleLogout}
        />
        {children}
      </div>
      <Global_map />
      <Footer />
    </div>
  );
};

export default ProfileLayout; 