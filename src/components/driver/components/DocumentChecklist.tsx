import React from 'react';

interface DocumentChecklistProps {
  onDocumentClick: (documentId: string) => void;
  onNextClick: () => void;
  completedDocuments: string[];
  isSubmitting?: boolean;
}

export const DocumentChecklist: React.FC<DocumentChecklistProps> = ({
  onDocumentClick,
  onNextClick,
  completedDocuments,
  isSubmitting = false
}) => {
  const documents = [
    { id: 'personal', title: 'Personal Information' },
    { id: 'documents', title: 'Personal Documents' },
    { id: 'vehicle', title: 'Vehicle Details' },
    { id: 'bank', title: 'Bank Account Details' },
  ];

  const allCompleted = documents.every(doc => completedDocuments.includes(doc.id));

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="space-y-3">
        {documents.map(doc => (
          <button
            key={doc.id}
            onClick={() => onDocumentClick(doc.id)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            <span className="text-gray-800">{doc.title}</span>
            <div className="flex items-center">
              <span className={`text-sm ${
                completedDocuments.includes(doc.id) ? 'text-green-500' : 'text-red-500'
              }`}>
                {completedDocuments.includes(doc.id) ? '✓' : '→'}
              </span>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onNextClick}
        disabled={!allCompleted || isSubmitting}
        className={`w-full mt-6 bg-indigo-900 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center
          ${(!allCompleted || isSubmitting) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-800'}`}
      >
        {isSubmitting ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            SUBMITTING...
          </span>
        ) : (
          <>
            NEXT
            <span className="ml-2">→</span>
          </>
        )}
      </button>
    </div>
  );
};