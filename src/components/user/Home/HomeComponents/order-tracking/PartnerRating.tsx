import React, { useState } from 'react';
import { Star, MessageSquare, Send, ThumbsUp, Award, Clock, Shield, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { orderService } from '../../../../../services/order.service';

// Define interfaces for props and types
interface PartnerRatingProps {
  orderId: string;
  userId?: string;
  driverId: string;
  driverName?: string;
  driverPhoto?: string;
  onRatingComplete?: () => void;
}

interface ReviewOption {
  id: number;
  text: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PartnerRating: React.FC<PartnerRatingProps> = ({ orderId, userId, driverId, driverName, driverPhoto, onRatingComplete }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [quickReviews, setQuickReviews] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Predefined quick review options
  const reviewOptions: ReviewOption[] = [
    { id: 1, text: 'Excellent service', icon: ThumbsUp },
    { id: 2, text: 'Polite & friendly', icon: MessageSquare },
    { id: 3, text: 'On time delivery', icon: Clock },
    { id: 4, text: 'Safe driving', icon: Shield },
    { id: 5, text: 'Well handled package', icon: Award },
  ];

  const handleRatingClick = (value: number): void => {
    setRating(value);
  };

  const handleQuickReviewToggle = (id: number): void => {
    if (quickReviews.includes(id)) {
      setQuickReviews(quickReviews.filter(item => item !== id));
    } else {
      setQuickReviews([...quickReviews, id]);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get the text values of selected quick reviews
      const selectedReviewTexts: (string | undefined)[] = quickReviews.map(id => 
        reviewOptions.find(option => option.id === id)?.text
      );

      // Create the payload
      const ratingData = {
          driverId,
          userId,
        orderId,
        rating,
        feedback,
        quickReviews: selectedReviewTexts.filter((text): text is string => text !== undefined)
      };

        // Simulate API call
        const response = await orderService.submitRating(ratingData);
      
      toast.success('Rating submitted successfully!');
      console.log('Rating submitted:', response);
      
      setSubmitted(true);
      if (onRatingComplete) onRatingComplete();
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-green-600 w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Thank You!</h3>
        <p className="text-gray-600">Your feedback helps us improve our service.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-md mx-auto">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
        <h3 className="text-xl font-bold mb-1">Rate Your Experience</h3>
        <p className="text-blue-100 text-sm">Your feedback helps us improve</p>
      </div>
      
      {/* Driver info */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden mr-4 flex-shrink-0 border-2 border-white shadow">
            {driverPhoto ? (
              <img src={driverPhoto} alt={driverName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-semibold text-gray-500">
                {driverName?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-800">How was your delivery with</p>
            <p className="text-lg font-bold text-gray-900">{driverName || 'your driver'}?</p>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-5">
        {/* Star Rating */}
        <div className="flex justify-center items-center space-x-2 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingClick(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`w-10 h-10 ${
                  star <= (hoveredRating || rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                } transition-colors`}
              />
            </button>
          ))}
        </div>

        {/* Rating label */}
        <div className="text-center mb-6">
          <p className="text-gray-700 font-medium">
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
            {rating === 0 && 'Tap to rate'}
          </p>
        </div>

        {/* Quick Review Tags */}
        <div className="mb-6">
          <p className="text-gray-700 font-medium text-sm mb-3">Quick feedback (optional)</p>
          <div className="flex flex-wrap gap-2">
            {reviewOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = quickReviews.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => handleQuickReviewToggle(option.id)}
                  className={`px-3 py-2 rounded-full text-sm font-medium flex items-center transition-colors ${
                    isSelected 
                      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 mr-1.5" />
                  {option.text}
                </button>
              );
            })}
          </div>
        </div>

        {/* Additional Comments */}
        <div className="mb-6">
          <p className="text-gray-700 font-medium text-sm mb-2">Additional comments (optional)</p>
          <div className="relative">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Share more details about your experience..."
              rows={3}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-sm mb-4 text-center">{error}</div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin w-4 h-4 mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Feedback
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PartnerRating;