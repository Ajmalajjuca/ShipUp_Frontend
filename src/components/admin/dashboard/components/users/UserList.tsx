import React, { useState, useEffect, use } from 'react';
import { Search, Edit2, Eye, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Pagination from '../../../../common/Pagination';
import { userService } from '../../../../../services/user.service';
import { confirmDialog } from '../../../../../utils/confirmDialog';

interface User {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  profileImage?: string;
  status: boolean;
  totalOrders?: number;
  totalAmount?: number;
  availablePoints?: number;
}

interface EditUserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

interface UserListProps {
  onViewUser: (userId: string) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    email: user.email,
    phone: user.phone
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await userService.updateUser(user.userId, formData);
      
      if (response.success) {
        onUpdate(response.user);
        toast.success('User updated successfully');
        onClose();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error((error as any).response.data.error||'Failed to update user');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit User</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label 
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label 
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Enter email"
              />
            </div>
            <div>
              <label 
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Enter phone number"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserList: React.FC<UserListProps> = ({ onViewUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();

  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      setUsers(response.users || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
      setLoading(false);
    }
  };
  

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await userService.updateUserStatus(userId, !currentStatus);

      if (response.success) {
        const newStatus = response?.user?.status;

        setUsers(users.map(user => 
          user.userId === userId ? { ...user, status: !currentStatus } : user
        ));
       
        
        toast.success(`User  ${newStatus ? 'Activated' : 'Deactivated'} successfully`);
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (userId: string) => {
    const confirmed = await confirmDialog(
      'Are you sure you want to delete this user? This action cannot be undone.',
      {
        title: 'Delete User',
        confirmText: 'Delete',
        type: 'delete'
      }
    );
    if (!confirmed) return;

    try {
      await userService.deleteUser(userId);
      setUsers(users.filter(user => user.userId !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
  };

  const handleView = (userId: string) => {
    onViewUser(userId);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUsers(users.map(user => 
      user.userId === updatedUser.userId ? updatedUser : user
    ));
  };

  const filteredUsers = users.filter(user => 
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-4">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-3 md:mb-0">
          User List <span className="text-gray-500 font-normal">({users.length})</span>
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Name, Email or Phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            aria-label="Search users"
          />
          <Search size={18} className="absolute top-2.5 left-3 text-gray-400" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
              <th className="py-3 px-4 text-left">Sl No</th>
              <th className="py-3 px-4 text-left">Customer Name</th>
              <th className="py-3 px-4 text-left">Contact Info</th>
              <th className="py-3 px-4 text-left">Total Orders</th>
              <th className="py-3 px-4 text-left">Total Amount</th>
              <th className="py-3 px-4 text-left">Points</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((user, index) => (
              <tr key={user.userId} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    {user.profileImage && (
                      <img 
                        src={user.profileImage} 
                        alt={user.fullName} 
                        className="w-8 h-8 rounded-full mr-2"
                      />
                    )}
                    {user.fullName}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <div className="text-sm">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  </div>
                </td>
                <td className="py-3 px-4">{user.totalOrders || 0}</td>
                <td className="py-3 px-4">₹{(user.totalAmount || 0).toFixed(2)}</td>
                <td className="py-3 px-4">{user.availablePoints || 0}</td>
                <td className="py-3 px-4">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={user.status} 
                      onChange={() => handleStatusToggle(user.userId, user.status)}
                      className="hidden" 
                      aria-label={`Toggle status for ${user.fullName}`}
                    />
                    <span 
                      className={`w-10 h-5 flex items-center rounded-full p-1 ${
                        user.status ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    >
                      <span 
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          user.status ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      ></span>
                    </span>
                  </label>
                </td>
                <td className="py-3 px-4">
                  <div className="flex space-x-3">
                    <button 
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                      onClick={() => handleEdit(user)}
                      aria-label={`Edit ${user.fullName}`}
                      title="Edit user"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      className="text-green-500 hover:text-green-700 transition-colors"
                      onClick={() => handleView(user.userId)}
                      aria-label={`View details for ${user.fullName}`}
                      title="View details"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      className="text-red-500 hover:text-red-700 transition-colors"
                      onClick={() => handleDelete(user.userId)}
                      aria-label={`Delete ${user.fullName}`}
                      title="Delete user"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
};

export default UserList;