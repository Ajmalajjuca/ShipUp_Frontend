import React from 'react';

interface PersonalDocumentsProps {
  onDocumentClick: (documentType: string) => void;
  completedDocuments: string[];
}

export const PersonalDocuments: React.FC<PersonalDocumentsProps> = ({
  onDocumentClick,
  completedDocuments
}) => {
  const documents = [
    { id: 'aadhar', title: 'Aadhar Card' },
    { id: 'pan', title: 'PAN Card' },
    { id: 'license', title: 'Driving License' },
  ];

  return (
    <div className="w-full max-w-md mx-auto p-6">
      {/* Header */}
      

      {/* Document List */}
      <div className="space-y-3">
        {documents.map(doc => (
          <button
            key={doc.id}
            onClick={() => onDocumentClick(doc.id)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
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
    </div>
  );
}; 