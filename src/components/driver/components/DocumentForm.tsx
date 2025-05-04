import React from 'react';

interface DocumentFormProps {
  title: string;
  description: string;
  onSubmit: (data: any) => void;
}

const DocumentForm: React.FC<DocumentFormProps> = ({
  description,
  onSubmit
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 text-sm text-red-500 hover:text-red-600"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Upload Photo
        </button>
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-900 text-white py-3 px-4 rounded-lg hover:bg-indigo-800 transition-colors"
      >
        Submit
      </button>
    </form>
  );
};

export default DocumentForm; 