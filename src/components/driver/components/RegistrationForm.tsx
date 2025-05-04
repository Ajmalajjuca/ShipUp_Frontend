import React, { useState } from 'react';
import { DriverRegistrationData } from '../types';
import { s3Utils } from '../../../utils/s3Utils';
import { useNavigate } from 'react-router-dom';

interface RegistrationFormProps {
  initialData: Partial<DriverRegistrationData>;
  onSubmit: (data: Partial<DriverRegistrationData>) => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<DriverRegistrationData>>(initialData);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profilePicture: 'File size should be less than 5MB' }));
        return;
      }
      
      // Check file type (only images)
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, profilePicture: 'Please upload an image file' }));
        return;
      }
      
      setProfileImage(file);
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.profilePicture;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.mobileNumber) newErrors.mobileNumber = 'Mobile number is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.address) newErrors.address = 'Address is required';
    
    // Check if user is at least 18 years old
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // If birthday hasn't occurred yet this year, subtract a year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 18) {
        newErrors.dateOfBirth = 'You must be at least 18 years old to register';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      setIsUploading(true);
      let profilePictureUrl: string | undefined;
      
      // Upload profile picture to S3 if it exists
      if (profileImage) {
        profilePictureUrl = await s3Utils.uploadImage(
          profileImage, 
          'shipup-driver-documents', 
          true,    // isDriver 
          true     // isTemporaryUpload
        );
      }
      
      // Submit form data with the profile picture URL
      const dataToSubmit = {
        ...initialData,
        ...formData,
        profilePicture: profileImage, // Keep the original file
        profilePicturePath: profilePictureUrl, // Store the S3 URL
        vehicleDocuments: initialData.vehicleDocuments
      };

      
      onSubmit(dataToSubmit);
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      setErrors(prev => ({ 
        ...prev, 
        form: 'Failed to upload profile picture. Please try again.' 
      }));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-3">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-800">Create an account</h2>
        <p className="text-xs text-gray-600">
          Enter the details below so we can get to know and serve you better
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Full Name</label>
          <input
            type="text"
            name="fullName"
            placeholder="Please enter first name"
            value={formData.fullName || ''}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm rounded-lg border ${
              errors.fullName ? 'border-red-500' : 'border-gray-200'
            } focus:border-red-300 focus:ring-1 focus:ring-red-200 outline-none transition-all`}
          />
          {errors.fullName && (
            <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Primary mobile number</label>
          <input
            type="tel"
            name="mobileNumber"
            placeholder="+91 9999988888"
            value={formData.mobileNumber || ''}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm rounded-lg border ${
              errors.mobileNumber ? 'border-red-500' : 'border-gray-200'
            } focus:border-red-300 focus:ring-1 focus:ring-red-200 outline-none transition-all`}
          />
          {errors.mobileNumber && (
            <p className="text-xs text-red-500 mt-1">{errors.mobileNumber}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Email</label>
          <input
            type="email"
            name="email"
            placeholder="e.g. example@gmail.com"
            value={formData.email || ''}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm rounded-lg border ${
              errors.email ? 'border-red-500' : 'border-gray-200'
            } focus:border-red-300 focus:ring-1 focus:ring-red-200 outline-none transition-all`}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Date of Birth</label>
          <div className="relative">
            <input
              type="date"
              name="dateOfBirth"
              placeholder="dd-mm-yyyy"
              value={formData.dateOfBirth || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.dateOfBirth ? 'border-red-500' : 'border-gray-200'
              } focus:border-red-300 focus:ring-1 focus:ring-red-200 outline-none transition-all`}
            />
            
          </div>
          {errors.dateOfBirth && (
            <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Enter complete address here</label>
          <input
            type="text"
            name="address"
            placeholder="Search address"
            value={formData.address || ''}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm rounded-lg border ${
              errors.address ? 'border-red-500' : 'border-gray-200'
            } focus:border-red-300 focus:ring-1 focus:ring-red-200 outline-none transition-all`}
          />
          {errors.address && (
            <p className="text-xs text-red-500 mt-1">{errors.address}</p>
          )}
        </div>

        <div className={`border border-gray-200 rounded-lg p-2 flex items-center justify-between ${errors.profilePicture ? 'border-red-500' : ''}`}>
          <div className="flex items-center space-x-2">
            {profileImage ? (
              <img
                src={URL.createObjectURL(profileImage)}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <span className="text-xs text-gray-500">Your Profile Picture</span>
          </div>
          <input
            type="file"
            id="profilePicture"
            name="profilePicture"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="profilePicture"
            className="text-xs text-red-500 cursor-pointer"
          >
            Upload Photo
          </label>
        </div>
        {errors.profilePicture && (
          <p className="text-xs text-red-500 mt-1">{errors.profilePicture}</p>
        )}

        {errors.form && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-500">{errors.form}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading}
          className={`w-full ${isUploading ? 'bg-gray-500' : 'bg-indigo-900 hover:bg-indigo-800'} text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center mt-3 text-sm`}
        >
          {isUploading ? 'Uploading...' : 'NEXT'}
          {!isUploading && <span className="ml-2">→</span>}
        </button>
        <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
        Already have a partner account?
          <a onClick={() => navigate('/partner')} className="text-red-500 hover:underline ml-1 cursor-pointer">
          Log in here
          </a>
        </p>
      </div>
      </form>
    </div>
  );
};