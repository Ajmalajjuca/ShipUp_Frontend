import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface FormContainerProps {
  title: string;
  children: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  footer?: ReactNode;
  showGoogleAuth?: boolean; // New prop to toggle Google auth
  onGoogleAuthClick?: () => void; // Callback for Google auth
}

const FormContainer: React.FC<FormContainerProps> = ({
  title,
  children,
  onSubmit,
  footer,
}) => {
  const navigate = useNavigate()
  return (
    <div className="flex h-screen bg-red-400 relative overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute top-0 left-0 h-64 w-64 bg-red-300 rounded-full -ml-16 -mt-16"></div>
      <div className="absolute bottom-0 right-0 h-96 w-96 bg-red-300 rounded-full -mr-16 -mb-16"></div>

      {/* Left Side with Image Placeholders */}
      <div className="hidden md:block md:w-1/2 relative">
        <div className="absolute top-8 left-8 z-10">
          <div className="flex items-center">
            <img onClick={() => navigate('/')} src="/Logo.png" alt="Logo" className="h-8 w-auto mr-2 cursor-pointer" />
          </div>
        </div>
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-96 h-96">
          <img src="/woman.png" alt="Woman illustration" className="w-full h-full object-contain" />
        </div>
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
      </div>

      {/* Right Side Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 relative z-10">
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md backdrop-blur-sm bg-opacity-95 max-h-screen">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-4">{title}</h2>
          
          {onSubmit ? (
            <form className="space-y-4" onSubmit={onSubmit}>
              {children}
            </form>
          ) : (
            <div className="space-y-4">{children}</div>
          )}
          {footer && <div className="text-center mt-4 text-sm text-gray-600">{footer}</div>}
        </div>
      </div>
    </div>
  );
};

export default FormContainer;