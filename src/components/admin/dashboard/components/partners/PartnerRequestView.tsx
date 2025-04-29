import React, { useState, useEffect } from 'react';
import { driverService } from '../../../../../services/driver.service';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  Truck,
  Building2,
  Wallet,
  FileText,
  Shield,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { vehicleService } from '../../../../../services/vehicle.service';

interface PartnerDetails {
  partnerId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  dateOfBirth: string;
  address: string;
  vehicleType: string;
  registrationNumber: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  profilePicturePath?: string;
  aadharPath?: string;
  panPath?: string;
  licensePath?: string;
  insuranceDocPath?: string;
  pollutionDocPath?: string;
  bankDetailsCompleted: boolean;
  personalDocumentsCompleted: boolean;
  vehicleDetailsCompleted: boolean;
  createdAt: string;
  vehicleDetails: {
    name: string;
  };
  vehicleId: string;
  vehicleDocuments: {
    aadhar: {
      backUrl: string;
      frontUrl: string;
    },
    insurance: {
      backUrl: string;
      frontUrl: string;
    },
    license: {
      backUrl: string;
      frontUrl: string;
    },
    pan: {
      backUrl: string;
      frontUrl: string;
    },
    pollution: {
      backUrl: string;
      frontUrl: string;
    },
  }
}

interface VerificationField {
  key: keyof Pick<PartnerDetails, 'bankDetailsCompleted' | 'personalDocumentsCompleted' | 'vehicleDetailsCompleted'>;
  label: string;
}

interface PartnerRequestViewProps {
  partnerId: string;
  onBack: () => void;
}

const PartnerRequestView: React.FC<PartnerRequestViewProps> = ({ partnerId, onBack }) => {
  const [partner, setPartner] = useState<PartnerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    fetchPartnerDetails();
  }, [partnerId]);

  const fetchPartnerDetails = async () => {
    try {
      const partnerRes = await driverService.getDriverById(partnerId);
      console.log('Fetched partner details:', partnerRes);
      const vehicleId = partnerRes?.partner?.vehicleId;

      let vehicleDetails = null;


      if (vehicleId) {
        try {
          const vehicleRes = await vehicleService.getVehicleById(vehicleId);
          console.log('Fetched vehicle details:', vehicleRes);
          vehicleDetails = vehicleRes?.vehicle;
        }
        catch (error) {
          console.error('Error fetching vehicle details:', error);
          toast.error('Failed to fetch vehicle details');
        }
      };
      setPartner(partnerRes.partner ? { ...partnerRes.partner, vehicleDetails } : null);
    } catch (error) {
      console.error('Error fetching partner details:', error);
      toast.error('Failed to fetch partner details');
    } finally {
      setLoading(false);
    }
  };

console.log('Partner details====>:', partner);


  const handleBack = () => {
    onBack();
  };

  const verificationFields: VerificationField[] = [
    { key: 'bankDetailsCompleted', label: 'Bank Details' },
    { key: 'personalDocumentsCompleted', label: 'Personal Documents' },
    { key: 'vehicleDetailsCompleted', label: 'Vehicle Details' }
  ];

  const handleVerification = async (field: string) => {
    try {
      const response = await driverService.verifyDocument(partnerId, field);

      if (response.success) {
        setPartner(prev => prev ? { ...prev, [field]: true } : null);
        toast.success('Verification updated successfully');
      }
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error('Failed to update verification');
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: <User size={18} /> },
    { id: 'vehicle', label: 'Vehicle Details', icon: <Truck size={18} /> },
    { id: 'bank', label: 'Bank Details', icon: <Building2 size={18} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={18} /> },
  ];

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (!partner) return <div className="text-center text-red-500 py-4">Partner not found</div>;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-sm">
      {/* Header with Status */}
      <div className="border-b border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Partner Request Details</h2>
                <p className="text-sm text-gray-500 mt-1">Request ID: {partner.partnerId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Clock size={18} className="text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">
                  Joined: {new Date(partner.createdAt).toLocaleDateString()}
                </span>
              </div>
              <VerificationBadge partner={partner} />
            </div>
          </div>

          {/* Profile Summary */}
          <div className="flex items-center mt-6">
            {partner.profilePicturePath ? (
              <img
                src={`${partner.profilePicturePath}`}
                alt={partner.fullName}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <User size={32} className="text-gray-400" />
              </div>
            )}
            <div className="ml-6">
              <h3 className="text-2xl font-bold text-gray-800">{partner.fullName}</h3>
              <div className="flex items-center mt-2 text-gray-600">
                <span className="mr-4">{partner.email}</span>
                <span>{partner.mobileNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <nav className="flex space-x-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard
              title="Personal Information"
              icon={<User className="text-blue-500" />}
              items={[
                { label: "Full Name", value: partner.fullName },
                { label: "Email", value: partner.email },
                { label: "Mobile", value: partner.mobileNumber },
                { label: "Date of Birth", value: partner.dateOfBirth },
                { label: "Address", value: partner.address }
              ]}
            />
          </div>
        )}

        {activeTab === 'vehicle' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard
              title="Vehicle Details"
              icon={<Truck className="text-blue-500" />}
              items={[
                { label: "Vehicle Type", value: partner.vehicleDetails.name
                },
                { label: "Registration Number", value: partner.registrationNumber }
              ]}
            />
            <DocumentsCard
              title="Vehicle Documents"
              documents={[
                {
                  label: "License",
                  path: partner.vehicleDocuments.license.frontUrl,
                  docType: "license",
                  isComplete: Boolean(partner.vehicleDocuments.license.frontUrl),
                  verificationField: "vehicleDetailsCompleted"
                },
                {
                  label: "Insurance",
                  path: partner.vehicleDocuments.insurance.frontUrl,
                  docType: "insurance",
                  isComplete: Boolean(partner.vehicleDocuments.insurance.frontUrl),
                  verificationField: "vehicleDetailsCompleted"
                },
                {
                  label: "Pollution Certificate",
                  path: partner.vehicleDocuments.pollution.frontUrl,
                  docType: "pollution",
                  isComplete: Boolean(partner.vehicleDocuments.pollution.frontUrl),
                  verificationField: "vehicleDetailsCompleted"
                }
              ]}
              partner={partner}
              onVerify={() => handleVerification('vehicleDetailsCompleted')}
            />
          </div>
        )}

        {activeTab === 'bank' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard
              title="Bank Account Details"
              icon={<Building2 className="text-purple-500" />}
              items={[
                { label: "Account Holder", value: partner.accountHolderName },
                { label: "Account Number", value: partner.accountNumber },
                { label: "IFSC Code", value: partner.ifscCode },
                { label: "UPI ID", value: partner.upiId }
              ]}
              verificationStatus={{
                isVerified: partner.bankDetailsCompleted,
                onVerify: () => handleVerification('bankDetailsCompleted')
              }}
            />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DocumentsCard
              title="Identity Documents"
              documents={[
                {
                  label: "Aadhar Card",
                  path: partner.vehicleDocuments.aadhar.frontUrl,
                  docType: "aadhar",
                  isComplete: Boolean(partner.vehicleDocuments.aadhar.frontUrl),
                  verificationField: "personalDocumentsCompleted"
                },
                {
                  label: "PAN Card",
                  path: partner.vehicleDocuments.pan.frontUrl,
                  docType: "pan",
                  isComplete: Boolean(partner.vehicleDocuments.pan.frontUrl),
                  verificationField: "personalDocumentsCompleted"
                }
              ]}
              partner={partner}
              onVerify={() => handleVerification('personalDocumentsCompleted')}
            />
          </div>
        )}

        {/* Add Verification Status section */}
        <div className="mt-8 bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Verification Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {verificationFields.map((field) => (
              <VerificationCard
                key={field.key}
                label={field.label}
                isVerified={Boolean(partner[field.key])}
                onVerify={() => handleVerification(field.key)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const InfoCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  items: Array<{ label: string; value: string }>;
  verificationStatus?: {
    isVerified: boolean;
    onVerify: () => void;
  };
}> = ({ title, icon, items, verificationStatus }) => (
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        {icon}
        <h3 className="text-lg font-semibold ml-2">{title}</h3>
      </div>
      {verificationStatus && (
        <div className="flex items-center">
          {verificationStatus.isVerified ? (
            <span className="flex items-center text-green-600 text-sm">
              <CheckCircle size={16} className="mr-1" />
              Verified
            </span>
          ) : (
            <button
              onClick={verificationStatus.onVerify}
              className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm hover:bg-blue-100 transition-colors"
            >
              Verify
            </button>
          )}
        </div>
      )}
    </div>
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index}>
          <p className="text-sm text-gray-500">{item.label}</p>
          <p className="font-medium">{item.value}</p>
        </div>
      ))}
    </div>
  </div>
);

const DocumentsCard: React.FC<{
  title: string;
  documents: Array<{
    label: string;
    path?: string;
    docType: string;
    isComplete: boolean;
    verificationField?: keyof PartnerDetails;
  }>;
  partner: PartnerDetails;
  onVerify: () => void;
}> = ({ title, documents, partner, onVerify }) => (
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
    <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
    <div className="space-y-4">
      {documents.map((doc, index) => (
        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
          <div className="flex items-center">
            {doc.isComplete ? (
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 mr-2" />
            )}
            <span className="text-gray-700">{doc.label}</span>
          </div>
          <div className="flex items-center space-x-2">

            {doc.path && (
              <button
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm hover:bg-blue-100 transition-colors"
                onClick={() => window.open(`${doc.path}`, '_blank')}
              >
                View
              </button>
            )}
            {doc.verificationField && !partner[doc.verificationField as keyof PartnerDetails] && (
              <button
                className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm hover:bg-green-100 transition-colors"
                onClick={onVerify}
              >
                Verify
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const VerificationBadge: React.FC<{ partner: PartnerDetails }> = ({ partner }) => {
  const isFullyVerified = partner.bankDetailsCompleted &&
    partner.personalDocumentsCompleted &&
    partner.vehicleDetailsCompleted;

  return (
    <div className={`flex items-center px-4 py-2 rounded-full ${isFullyVerified
        ? 'bg-green-50 text-green-700'
        : 'bg-yellow-50 text-yellow-700'
      }`}>
      {isFullyVerified ? (
        <Shield className="w-4 h-4 mr-2" />
      ) : (
        <Clock className="w-4 h-4 mr-2" />
      )}
      <span className="text-sm font-medium">
        {isFullyVerified ? 'Verified Partner' : 'Verification Pending'}
      </span>
    </div>
  );
};

const VerificationCard: React.FC<{
  label: string;
  isVerified: boolean;
  onVerify: () => void;
}> = ({ label, isVerified, onVerify }) => (
  <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between">
    <div className="flex items-center">
      {isVerified ? (
        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
      ) : (
        <Clock className="w-5 h-5 text-yellow-500 mr-2" />
      )}
      <span className="text-gray-700">{label}</span>
    </div>
    {!isVerified && (
      <button
        onClick={onVerify}
        className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm hover:bg-green-100 transition-colors"
      >
        Verify
      </button>
    )}
  </div>
);

export default PartnerRequestView; 