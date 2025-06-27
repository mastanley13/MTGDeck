import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { syncWithGoHighLevel } = useSubscription();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Processing your payment...');

  useEffect(() => {
    const processPaymentSuccess = async () => {
      try {
        // Get payment details from URL parameters
        const sessionId = searchParams.get('session_id');
        const paymentIntent = searchParams.get('payment_intent');
        const customerEmail = currentUser?.email;

        if (!customerEmail) {
          setStatus('error');
          setMessage('Please log in to complete your payment processing.');
          return;
        }

        // Send webhook to GoHighLevel
        const webhookData = {
          type: 'payment_success',
          email: customerEmail,
          paymentId: paymentIntent || sessionId,
          amount: '3.99',
          timestamp: Date.now(),
          userId: currentUser.id,
          contactId: currentUser.id
        };

        console.log('🔄 Sending webhook to GoHighLevel...', webhookData);

        // Send to your GoHighLevel webhook
        const webhookResponse = await fetch('https://services.leadconnectorhq.com/hooks/zKZ8Zy6VvGR1m7lNfRkY/webhook-trigger/8af7f178-88cd-4a86-8c44-b6f1079e6d95', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData)
        });

        if (webhookResponse.ok) {
          console.log('✅ Webhook sent successfully');
          
          // Refresh subscription status
          await syncWithGoHighLevel();
          
          setStatus('success');
          setMessage('Payment successful! Your premium subscription has been activated.');
          
          // Clear any pending upgrade data
          localStorage.removeItem('pendingUpgrade');
          
          // Redirect to subscription page after 3 seconds
          setTimeout(() => {
            navigate('/subscription');
          }, 3000);
        } else {
          console.error('❌ Webhook failed:', await webhookResponse.text());
          setStatus('error');
          setMessage('Payment was successful, but there was an issue activating your subscription. Please contact support.');
        }

      } catch (error) {
        console.error('❌ Error processing payment success:', error);
        setStatus('error');
        setMessage('There was an error processing your payment. Please contact support if your payment was charged.');
      }
    };

    // Only process if we have a user
    if (currentUser) {
      processPaymentSuccess();
    } else {
      setStatus('error');
      setMessage('Please log in to complete your payment processing.');
    }
  }, [currentUser, searchParams, navigate, syncWithGoHighLevel]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Processing Payment</h1>
            <p className="text-gray-600 mb-6">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">Redirecting you to your subscription page...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Issue</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/subscription')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Subscription Page
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Contact Support
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage; 