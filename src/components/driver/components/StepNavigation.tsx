import React from 'react';

interface StepNavigationProps {
  onNext: () => void;
  onBack?: () => void;
  nextDisabled?: boolean;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({ onNext, onBack, nextDisabled }) => (
  <div className="flex justify-between mt-6">
    {onBack && (
      <button
        onClick={onBack}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
      >
        Back
      </button>
    )}
    <button
      onClick={onNext}
      disabled={nextDisabled}
      className={`px-4 py-2 bg-indigo-900 text-white rounded-lg ${nextDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-800'}`}
    >
      Next
    </button>
  </div>
);