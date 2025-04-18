// src/components/PasswordReset.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import FormContainer from '../common/FormContainer';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth.service';

const PasswordReset: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.forgotPassword(formData.email);
      
      if (response.success) {
        toast.success('OTP sent successfully!');
        navigate('/otp-verification', { 
          state: { 
            email: formData.email,
            newPassword: formData.newPassword,
            isPasswordReset: true 
          } 
        });
      }
    } catch (error: any) {
      console.error('Reset Error:', error);
      toast.error(error.response?.data?.message || 'Something went wrong!');
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <p className="text-sm text-gray-600">
      Back to{' '}
      <a onClick={()=>navigate('/login')} className="text-blue-600 hover:underline font-medium">
        Sign In
      </a>
    </p>
  );

  return (
    <FormContainer title="Reset Password" onSubmit={handleSubmit} footer={footer}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          name="email"
          className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="example.email@gmail.com"
          value={formData.email}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="newPassword"
            className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter at least 8+ characters"
            value={formData.newPassword}
            onChange={handleInputChange}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 cursor-pointer"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
        <input
          type={showPassword ? 'text' : 'password'}
          name="confirmPassword"
          className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleInputChange}
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full bg-indigo-900 text-white py-2 px-4 rounded-lg hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors font-medium text-lg ${
          isLoading ? 'opacity-75 cursor-not-allowed' : ''
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending OTP...
          </div>
        ) : (
          'Reset Password'
        )}
      </button>
    </FormContainer>
  );
};

export default PasswordReset;