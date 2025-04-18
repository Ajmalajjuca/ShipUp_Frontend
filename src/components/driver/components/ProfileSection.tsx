// import React, { useState } from 'react';
// import { User, Star, Package, Calendar, Camera, Phone, Mail, MapPin } from 'lucide-react';
// import { DriverProfile } from '../../../services/driver.service';
// import { toast } from 'react-hot-toast';

// interface ProfileSectionProps {
//   profile: DriverProfile | null;
//   onUpdateProfile: (data: Partial<DriverProfile>) => Promise<void>;
// }

// const ProfileSection: React.FC<ProfileSectionProps> = ({ profile, onUpdateProfile }) => {
//   const [isEditing, setIsEditing] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [formData, setFormData] = useState({
//     fullName: profile?.fullName || '',
//     phone: profile?.phone || '',
//     address: profile?.address || ''
//   });

//   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     try {
//       setLoading(true);
//       await onUpdateProfile({ profileImage: file });
//       toast.success('Profile picture updated successfully');
//     } catch (error) {
//       toast.error('Failed to update profile picture');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       setLoading(true);
//       await onUpdateProfile(formData);
//       setIsEditing(false);
//       toast.success('Profile updated successfully');
//     } catch (error) {
//       toast.error('Failed to update profile');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!profile) return null;

//   return (
//     <div className="bg-white rounded-xl shadow-sm p-6">
//       {/* Profile Header */}
//       <div className="flex items-center justify-between mb-6">
//         <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
//         {!isEditing && (
//           <button
//             onClick={() => setIsEditing(true)}
//             className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//           >
//             Edit Profile
//           </button>
//         )}
//       </div>

//       {/* Profile Image Section */}
//       <div className="flex flex-col items-center mb-6">
//         <div className="relative">
//           <div className="w-24 h-24 rounded-full overflow-hidden mb-2">
//             <img
//               src={profile.profileImage || '/default-avatar.png'}
//               alt={profile.fullName}
//               className="w-full h-full object-cover"
//             />
//           </div>
//           <label className="absolute bottom-0 right-0 p-1 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
//             <Camera size={16} className="text-white" />
//             <input
//               type="file"
//               className="hidden"
//               accept="image/*"
//               onChange={handleImageUpload}
//               disabled={loading}
//             />
//           </label>
//         </div>
//         <h3 className="text-xl font-semibold mt-2">{profile.fullName}</h3>
//         <div className="flex items-center mt-1">
//           <Star className="text-yellow-400 w-4 h-4 mr-1" />
//           <span className="text-gray-600">{profile.rating.toFixed(1)}</span>
//         </div>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-2 gap-4 mb-6">
//         <div className="bg-gray-50 p-4 rounded-lg">
//           <div className="flex items-center text-gray-600 mb-1">
//             <Package size={16} className="mr-2" />
//             <span className="text-sm">Total Deliveries</span>
//           </div>
//           <p className="text-xl font-semibold">{profile.totalDeliveries}</p>
//         </div>
//         <div className="bg-gray-50 p-4 rounded-lg">
//           <div className="flex items-center text-gray-600 mb-1">
//             <Calendar size={16} className="mr-2" />
//             <span className="text-sm">Member Since</span>
//           </div>
//           <p className="text-xl font-semibold">
//             {new Date(profile.memberSince).toLocaleDateString('en-US', {
//               month: 'short',
//               year: 'numeric'
//             })}
//           </p>
//         </div>
//       </div>

//       {/* Profile Form */}
//       {isEditing ? (
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Full Name
//             </label>
//             <input
//               type="text"
//               value={formData.fullName}
//               onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               disabled={loading}
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Phone Number
//             </label>
//             <input
//               type="tel"
//               value={formData.phone}
//               onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               disabled={loading}
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Address
//             </label>
//             <textarea
//               value={formData.address}
//               onChange={(e) => setFormData({ ...formData, address: e.target.value })}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               rows={3}
//               disabled={loading}
//             />
//           </div>
//           <div className="flex justify-end space-x-3">
//             <button
//               type="button"
//               onClick={() => setIsEditing(false)}
//               className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//               disabled={loading}
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
//               disabled={loading}
//             >
//               {loading ? 'Saving...' : 'Save Changes'}
//             </button>
//           </div>
//         </form>
//       ) : (
//         <div className="space-y-4">
//           <div className="flex items-center">
//             <Phone size={18} className="text-gray-400 mr-3" />
//             <span>{profile.phone}</span>
//           </div>
//           <div className="flex items-center">
//             <Mail size={18} className="text-gray-400 mr-3" />
//             <span>{profile.email}</span>
//           </div>
//           {profile.address && (
//             <div className="flex items-center">
//               <MapPin size={18} className="text-gray-400 mr-3" />
//               <span>{profile.address}</span>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default ProfileSection; 