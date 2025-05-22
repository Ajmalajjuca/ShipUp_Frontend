import React, { useState, useRef, ChangeEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Upload, X, ArrowLeft } from 'lucide-react';
import { RootState } from '../../../../Redux/store';
import { loginSuccess } from '../../../../Redux/slices/authSlice';
import { sessionManager } from '../../../../utils/sessionManager';
import { toast } from 'react-hot-toast';
import ProfileCard from '../../../common/ProfileCard';
import ProfileLayout from '../ProfileLayout';
import { userService } from '../../../../services/user.service';
import { s3Utils } from '../../../../utils/s3Utils';

interface EditProfileFormData {
  fullName: string;
  phone: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  profileImage?: string;
}

const EditProfile: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  

  const [formData, setFormData] = useState<EditProfileFormData>({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    profileImage: user?.profileImage || undefined
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        
        // Show preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        
        // Rename the file to include 'profile' in the name for proper detection
        const profileFile = new File(
          [file], 
          `profile-${file.name}`, 
          { type: file.type }
        );
        setNewImageFile(profileFile);
        
        // Upload to S3 with explicit profile type
        const imageUrl = await s3Utils.uploadImage(
          profileFile, 
          'shipup-user-profiles',
          false,  // Not a driver upload
          false   // Not a temporary upload
        );        
        // Update the form data with the S3 URL
        setFormData(prev => ({
          ...prev,
          profileImage: imageUrl
        }));
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image. Please try again.');
        // Reset the preview if upload fails
        setImagePreview('');
        setNewImageFile(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const removeImage = () => {
    setImagePreview('');
    setNewImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate passwords if being changed
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error('New passwords do not match');
          setLoading(false);
          return;
        }
        if (!formData.currentPassword) {
          toast.error('Current password is required to set new password');
          setLoading(false);
          return;
        }
        if (formData.newPassword.length < 6) {
          toast.error('New password must be at least 6 characters long');
          setLoading(false);
          return;
        }
      }

      const updateData: any = {
        userId: user?.userId,
        fullName: formData.fullName,
        phone: formData.phone
      };

      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      // Add profile image if it was uploaded
      if (formData.profileImage) {
        updateData.profileImage = formData.profileImage;
      }

      // First, try to verify and refresh the token
      try {
        await sessionManager.verifyToken();
      } catch (refreshError) {
      }

      const response = await userService.updateProfile(updateData);
      console.log('rsponce', response);

      if (response.success) {
        const updatedUser = { ...user, ...response.user };
        sessionManager.setSession(updatedUser, sessionManager.getSession().token!, sessionManager.getSession().refreshToken!);
        dispatch(loginSuccess(updatedUser));
        toast.success('Profile updated successfully');
        navigate('/profile');
      } else {
        if (response.shouldClearSession === true) {
          sessionManager.clearSession();
          navigate('/login');
        } else {
          toast.error(response.message || 'Failed to update profileeeee');
        }
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      if (error.response?.status === 400 && 
          error.response?.data?.message?.toLowerCase().includes('password')) {
        toast.error(error.response.data.message || 'Current password is incorrect');
      } else if (error.response?.status === 401 && error.config?.url?.includes('update-profile')) {
        toast.error('Your session may have expired. Please try again or refresh the page.');
      } else if (error.response?.status === 401) {
        sessionManager.clearSession();
        navigate('/login');
      } else if (error.response?.data?.shouldClearSession === true) {
        sessionManager.clearSession();
        navigate('/login');
      } else {
        toast.error(error.response?.data?.error || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileLayout>
      <div className="w-full md:w-2/3">
        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Section - Add this at the top */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {imagePreview || user?.profileImage ? (
                  <div className="relative w-32 h-32">
                    <img
                      src={imagePreview || user?.profileImage}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      title="Remove profile picture"
                      aria-label="Remove profile picture"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                    <Upload size={32} className="text-gray-400" />
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
                title="Choose profile picture"
                aria-label="Choose profile picture"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm text-indigo-900 border border-indigo-900 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Change Profile Picture
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  title="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your phone number"
                  title="Phone number"
                  aria-label="Phone number"
                />
              </div>

              {/* Password Fields */}
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter your current password"
                    title="Current password"
                    aria-label="Current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-8 text-gray-500"
                  >
                    {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter new password"
                    title="New password"
                    aria-label="New password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-8 text-gray-500"
                  >
                    {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Confirm your new password"
                    title="Confirm new password"
                    aria-label="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-8 text-gray-500"
                  >
                    {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-800 text-white rounded-lg hover:bg-indigo-900 disabled:bg-gray-400 transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProfileLayout>
  );
};

export default EditProfile; 