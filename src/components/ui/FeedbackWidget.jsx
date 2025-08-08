import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const FeedbackWidget = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const openFeedback = () => {
    const params = new URLSearchParams({
      type: 'Bug',
      feature: 'Auto-detect',
      page: location.pathname
    });
    navigate(`/feedback?${params.toString()}`);
  };

  return (
    <button
      onClick={openFeedback}
      className="fixed bottom-6 right-6 px-4 py-2 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-500 z-50"
      aria-label="Give feedback"
    >
      Feedback
    </button>
  );
};

export default FeedbackWidget;


