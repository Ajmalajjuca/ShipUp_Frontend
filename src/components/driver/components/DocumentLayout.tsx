import React from 'react';

interface DocumentLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
}

const DocumentLayout: React.FC<DocumentLayoutProps> = ({
  title,
  subtitle,
  children,
  onBack
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-red-300 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-xl overflow-hidden shadow-2xl bg-white">
        {/* Illustration Side */}
        <div className="relative bg-gradient-to-br from-red-200 to-red-400 p-6 flex items-center justify-center">
          <div className="relative z-10">
            <div className="mb-6">
              <h1 className="text-3xl">
                Ship<span className="text-red-400 font-bold">Up</span>
              </h1>
            </div>
            <div className="w-full max-w-md">
              <img src="/Store.png" alt="Delivery illustration" className="w-full h-auto" />
            </div>

            {/* Circular avatars */}
            <div className="absolute top-20 -right-1">
              <div className="h-12 w-12 rounded-full bg-white shadow-lg overflow-hidden border-2 border-white">
                <img src="/profile3.png" alt="" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="absolute bottom-16 -left-0">
              <div className="h-14 w-14 rounded-full bg-white shadow-lg overflow-hidden border-2 border-white">
                <img src="/profile1.png" alt="" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="absolute top-10 left-1/2">
              <div className="h-10 w-10 rounded-full bg-white shadow-lg overflow-hidden border-2 border-white">
                <img src="/profile2.png" alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Location pins */}
            <div className="absolute top-1/3 right-1/4">
              <MapPinIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="absolute bottom-1/4 left-1/3">
              <MapPinIcon className="h-8 w-8 text-red-600" />
            </div>
          </div>

          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute -left-1/4 -top-1/4 w-2/3 h-2/3 rounded-full border-2 border-red-300 opacity-50"></div>
            <div className="absolute -right-1/4 -bottom-1/4 w-3/4 h-3/4 rounded-full border-2 border-red-300 opacity-50"></div>
          </div>
        </div>

        {/* Content Side */}
        <div className="bg-white p-6 flex flex-col h-full">
          {/* Header with back button */}
          <div className="mb-2">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 mb-4"
              >
                <span className="mr-2">←</span>
                Back
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>

          {/* Main content area */}
          <div className="flex-1 overflow-y-auto">
            {children}

          </div>
        </div>
      </div>
    </div>
  );
};
const MapPinIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
export default DocumentLayout; 