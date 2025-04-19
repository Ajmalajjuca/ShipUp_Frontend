import React, { useState, useEffect } from 'react';
import { Search, Edit2, Eye, Trash2 } from 'lucide-react';
import { driverService } from '../../../../../services/driver.service';
import { sessionManager } from '../../../../../utils/sessionManager';
import { toast } from 'react-hot-toast';
import Pagination from '../../../../common/Pagination';
import EditPartnerModal from './EditPartnerModal';
import { confirmDialog } from '../../../../../utils/confirmDialog';

interface Partner {
  partnerId: string;
  fullName: string;
  email: string;
  phone: string;
  profileImage?: string;
  status: boolean;
  totalOrders: number;
  completedOrders: number;
  canceledOrders: number;
  totalAmount?: number;
  availablePoints?: number;
  bankDetailsCompleted: boolean;
  personalDocumentsCompleted: boolean;
  vehicleDetailsCompleted: boolean;
}

interface PartnerListProps {
  onViewPartner: (partnerId: string) => void;
}

const PartnerList: React.FC<PartnerListProps> = ({ onViewPartner }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchPartners();
    
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await driverService.getAllDrivers();

      // Filter only fully verified partners
      const verifiedPartners = (response.partner || []).filter((partner: Partner) =>
        partner.bankDetailsCompleted === true &&
        partner.personalDocumentsCompleted === true &&
        partner.vehicleDetailsCompleted === true
      );

      setPartners(verifiedPartners);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching partners:', err);
      setError('Failed to fetch partners');
      setLoading(false);
    }
  };
  
  

  const handleStatusToggle = async (partnerId: string, currentStatus: boolean) => {
    try {
      // Log the current status and the intended new status
      
      // Call the API to update the status
      const response = await driverService.updateDriverStatus(partnerId, !currentStatus);
      
      if (response.success) {
        // Use the status field directly from the API response
        const newStatus = response.partner.status;
          setPartners(partners.map(partner =>
            partner.partnerId === partnerId 
              ? { ...partner, status: !currentStatus } 
              : partner
          ));

        toast.success(`Partner ${newStatus ? 'Activated' : 'Deactivated'} successfully`);
      } else {
        // Show error toast if the API call was successful but status update failed
        toast.error(response.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating partner status:', err);
      toast.error('Failed to update status. Please try again.');
    }
  };

  const handleDelete = async (partnerId: string) => {
    const confirmed = await confirmDialog(
      'Are you sure you want to delete this partner? This action cannot be undone.',
      {
        title: 'Delete Partner',
        confirmText: 'Delete',
        type: 'delete'
      }
    );
    if (!confirmed) return;

    try {
      await driverService.deleteDriver(partnerId);
      setPartners(partners.filter(partner => partner.partnerId !== partnerId));
      toast.success('Partner deleted successfully');
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast.error('Failed to delete partner');
    }
  };

  const handleEdit = async (updatedPartner: Partial<Partner>) => {
    if (!selectedPartner) return;

    try {
      const response = await driverService.updateDriver(selectedPartner.partnerId, updatedPartner);
      console.log('Update response:', response);
      
      
      setPartners(partners.map(partner =>
        partner.partnerId === selectedPartner.partnerId
          ? { ...partner, ...response.partner }
          : partner
      ));

      setIsEditModalOpen(false);
      toast.success('Partner updated successfully');
    } catch (error) {
      console.error('Error updating partner:', error);
      toast.error('Failed to update partner');
    }
  };

  const handleView = (partnerId: string) => {
    onViewPartner(partnerId);
  };

  const filteredPartners = partners.filter(partner =>
    partner.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.phone?.includes(searchTerm) ||
    partner.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPartners.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-4">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-3 md:mb-0">
          Verified Partners <span className="text-gray-500 font-normal">({partners.length})</span>
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Name, Email or Phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
          <Search size={18} className="absolute top-2.5 left-3 text-gray-400" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
              <th className="py-3 px-4 text-left">Sl No</th>
              <th className="py-3 px-4 text-left">Partner Name</th>
              <th className="py-3 px-4 text-left">Contact Info</th>
              <th className="py-3 px-4 text-left">Total Orders</th>
              <th className="py-3 px-4 text-left">Completed</th>
              <th className="py-3 px-4 text-left">Canceled</th>
              <th className="py-3 px-4 text-left">Total Amount</th>
              <th className="py-3 px-4 text-left">Points</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((partner, index) => (
              <tr key={partner.partnerId} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    {partner.profileImage ? (
                      <img
                        src={partner.profileImage}
                        alt={partner.fullName}
                        className="w-8 h-8 rounded-full mr-2"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                        <span className="text-gray-600 text-sm">
                          {partner.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {partner.fullName}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <div className="text-sm">{partner.email}</div>
                    <div className="text-sm text-gray-500">{partner.phone}</div>
                  </div>
                </td>
                <td className="py-3 px-4">{partner.totalOrders || 0}</td>
                <td className="py-3 px-4">
                  <span className="text-green-600">{partner.completedOrders || 0}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-red-600">{partner.canceledOrders || 0}</span>
                </td>
                <td className="py-3 px-4">₹{(partner.totalAmount || 0).toFixed(2)}</td>
                <td className="py-3 px-4">{partner.availablePoints || 0}</td>
                <td className="py-3 px-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={partner.status}
                      onChange={() => handleStatusToggle(partner.partnerId, partner.status)}
                      className="hidden"
                      title="Toggle partner status"
                    />
                    <span
                      className={`w-10 h-5 flex items-center rounded-full p-1 ${partner.status ? 'bg-green-500' : 'bg-red-500'
                        }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${partner.status ? 'translate-x-5' : 'translate-x-0'
                          }`}
                      ></span>
                    </span>
                  </label>
                </td>
                <td className="py-3 px-4">
                  <div className="flex space-x-3">
                    <button
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                      title="Edit user"
                      onClick={() => {
                        setSelectedPartner(partner);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="text-green-500 hover:text-green-700 transition-colors"
                      title="View details"
                      onClick={() => handleView(partner.partnerId)}
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Delete partner"
                      onClick={() => handleDelete(partner.partnerId)}
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

      {/* Add pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Add the EditPartnerModal */}
      {selectedPartner && (
        <EditPartnerModal
          partner={selectedPartner}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPartner(null);
          }}
          onSave={handleEdit}
        />
      )}
    </div>
  );
};

export default PartnerList;