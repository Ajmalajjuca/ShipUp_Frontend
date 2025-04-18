import { BankDetailsForm } from "./components/BankDetailsForm";
import { RegistrationForm } from "./components/RegistrationForm";
import { VehicleDetailsForm } from "./components/VehicleDetailsForm";

export const DOCUMENT_STEPS = [
    { id: 'PersonalDocuments', title: 'Personal Documents', isCompleted: false, formComponent: RegistrationForm },
    { id: 'VehicleDetails', title: 'Vehicle Details', isCompleted: false, formComponent: VehicleDetailsForm },
    { id: 'BankDetails', title: 'Bank Details', isCompleted: false, formComponent: BankDetailsForm },
] as const;  // This ensures TypeScript infers the exact string values
