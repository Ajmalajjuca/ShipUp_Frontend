import React from 'react';
import { Route, Routes } from 'react-router-dom';
import RegistrationForm from '../components/user/Login/RegistrationForm';
import ShipUpHomepage from '../components/user/Landing/Homepage';
import ShipUpApp from '../components/user/Home/Home';
import Profile from '../components/user/Profile/Profile';
import PasswordReset from '../components/user/PasswordReset';
import OTPVerification from '../components/user/OTPVerification';
import PartnerReg from '../components/driver/PartnerReg';
import PartnerLog from '../components/driver/PartnerLog';
import Verification from '../components/driver/Verification';
import AdminLoginPage from '../components/admin/AdminLoginPage';
import AdminDashboard from '../components/admin/dashboard/AdminDashboard';
import EditProfile from '../components/user/Profile/ProfileComponents/EditProfile';
import AddressBook from '../components/user/Profile/ProfileComponents/AddressBook';
import AddAddressForm from '../components/user/Profile/ProfileComponents/AddAddressForm';
import PrivateRoute from './PrivateRoute';
import PrivatePartnerRoute from './PrivatePartnerRoute';
import AuthRoute from './AuthRoute';
import PartnerProfile from '../components/driver/components/PartnerProfile';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<ShipUpHomepage />} />
      <Route path="/login" element={<AuthRoute><RegistrationForm /></AuthRoute>} />
      <Route path="/reset-password" element={<AuthRoute><PasswordReset /></AuthRoute>} />
      <Route path="/otp-verification" element={<AuthRoute><OTPVerification /></AuthRoute>} />
      
      {/* Protected Routes */}
      <Route path="/home" element={<PrivateRoute><ShipUpApp /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/profile/edit" element={<PrivateRoute><EditProfile /></PrivateRoute>} />
      <Route path="/address" element={<PrivateRoute><AddressBook /></PrivateRoute>} />
      <Route path="/address/add" element={<PrivateRoute><AddAddressForm /></PrivateRoute>} />
      
      {/* Partner Routes */}
      <Route path="/register" element={<PartnerReg />} />
      <Route path="/partner" element={<PartnerLog />} />
      <Route path="/partner/profile" element={<PartnerProfile />} />

      <Route path="/partner/dashboard" element={
        <PrivatePartnerRoute><Verification /></PrivatePartnerRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard/*" element={
        <PrivateRoute><AdminDashboard /></PrivateRoute>
      } />
    </Routes>
  );
};

export default AppRoutes; 