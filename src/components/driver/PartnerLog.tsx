import { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setEmailId } from "../../Redux/slices/driverSlice"; // Import Redux action
import { useNavigate } from 'react-router-dom'
import { sessionManager } from '../../utils/sessionManager';
import { authService } from '../../services/auth.service';

const PartnerLog: React.FC = () => {
  // State management
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"email" | "otp" | "success">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate()

  const dispatch = useDispatch()

  // Add useEffect to prevent back navigation after successful login
  useEffect(() => {
    // Check if user is already logged in
    const { token } = sessionManager.getDriverSession();
    if (token) {
      navigate('/partner/dashboard', { replace: true });
    }

    // Prevent back navigation
    window.history.pushState(null, '', window.location.pathname);
    const handlePopState = (event: PopStateEvent) => {
      window.history.pushState(null, '', window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  // Handle email submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      setMessage("");

      try {
        // Call API to verify email and send OTP
        const response = await axios.post("http://localhost:3000/auth/request-login-otp", { email });

        if (response.data.success) {
          
          dispatch(setEmailId(email))
          setStep("otp");
          setMessage("OTP sent successfully to your email");
        } else {
          setErrors({ email: response.data.message || "Failed to send OTP" });
        }
      } catch (error: any) {
        console.log('Login error:', error.response);
        
        if (error.response && error.response.status === 404) {
          setErrors({ email: "Email not found. This email is not registered as a delivery partner." });
        } else {
          
          setErrors({ email: error.response?.data?.error || "Something went wrong. Please try again." });
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle OTP verification
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!otp) {
      newErrors.otp = "OTP is required";
    } else if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      newErrors.otp = "Please enter a valid 6-digit OTP";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      setMessage("");

      try {
        const response = await authService.verifyLoginOtp(email, otp);

        console.log('OTP verification response:', response);
        
        if (response.success) {          
          dispatch(setEmailId(response.email));

          // Include refresh token in driver session
          sessionManager.setDriverSession(response.token, {
            email,
            partnerId: response.partnerId,
            role: 'partner',
            refreshToken: response.refreshToken
          });

          setStep("success");
          setMessage("Login successful!");

          // Replace the current history entry instead of pushing a new one
          navigate("/partner/dashboard", { replace: true });
        } else {
          setErrors({ otp: response.message || "Invalid OTP" });
        }
      } catch (error: any) {
        console.error('Login error:', error.response?.data || error.message);
        setErrors({ otp: error.response?.data?.message || "Failed to verify OTP" });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Request new OTP
  const handleResendOtp = async () => {
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await axios.post("http://localhost:3000/auth/request-login-otp", { email });

      if (response.data.success) {
        setMessage("New OTP sent successfully");
      } else {
        setMessage("Failed to resend OTP");
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render email step
  const renderEmailStep = () => (
    <form onSubmit={handleEmailSubmit}>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Partner Login</h2>
        <p className="text-gray-600">Enter your registered email to receive an OTP</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gray-600 mb-1">Email Address</label>
        <input
          type="email"
          name="email"
          placeholder="e.g. partner@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full px-4 py-3 text-sm rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'
            } focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none transition-all`}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-xs text-red-500 mt-1">{errors.email}</p>
        )}
      </div>

      <button
        type="submit"
        className={`w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Sending OTP...' : 'Next'}
      </button>

      {/* Register Link */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Don't have a partner account?
          <a onClick={() => navigate('/register')} className="text-red-500 hover:underline ml-1 cursor-pointer">
            Register here
          </a>
        </p>
      </div>
    </form>
  );

  // Render OTP step
  const renderOtpStep = () => (
    <form onSubmit={handleOtpSubmit}>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Verify Your Email</h2>
        <p className="text-gray-600">Enter the 6-digit code sent to {email}</p>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
          {message}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm text-gray-600 mb-1">OTP Code</label>
        <input
          type="text"
          name="otp"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
          className={`w-full px-4 py-3 text-sm rounded-lg border ${errors.otp ? 'border-red-500' : 'border-gray-300'
            } focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none transition-all`}
          disabled={isSubmitting}
          maxLength={6}
        />
        {errors.otp && (
          <p className="text-xs text-red-500 mt-1">{errors.otp}</p>
        )}
      </div>

      <button
        type="submit"
        className={`w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Verifying...' : 'Verify & Login'}
      </button>

      <div className="mt-4 flex justify-between items-center">
        <button
          type="button"
          className="text-sm text-red-500 hover:text-red-700"
          onClick={() => setStep("email")}
          disabled={isSubmitting}
        >
          Back to Email
        </button>

        <button
          type="button"
          className="text-sm text-blue-500 hover:text-blue-700"
          onClick={handleResendOtp}
          disabled={isSubmitting}
        >
          Resend OTP
        </button>
      </div>
    </form>
  );

  // Render success step
  const renderSuccessStep = () => (
    <div className="text-center">
      <div className="mb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Login Successful!</h2>
      <p className="text-gray-600 mb-4">Redirecting to your dashboard...</p>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-red-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-red-300 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-xl overflow-hidden shadow-2xl bg-white lg:max-h-[90vh]">
        {/* Illustration Side */}
        <div className="relative bg-gradient-to-br from-red-200 to-red-400 p-6 flex items-center justify-center overflow-hidden">
          <div className="relative z-10">
            <div className="mb-6">
              <h1 className="text-3xl">
                Ship<span className="text-red-600 font-bold">Up</span>
              </h1>
            </div>

            <div className="w-full max-w-md">
              <img
                src="/Store.png"
                alt="Delivery person illustration"
                className="w-full h-auto"
              />
            </div>

            {/* Circular avatars */}
            <div className="absolute top-60 left-1/4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shadow-lg border-2 border-white">
                <img src="/profile1.png" alt="Profile 1" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="absolute top-20 right-1/4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center overflow-hidden shadow-lg border-2 border-white">
                <img src="/profile2.png" alt="Profile 2" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="absolute bottom-1/4 right-1/3">
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center overflow-hidden shadow-lg border-2 border-white">
                <img src="/profile3.png" alt="Profile 3" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Map pins */}
            <div className="absolute top-1/3 right-1/4">
              <MapPinIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="absolute bottom-1/4 left-1/3">
              <MapPinIcon className="h-8 w-8 text-red-600" />
            </div>
          </div>

          {/* Background circle effect */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute -left-1/4 -top-1/4 w-2/3 h-2/3 rounded-full border-2 border-red-300 opacity-50"></div>
            <div className="absolute -right-1/4 -bottom-1/4 w-3/4 h-3/4 rounded-full border-2 border-red-300 opacity-50"></div>
          </div>
        </div>

        {/* Form Side */}
        <div className="bg-white p-8 flex items-center justify-center overflow-y-auto max-h-[90vh] lg:max-h-[90vh]">
          <div className="w-full max-w-md">
            {step === "email" && renderEmailStep()}
            {step === "otp" && renderOtpStep()}
            {step === "success" && renderSuccessStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerLog;

const MapPinIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);