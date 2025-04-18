import { RegistrationForm } from "./RegistrationForm";

const RegistrationLayout: React.FC<{
  onSubmit: (formData: any) => void;
}> = ({ onSubmit }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-red-300 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-xl overflow-hidden shadow-2xl bg-white lg:max-h-[90vh]">
        {/* Illustration Side */}
        <div className="relative bg-gradient-to-br from-red-200 to-red-400 p-6 flex items-center justify-center overflow-hidden">
          <div className="relative z-10">
            <div className="mb-6">
              <h1 className="text-3xl">
                Ship<span className="text-red-400 font-bold">Up</span>
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
        <div className="bg-white p-4 md:p-6 flex items-center justify-center overflow-y-auto max-h-[90vh] lg:max-h-[90vh]">
          <div className="w-full max-w-md">
            <RegistrationForm initialData={{}} onSubmit={onSubmit} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationLayout

const MapPinIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);