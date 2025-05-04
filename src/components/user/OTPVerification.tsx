import React, { useState, useRef, KeyboardEvent, ChangeEvent, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import FormContainer from '../common/FormContainer';
import { loginSuccess } from '../../Redux/slices/authSlice';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth.service';

const OTPVerification: React.FC = () => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null));
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const email = location.state?.email || '';
  const newPassword = location.state?.newPassword;
  const isPasswordReset = location.state?.isPasswordReset;

  // Start countdown on component mount
  useEffect(() => {
    setCountdown(60);
  }, []);
  
  // Countdown timer effect
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pasteData.length === 6) {
      setOtp(pasteData.split(''));
      verifyOtp(pasteData);
    }
  };

  const verifyOtp = async (otpValue: string) => {
    setLoading(true);
    setError(null);
    try {
      // If this is password reset flow
      if (isPasswordReset && newPassword) {
        const response = await authService.verifyOtp({
          email,
          otp: otpValue,
          newPassword
        });
        
        
        if (response.success) {
          toast.success('Password reset successful!');
          navigate('/login');
        }
        return;
      }
      
      // Registration verification flow
      const response = await authService.verifyOtp({
        email,
        otp: otpValue
      });
      console.log('response=>>>', response);
      
      const tempToken = sessionStorage.getItem('tempToken');
      const pendingUser = JSON.parse(sessionStorage.getItem('pendingUser') || '{}');

      if (!tempToken || !pendingUser) {
        toast.error('Session expired. Please register again.');
        navigate('/login');
        return;
      }

      // After successful OTP verification, move temp data to permanent storage
      const permanentToken = response.token || tempToken;
      const refreshToken = response.refreshToken || '';
      
      dispatch(loginSuccess({ user: pendingUser, token: permanentToken, refreshToken }));
      
      localStorage.setItem('authToken', permanentToken);
      localStorage.setItem('userData', JSON.stringify(pendingUser));
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      // Clear temporary storage
      sessionStorage.removeItem('tempToken');
      sessionStorage.removeItem('pendingUser');
      
      toast.success('Account verified successfully!');
      navigate('/home');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Invalid OTP');
      toast.error(error.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setResending(true);
    setError(null);
    try {
      const response = await authService.resendOtp(email);
      
      if (response.success) {
        setCountdown(60);
        toast.success('OTP resent successfully!');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to resend OTP');
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <FormContainer title="OTP Verification">
      <p className="text-gray-700 mb-6 text-center">Enter the OTP sent to {email}</p>
      
      <div className="flex justify-center mb-8" onPaste={handlePaste}>
        <div className="flex gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              maxLength={1}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              value={digit}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-12 h-12 rounded-lg bg-gray-50 text-center text-xl font-bold border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              disabled={loading || resending}
              aria-label={`OTP digit ${index + 1}`}
              title={`Enter digit ${index + 1}`}
            />
          ))}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-6 rounded">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      <button
        className={`w-full py-3 bg-indigo-900 text-white rounded-full font-medium transition ${
          (loading || resending) ? 'opacity-75 cursor-not-allowed' : 'hover:bg-indigo-800'
        }`}
        onClick={() => otp.every(d => d) && verifyOtp(otp.join(''))}
        disabled={loading || resending || !otp.every(d => d)}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verifying...
          </div>
        ) : (
          'Verify'
        )}
      </button>
      
      {countdown > 0 ? (
        <button className="w-full py-3 text-gray-500 font-medium mt-4 cursor-not-allowed">
          Resend OTP in {countdown}s
        </button>
      ) : (
        <button
          className={`w-full py-3 text-indigo-900 font-medium mt-4 transition ${
            resending ? 'opacity-75 cursor-not-allowed' : 'hover:text-indigo-700'
          }`}
          onClick={resendOtp}
          disabled={resending || loading}
        >
          {resending ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Resending...
            </div>
          ) : (
            'Resend OTP'
          )}
        </button>
      )}
    </FormContainer>
  );
};

export default OTPVerification;