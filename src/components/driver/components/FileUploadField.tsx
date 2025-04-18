import React, { useState } from 'react';

interface FileUploadFieldProps {
  label: string;
  name: string;
  onChange: (name: string, file: File | null) => void;
  error?: string;
  accept?: string;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  name,
  onChange,
  error,
  accept = "image/*,.pdf"
}) => {
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setFileName(file.name);
      onChange(name, file);
    } else {
      setFileName('');
      onChange(name, null);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={name}>
        {label}
      </label>
      <div className={`border rounded-md ${error ? 'border-red-500' : 'border-gray-300'} overflow-hidden`}>
        <div className="flex items-center">
          <label className="flex-1 cursor-pointer">
            <div className="px-3 py-1.5 text-sm text-gray-500 truncate">
              {fileName || 'Choose file...'}
            </div>
            <input
              type="file"
              id={name}
              name={name}
              onChange={handleFileChange}
              accept={accept}
              className="hidden"
            />
          </label>
          <button
            type="button"
            className="bg-gray-100 px-3 py-1.5 text-sm border-l"
            onClick={() => document.getElementById(name)?.click()}
          >
            Browse
          </button>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}; 