import React, { useState } from 'react';
import { DriverRegistrationData } from '../types';

interface BankDetailsFormProps {
  initialData: Partial<DriverRegistrationData>;
  onSubmit: (data: Partial<DriverRegistrationData>) => void;
  onBack: () => void;
}

export const BankDetailsForm: React.FC<BankDetailsFormProps> = ({ initialData, onSubmit }) => {
  // Initialize form data with all properties from initialData, including vehicleDocuments
  const [formData, setFormData] = useState<Partial<DriverRegistrationData>>({
    ...initialData,
    accountHolderName: initialData.accountHolderName || '',
    accountNumber: initialData.accountNumber || '',
    ifscCode: initialData.ifscCode || '',
    upiId: initialData.upiId || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateAccountNumber = (number: string) => {
    // Check if it's a valid length (usually between 9-18 digits)
    if (!/^\d{9,18}$/.test(number)) {
      return 'Account number should be between 9-18 digits';
    }
    return '';
  };

  const validateIFSC = (code: string) => {
    // IFSC format: 4 letters + 0 + 6 digits
    const regex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!regex.test(code)) {
      return 'Invalid IFSC code format';
    }
    return '';
  };

  const validateUPI = (id: string) => {
    // Basic UPI ID validation
    const regex = /^[\w\.\-_]{3,}@[a-zA-Z]{3,}$/;
    if (!regex.test(id)) {
      return 'Invalid UPI ID format';
    }
    return '';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Account Holder Name validation
    if (!formData.accountHolderName) {
      newErrors.accountHolderName = 'Account holder name is required';
    }

    // Account Number validation
    if (!formData.accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    } else {
      const accError = validateAccountNumber(formData.accountNumber);
      if (accError) {
        newErrors.accountNumber = accError;
      }
    }

    // IFSC validation
    if (!formData.ifscCode) {
      newErrors.ifscCode = 'IFSC code is required';
    } else {
      const ifscError = validateIFSC(formData.ifscCode.toUpperCase());
      if (ifscError) {
        newErrors.ifscCode = ifscError;
      }
    }

    // UPI ID validation
    if (formData.upiId) {
      const upiError = validateUPI(formData.upiId);
      if (upiError) {
        newErrors.upiId = upiError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Make sure to preserve all existing data, especially vehicleDocuments
      onSubmit({
        ...initialData,  // Include all initial data
        accountHolderName: formData.accountHolderName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        upiId: formData.upiId,
        vehicleDocuments: initialData.vehicleDocuments  // Explicitly preserve vehicleDocuments
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Account Holder Name */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Account Holder Name</label>
          <input
            type="text"
            name="accountHolderName"
            placeholder="Enter account holder name"
            value={formData.accountHolderName || ''}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm rounded-lg border ${
              errors.accountHolderName ? 'border-red-500' : 'border-gray-200'
            } focus:border-red-300 focus:ring-1 focus:ring-red-200 outline-none transition-all`}
          />
          {errors.accountHolderName && (
            <p className="text-xs text-red-500 mt-1">{errors.accountHolderName}</p>
          )}
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Account Number</label>
          <input
            type="text"
            name="accountNumber"
            placeholder="Enter account number"
            value={formData.accountNumber || ''}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm rounded-lg border ${
              errors.accountNumber ? 'border-red-500' : 'border-gray-200'
            } focus:border-red-300 focus:ring-1 focus:ring-red-200 outline-none transition-all`}
          />
          {errors.accountNumber && (
            <p className="text-xs text-red-500 mt-1">{errors.accountNumber}</p>
          )}
        </div>

        {/* IFSC Code */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">IFSC Code</label>
          <input
            type="text"
            name="ifscCode"
            placeholder="e.g. SBIN0000123"
            value={formData.ifscCode || ''}
            onChange={handleChange}
            maxLength={11}
            className={`w-full px-3 py-2 text-sm rounded-lg border ${
              errors.ifscCode ? 'border-red-500' : 'border-gray-200'
            } focus:border-red-300 focus:ring-1 focus:ring-red-200 outline-none transition-all uppercase`}
          />
          {errors.ifscCode && (
            <p className="text-xs text-red-500 mt-1">{errors.ifscCode}</p>
          )}
        </div>

        {/* UPI ID */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">UPI ID (Optional)</label>
          <input
            type="text"
            name="upiId"
            placeholder="e.g. username@upi"
            value={formData.upiId || ''}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm rounded-lg border ${
              errors.upiId ? 'border-red-500' : 'border-gray-200'
            } focus:border-red-300 focus:ring-1 focus:ring-red-200 outline-none transition-all`}
          />
          {errors.upiId && (
            <p className="text-xs text-red-500 mt-1">{errors.upiId}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full mt-4 bg-indigo-900 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-800 transition-colors flex items-center justify-center text-sm"
        >
          Submit
          <span className="ml-2">→</span>
        </button>
      </form>
    </div>
  );
};