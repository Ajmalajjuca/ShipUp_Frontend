import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../../Redux/slices/authSlice';
import FormContainer from '../../common/FormContainer';
import { RootState } from '../../../Redux/store';
import { toast } from 'react-hot-toast';
import { sessionManager } from '../../../utils/sessionManager';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { authService } from '../../../services/auth.service';

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const RegistrationForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [initialStage, setInitialStage] = useState<'Sign in' | 'Sign up'>('Sign in');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { error } = useSelector((state: RootState) => state.auth);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    validateField(name, formData[name as keyof FormData]);
  };

  const validateField = (name: string, value: string) => {
    let newErrors = { ...errors };

    switch (name) {
      case 'fullName':
        if (!value.trim() && initialStage === 'Sign up') {
          newErrors.fullName = 'Full name is required';
        } else if (value.trim().length < 3 && value.trim()) {
          newErrors.fullName = 'Full name must be at least 3 characters';
        } else {
          delete newErrors.fullName;
        }
        break;

      case 'phone':
        if (!value.trim() && initialStage === 'Sign up') {
          newErrors.phone = 'Phone number is required';
        } else if (value.trim() && !/^(\+\d{1,3}[- ]?)?\d{10}$/.test(value.trim())) {
          newErrors.phone = 'Enter a valid phone number with country code';
        } else {
          delete newErrors.phone;
        }
        break;

      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          newErrors.email = 'Enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;

      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else if (value.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          newErrors.password = 'Password must contain uppercase, lowercase, and number';
        } else {
          delete newErrors.password;
        }
        
        // Check confirm password match if password changes
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else if (formData.confirmPassword) {
          delete newErrors.confirmPassword;
        }
        break;

      case 'confirmPassword':
        if (!value && initialStage === 'Sign up') {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    let formIsValid = true;
    let newErrors: FormErrors = {};
    let allTouched: Record<string, boolean> = {};

    // Mark all fields as touched
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Validate all fields
    if (initialStage === 'Sign up') {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Full name is required';
        formIsValid = false;
      } else if (formData.fullName.trim().length < 3) {
        newErrors.fullName = 'Full name must be at least 3 characters';
        formIsValid = false;
      }

      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
        formIsValid = false;
      } else if (!/^(\+\d{1,3}[- ]?)?\d{10}$/.test(formData.phone.trim())) {
        newErrors.phone = 'Enter a valid phone number with country code';
        formIsValid = false;
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
        formIsValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
        formIsValid = false;
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      formIsValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address';
      formIsValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      formIsValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      formIsValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
      formIsValid = false;
    }

    setErrors(newErrors);
    return formIsValid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const { confirmPassword, ...requestData } = formData;
    const dataToSend = { ...requestData, role: 'user' };
    
    try {
      dispatch(loginStart());
      const response = await (initialStage === 'Sign up' 
        ? authService.register(dataToSend)
        : authService.login(dataToSend));
console.log('response', response);

      if (initialStage === 'Sign up') {
        const { user, token } = response;
        sessionManager.setTempSession(user, token);
        navigate('/otp-verification', { state: { email: formData.email } });
      } else {
        const { user, token, refreshToken } = response;
        sessionManager.setSession(user, token, refreshToken);
        navigate('/');
      }
    } catch (error: any) {
      dispatch(loginFailure(error.response?.data?.error || 'Authentication failed'));
      toast.error(error.response?.data?.error || 'Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      dispatch(loginStart());
      const response = await authService.googleAuth(credentialResponse.credential);
      console.log('Google auth response:', response);
      
      
      const { user, token, refreshToken } = response;
      
      if (user && token) {
        sessionManager.setSession(user, token, refreshToken);
        dispatch(loginSuccess({ user, token, refreshToken }));
        toast.success('Successfully logged in with Google!');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      dispatch(loginFailure(error.response?.data?.error || 'Google authentication failed'));
      toast.error(error.response?.data?.error || 'Failed to login with Google');
    }
  };

  const handleGoogleError = () => {
    toast.error('Google sign in was unsuccessful');
    dispatch(loginFailure('Google sign in failed'));
  };

  const switchFormMode = (mode: 'Sign in' | 'Sign up') => {
    setInitialStage(mode);
    setErrors({});
    setTouched({});
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  const footer = (
    <div className="text-sm">
      {initialStage === 'Sign in' ? (
        <>Don't have an account? <button onClick={() => switchFormMode('Sign up')} className="text-blue-600 hover:underline font-medium">Sign up!</button></>
      ) : (
        <>Already have an account? <button onClick={() => switchFormMode('Sign in')} className="text-blue-600 hover:underline font-medium">Sign in!</button></>
      )}
    </div>
  );

  const getInputClassName = (fieldName: keyof FormData) => {
    return `w-full px-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 ${
      touched[fieldName] && errors[fieldName] 
        ? 'border-2 border-red-500 focus:ring-red-500' 
        : 'focus:ring-indigo-500'
    }`;
  };

  return (
    <FormContainer
      title={initialStage === 'Sign up' ? 'Create an Account' : 'Sign In'}
      onSubmit={handleSubmit}
      footer={footer}
    >
      {initialStage === 'Sign up' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              type="text"
              name="fullName"
              className={getInputClassName('fullName')}
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleInputChange}
              onBlur={handleBlur}
            />
            {touched.fullName && errors.fullName && (
              <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              className={getInputClassName('phone')}
              placeholder="+91 1234567890"
              value={formData.phone}
              onChange={handleInputChange}
              onBlur={handleBlur}
            />
            {touched.phone && errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>
        </>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          name="email"
          className={getInputClassName('email')}
          placeholder="example.email@gmail.com"
          value={formData.email}
          onChange={handleInputChange}
          onBlur={handleBlur}
        />
        {touched.email && errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            className={getInputClassName('password')}
            placeholder="Enter at least 8+ characters"
            value={formData.password}
            onChange={handleInputChange}
            onBlur={handleBlur}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {touched.password && errors.password && (
          <p className="text-red-500 text-xs mt-1">{errors.password}</p>
        )}
      </div>

      {initialStage === 'Sign up' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              className={getInputClassName('confirmPassword')}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              onBlur={handleBlur}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {touched.confirmPassword && errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
          )}
        </div>
      )}

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="mt-1 mb-4">
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="outline"
            size="large"
            width="100%"
            text={initialStage === 'Sign up' ? 'signup_with' : 'signin_with'}
            shape="rectangular"
          />
        </GoogleOAuthProvider>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full bg-indigo-900 text-white py-2 px-4 rounded-lg hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors font-medium text-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Loading...' : initialStage}
      </button>

      <div className="flex justify-end items-center w-full">
      {initialStage === 'Sign in' && (
        <button
          type="button"
          onClick={() => navigate('/reset-password')}
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          Forgot Password?
        </button>
      )}
      </div>
    </FormContainer>
  );
};

export default RegistrationForm;