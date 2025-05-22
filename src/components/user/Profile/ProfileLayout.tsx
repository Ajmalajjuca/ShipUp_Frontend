import React, { useState } from 'react';
import NavBar from '../NavBar';
import Global_map from '../Landing/Global_map';
import Footer from '../Footer';
import ProfileCard from '../../common/ProfileCard';
import { useSelector } from 'react-redux';
import { RootState } from '../../../Redux/store';
import { useNavigate } from 'react-router-dom';
import { sessionManager } from '../../../utils/sessionManager';
import { toast } from 'react-hot-toast';
import WalletComponent from './ProfileComponents/WalletComponent';

interface ProfileLayoutProps {
  children: React.ReactNode;
}



const ProfileLayout: React.FC<ProfileLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeSection, setActiveSection] = useState<'profile' | 'wallet'>('profile');


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
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex flex-col md:flex-row gap-6">

        <ProfileCard 
          userData={{
              ...user,
              // Ensure these properties exist with default values if not provided
              walletBalance: user.walletBalance || 0,
              loyaltyPoints: user.loyaltyPoints || 0
            }}
          onLogout={handleLogout}
          setActiveSection={setActiveSection}
        />
        {activeSection === 'profile' ? (
            // Show profile content
            children
          ) : (
            // Show wallet content
            <WalletComponent
              walletBalance={user.walletBalance || 0}
              transactions={user.transactions || []}
              setActiveSection={setActiveSection}
            />
          )}
        </div>
        
      </div>
      <Global_map />
      <Footer />
    </div>
  );
};

export default ProfileLayout; 