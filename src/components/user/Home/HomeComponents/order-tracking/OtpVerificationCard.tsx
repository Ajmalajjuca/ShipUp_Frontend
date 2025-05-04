import React, { useState, useRef, useEffect } from 'react';
import { KeyRound, Check, Copy, RefreshCw } from 'lucide-react';

interface OtpVerificationCardProps {
  otpCode?: string;
  expiryTime?: string;
  onRegenerateOtp: () => void;
  isActive?: boolean;
}

interface TimeLeft {
  minutes: number;
  seconds: number;
}

const OtpVerificationCard = ({ 
  otpCode, 
  expiryTime, 
  onRegenerateOtp,
  isActive = true
}: OtpVerificationCardProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const [copied, setCopied] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);
  
  // Calculate time left based on expiry time
  function calculateTimeLeft(): TimeLeft {
    if (!expiryTime) return { minutes: 0, seconds: 0 };
    
    const now = new Date().getTime();
    const expiryTimeMs = new Date(expiryTime).getTime();
    const difference = expiryTimeMs - now;
    
    if (difference <= 0) {
      return { minutes: 0, seconds: 0 };
    }
    
    return {
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  }
  
  // Handle copy to clipboard
  const handleCopyOtp = () => {
    if (otpCode) {
      navigator.clipboard.writeText(otpCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Effect for countdown timer
  useEffect(() => {
    if (!isActive) return;
    
    timerRef.current = window.setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [expiryTime, isActive]);
  
  // Format timer display
  const formatTime = (time: number): string => {
    return time < 10 ? `0${time}` : time.toString();
  };
  
  // Check if OTP is expired
  const isExpired = timeLeft.minutes === 0 && timeLeft.seconds === 0;
  
  // If component is not active, don't show it
  if (!isActive) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
      <div className="flex items-center mb-3">
        <div className="bg-blue-100 p-2 rounded-full mr-3">
          <KeyRound size={20} className="text-blue-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-800">Verification Code</h3>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-mono font-bold tracking-wider text-gray-800 select-all">
            {otpCode || '------'}
          </div>
          
          <button 
            onClick={handleCopyOtp}
            disabled={!otpCode}
            className={`p-2 rounded-md ${copied ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors duration-150`}
            title={copied ? "Copied!" : "Copy code"}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-sm">
        {!isExpired ? (
          <div className="text-gray-600">
            Expires in <span className="font-medium">{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}</span>
          </div>
        ) : (
          <div className="text-red-600 font-medium">
            Code expired
          </div>
        )}
        
        <button 
          onClick={onRegenerateOtp}
          disabled={!isExpired && !!otpCode}
          className={`flex items-center ${
            isExpired || !otpCode 
              ? 'text-blue-600 hover:text-blue-700' 
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <RefreshCw size={14} className="mr-1" />
          <span className="text-sm">New code</span>
        </button>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        Share this code with your driver to confirm your identity at pickup
      </div>
    </div>
  );
};

export default OtpVerificationCard;