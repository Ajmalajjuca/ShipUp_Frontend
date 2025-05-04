import { useState, useEffect } from 'react';
import { DriverRegistrationData } from './types';
import { DOCUMENT_STEPS } from './constants';
import RegistrationLayout from './components/RegistrationLayout';
import { DocumentChecklist } from './components/DocumentChecklist';
import { PersonalDocuments } from './components/PersonalDocuments';
import { DocumentUpload } from './components/DocumentUpload';
import DocumentLayout from './components/DocumentLayout';
import { VehicleDetailsForm } from './components/VehicleDetailsForm';
import { BankDetailsForm } from './components/BankDetailsForm';
import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { s3Utils } from '../../utils/s3Utils';
import { sessionManager } from '../../utils/sessionManager';
import { toast } from 'react-hot-toast';

const PartnerReg = () => {
    const [currentStep, setCurrentStep] = useState<string>('registration');
    const [formData, setFormData] = useState<Partial<DriverRegistrationData>>({});
    const [selectedDocument, setSelectedDocument] = useState<string>('');
    const [completedDocuments, setCompletedDocuments] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [verificationData, setVerificationData] = useState<{[key: string]: boolean}>({
        BankDetails: false,
        PersonalDocuments: false,
        VehicleDetails: false
    });

    const navigate = useNavigate()
    
    // Check for existing driver session on load
    useEffect(() => {
        const { token, driverData } = sessionManager.getDriverSession();
        if (token && driverData) {
            // If already registered, go to verification page
            navigate('/partner/verification', { replace: true });
        }
    }, [navigate]);

    const handleFormSubmit = (data: Partial<DriverRegistrationData>) => {
        if (!data.fullName || !data.mobileNumber || !data.dateOfBirth || !data.email || !data.address) {
            return; // Form validation will be handled in RegistrationForm
        }
        setFormData(prev => ({ ...prev, ...data }));
        setCompletedDocuments(prev => [...prev, 'personal']);
        setCurrentStep('documents');
    };

    const handleDocumentClick = (documentId: string) => {
        switch (documentId) {
            case 'documents':
                setCurrentStep('personal-documents');
                break;
            case 'personal':
                // Don't navigate when clicking completed personal info
                break;
            case 'vehicle':
                setCurrentStep('vehicle-details');
                break;
            case 'bank':
                setCurrentStep('bank-details');
                break;
            default:
                setSelectedDocument(documentId);
                setCurrentStep(documentId);
        }
    };

    const handleDocumentUpload = async (files: { front?: string; back?: string }) => {
        if (!files.front || !files.back) return;

        // Store S3 URLs in formData using the new vehicleDocuments structure
        setFormData(prev => ({
            ...prev,
            vehicleDocuments: {
                ...prev.vehicleDocuments,
                [selectedDocument]: {
                    frontUrl: files.front,
                    backUrl: files.back
                }
            }
        }));

        // Handle document completion status
        setCompletedDocuments(prev => {
            const newCompleted = [...prev, selectedDocument];

            // Check if all personal documents are completed
            const requiredDocs = ['aadhar', 'pan', 'license'];
            const allPersonalDocsCompleted = requiredDocs.every(doc =>
                newCompleted.includes(doc)
            );

            // If all personal docs are completed, mark the documents section as completed
            if (allPersonalDocsCompleted && !newCompleted.includes('documents')) {
                return [...newCompleted, 'documents'];
            }

            return newCompleted;
        });

        setCurrentStep('personal-documents');
    };

    const handleBack = () => {
        setCurrentStep('documents');
    };

    const handleLogout = () => {
        try {
            // Clear driver session
            sessionManager.clearDriverSession();
            
            // Clear regular session as well to ensure all tokens are removed
            sessionManager.clearSession();
            
            // Show success message
            toast.success('Logged out successfully');
            
            // Navigate to partner login page
            navigate('/partner');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Error during logout');
            
            // Attempt to navigate anyway
            navigate('/partner');
        }
    };

    const submitToBackend = async (data: Partial<DriverRegistrationData>) => {
        setIsSubmitting(true);
        setSubmitError(null);

        // Create FormData object to handle file uploads
        const formDataToSend = new FormData();

        // Append all non-file data
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'vehicleDocuments') {
                // Handle the vehicleDocuments structure separately
                if (value && typeof value === 'object') {
                    // Stringify the vehicleDocuments object to preserve its structure
                    formDataToSend.append('vehicleDocuments', JSON.stringify(value));
                }
            } else if (key === 'profilePicturePath') {
                // Add the S3 profile picture URL directly
                if (value) {
                    formDataToSend.append('profilePicturePath', String(value));
                }
            } else if (value instanceof File) {
                formDataToSend.append(key, value);
            } else if (key === 'profilePicture' && value === null && data.profilePicturePath) {
                // Skip the null profile picture if we have a profilePicturePath
                // This prevents issues where both are sent but one is null
            } else if (value !== undefined && value !== null && typeof value !== 'object') {
                formDataToSend.append(key, String(value));
            } else if (value !== undefined && value !== null && typeof value === 'object') {
                // For other nested objects, stringify them
                formDataToSend.append(key, JSON.stringify(value));
            }
        });

        try {
            
            const response = await axios.post('http://localhost:3003/api/drivers', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Driver registration response:', response.data);
            
            
            if (response.data.success) {
                // Store the token and user data in session                
                if (response.data.token && response.data.partner) {
                    sessionManager.setDriverSession(response.data.token,{
                        email:response.data.partner.email,
                        partnerId:response.data.partner.partnerId,
                        role:'partner'
                    });
                    toast.success('Registration successful!');
                    
                    // Navigate to verification page
                    navigate('/partner/dashboard', { replace: true });
                } else {
                    // Set verification data
                    if (response.data.verificationStatus) {
                        setVerificationData({
                            BankDetails: response.data.verificationStatus.BankDetails || false,
                            PersonalDocuments: response.data.verificationStatus.PersonalDocuments || false,
                            VehicleDetails: response.data.verificationStatus.VehicleDetails || false
                        });
                    }
                    
                    setCurrentStep('verification');
                }
            } else {
                setSubmitError('Registration failed. Please try again.');
            }
        } catch (error: any) {
            console.error('Driver registration error:', error);
            setSubmitError(
                ((error as AxiosError)?.response?.data as { message?: string })?.message ||
                'An error occurred while submitting your application. Please try again.'
            );
            toast.error(` ${error.response?.data?.error || 'Something went wrong!'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNextClick = () => {
        const requiredDocuments = ['aadhar', 'pan', 'license'];
        const allDocumentsCompleted = requiredDocuments.every(doc =>
            completedDocuments.includes(doc)
        );

        if (allDocumentsCompleted) {
            submitToBackend(formData);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 'registration':
                return <RegistrationLayout onSubmit={handleFormSubmit} />;

            case 'documents':
                return (
                    <DocumentLayout title="Required Documents">
                        <DocumentChecklist
                            onDocumentClick={handleDocumentClick}
                            onNextClick={handleNextClick}
                            completedDocuments={completedDocuments}
                            isSubmitting={isSubmitting}
                        />
                    </DocumentLayout>
                );

            case 'personal-documents':
                return (
                    <DocumentLayout
                        title="Personal Documents"
                        subtitle="Upload focused photos of below documents for faster verification"
                        onBack={handleBack}
                    >
                        <PersonalDocuments
                            onDocumentClick={(docType) => {
                                setSelectedDocument(docType);
                                setCurrentStep('document-upload');
                            }}
                            completedDocuments={completedDocuments}
                        />
                    </DocumentLayout>
                );

            case 'document-upload':
                return (
                    <DocumentLayout
                        title={`Upload ${selectedDocument}`}
                        subtitle="Please ensure the document is clearly visible"
                        onBack={() => setCurrentStep('personal-documents')}
                    >
                        <DocumentUpload
                            documentType={selectedDocument}
                            onSubmit={handleDocumentUpload}
                            initialUrls={
                                formData.vehicleDocuments?.[selectedDocument as keyof typeof formData.vehicleDocuments] 
                                ? {
                                    front: formData.vehicleDocuments[selectedDocument as keyof typeof formData.vehicleDocuments]?.frontUrl,
                                    back: formData.vehicleDocuments[selectedDocument as keyof typeof formData.vehicleDocuments]?.backUrl
                                  }
                                : undefined
                            }
                        />
                    </DocumentLayout>
                );

            case 'vehicle-details':
                return (
                    <DocumentLayout
                        title="Vehicle Details"
                        subtitle="Enter your vehicle information"
                        onBack={handleBack}
                    >
                        <VehicleDetailsForm
                            initialData={formData}
                            onSubmit={(data) => {
                                setFormData(prev => ({ ...prev, ...data }));
                                setCompletedDocuments(prev => [...prev, 'vehicle']);
                                setCurrentStep('documents');
                            }}
                            onBack={handleBack}
                        />
                    </DocumentLayout>
                );

            case 'bank-details':
                return (
                    <DocumentLayout
                        title="Bank Account Details"
                        subtitle="Enter your bank account information"
                        onBack={handleBack}
                    >
                        <BankDetailsForm
                            initialData={formData}
                            onSubmit={(data) => {
                                setFormData(prev => ({ ...prev, ...data }));
                                setCompletedDocuments(prev => [...prev, 'bank']);
                                setCurrentStep('documents');
                            }}
                            onBack={handleBack}
                        />
                    </DocumentLayout>
                );

            case 'verification':
                return (
                    <DocumentLayout title="Verification Status">
                        <div className="p-4">
                            {submitError ? (
                                <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6">
                                    <h3 className="font-semibold mb-2">Submission Error</h3>
                                    <p className="text-sm">{submitError}</p>
                                    <button
                                        onClick={() => submitToBackend(formData)}
                                        className="mt-3 text-sm text-red-600 hover:text-red-800"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-yellow-50 text-gray-800 p-4 rounded-lg mb-6">
                                    <h3 className="font-semibold mb-2">Your application is under review</h3>
                                    <p className="text-sm">Our team will verify your documents within 48hrs</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                                    <span>Personal information</span>
                                    <span className="text-sm text-green-600">Approved</span>
                                </div>

                                {DOCUMENT_STEPS.map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                                        <span>{doc.title}</span>
                                        <span className={`text-sm ${verificationData[doc.id] ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {verificationData[doc.id] ? 'Approved' : 'Verification Pending'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 text-center">
                                <a href="#" className="text-red-500 text-sm">Need Help? Contact Us</a>
                            </div>

                            <div className="mt-4 flex justify-center">
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-sm hover:bg-gray-300 transition-all"
                                >
                                    Go Back
                                </button>
                            </div>
                        </div>
                    </DocumentLayout>
                );

            default:
                return null;
        }
    };

    return <>{renderStep()}</>;
};

export default PartnerReg;