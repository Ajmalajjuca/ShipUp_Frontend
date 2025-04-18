export interface DriverRegistrationData {
    // Personal Info
    fullName: string;
    dateOfBirth: string;
    mobileNumber: string;
    email: string;
    address: string;
    profilePicture: File | null;
    profilePicturePath?: string; // S3 URL for the profile picture
  
    // Vehicle Details
    vehicleType: string;
    registrationNumber: string;
    vehicleMake: string;
    vehicleModel: string;
    manufacturingYear: string;
    insuranceDoc: File | null;
    pollutionDoc: File | null;
    registrationDoc: File | null;
    permitDoc: File | null;
  
    // Bank Details
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    upiId?: string;
  
    // Document Status (legacy format - maintained for backward compatibility)
    documents?: {
      aadhar?: File;
      pan?: File;
      license?: File;
    };

    // Document URLs with front and back sides
    vehicleDocuments?: {
      aadhar?: { frontUrl?: string; backUrl?: string };
      pan?: { frontUrl?: string; backUrl?: string };
      license?: { frontUrl?: string; backUrl?: string };
      insurance?: { frontUrl?: string; backUrl?: string };
      pollution?: { frontUrl?: string; backUrl?: string };
      registration?: { frontUrl?: string; backUrl?: string };
      permit?: { frontUrl?: string; backUrl?: string };
    };
  }
  
  export interface DocumentItem {
    id: string;
    title: string;
    isCompleted: boolean;
    formComponent: React.FC<any>;
  }