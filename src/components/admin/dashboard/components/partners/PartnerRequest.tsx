import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { sessionManager } from '../../../../../utils/sessionManager';
import { toast } from 'react-hot-toast';
import { driverService } from '../../../../../services/driver.service';
import { confirmDialog } from '../../../../../utils/confirmDialog';

interface PartnerRequest {
  partnerId: string;
  fullName: string;
  email: string;
  phone: string;
  profileImage?: string;
  bankDetailsCompleted: boolean;
  personalDocumentsCompleted: boolean;
  vehicleDetailsCompleted: boolean;
  createdAt: string;
  joiningDate: string;
}

interface PartnerRequestProps {
  onViewPartner: (partnerId: string) => void;
}

const PartnerRequest: React.FC<PartnerRequestProps> = ({ onViewPartner }) => {
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await driverService.getAllDrivers();
      console.log('Fetched partner requests:', response);
      
      
      // Filter partners that are not fully verified
      const pendingPartners = (response.partner || []).filter((partner: PartnerRequest) => 
        !partner.bankDetailsCompleted || 
        !partner.personalDocumentsCompleted || 
        !partner.vehicleDetailsCompleted
      );
      
      setRequests(pendingPartners);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching partner requests:', err);
      setError('Failed to fetch partner requests');
      setLoading(false);
    }
  };

  const handleDelete = async (partnerId: string) => {
    const confirmed = await confirmDialog(
      'Are you sure you want to delete this partner request? This action cannot be undone.',
      {
        title: 'Delete Partner Request',
        confirmText: 'Delete',
        type: 'delete'
      }
    );
    if (!confirmed) return;
    
    try {
      await driverService.deleteDriver(partnerId);
      setRequests(requests.filter(request => request.partnerId !== partnerId));
      toast.success('Partner request deleted successfully');
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast.error('Failed to delete partner request');
    }
  };

  const handleView = (partnerId: string) => {
    onViewPartner(partnerId);
  };

  const filteredRequests = requests.filter(request => 
    request.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.phone?.includes(searchTerm)
  );
  

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-4">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-3 md:mb-0">
          New Joining Request <span className="text-gray-500 font-normal">({requests.length})</span>
        </h2>
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search by Name or Phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            aria-label="Search partners"
          />
          <Search size={18} className="absolute top-2.5 left-3 text-gray-400" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
              <th className="py-3 px-4 text-left">Sl.No</th>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Contact Info</th>
              <th className="py-3 px-4 text-left">Request Date</th>
              <th className="py-3 px-4 text-left">Bank Details</th>
              <th className="py-3 px-4 text-left">Documents</th>
              <th className="py-3 px-4 text-left">Vehicle Details</th>
              <th className="py-3 px-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request, index) => (
              <tr key={request.partnerId} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{index + 1}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    {request.profileImage && (
                      <img 
                        src={request.profileImage} 
                        alt={request.fullName} 
                        className="w-8 h-8 rounded-full mr-2"
                      />
                    )}
                    {request.fullName}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <div>{request.email}</div>
                    <div className="text-sm text-gray-500">{request.phone}</div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {new Date(request.createdAt).toLocaleDateString('en-GB')}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    request.bankDetailsCompleted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {request.bankDetailsCompleted ? 'Completed' : 'Pending'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    request.personalDocumentsCompleted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {request.personalDocumentsCompleted ? 'Completed' : 'Pending'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    request.vehicleDetailsCompleted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {request.vehicleDetailsCompleted ? 'Completed' : 'Pending'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex space-x-3">
                    <button 
                      className="text-green-500 hover:text-green-700"
                      title="View details"
                      onClick={() => handleView(request.partnerId)}
                      aria-label={`View details for ${request.fullName}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button 
                      className="text-red-500 hover:text-red-700"
                      title="Delete partner"
                      onClick={() => handleDelete(request.partnerId)}
                      aria-label={`Delete ${request.fullName}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PartnerRequest;