import React, { useState } from 'react';
import { 
  activatePremiumByEmail, 
  deactivatePremiumByEmail, 
  batchProcessPayments,
  syncSubscriptionsByEmail,
  findContactByEmail 
} from '../../utils/ghlSubscriptionAPI';

const SubscriptionManager = () => {
  const [activeTab, setActiveTab] = useState('single');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Single email processing
  const [singleEmail, setSingleEmail] = useState('');
  const [singleAction, setSingleAction] = useState('activate');

  // Batch processing
  const [batchEmails, setBatchEmails] = useState('');
  const [batchAction, setBatchAction] = useState('activate');

  // Payment data processing
  const [paymentData, setPaymentData] = useState('');

  const handleSingleProcess = async () => {
    if (!singleEmail.trim()) {
      alert('Please enter an email address');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      let result;
      if (singleAction === 'activate') {
        result = await activatePremiumByEmail(singleEmail, {
          paymentId: `manual_${Date.now()}`,
          amount: '3.99'
        });
      } else if (singleAction === 'deactivate') {
        result = await deactivatePremiumByEmail(singleEmail, {
          reason: 'Manual deactivation'
        });
      } else if (singleAction === 'search') {
        const contact = await findContactByEmail(singleEmail);
        result = {
          success: !!contact,
          email: singleEmail,
          contact: contact,
          message: contact ? 'Contact found' : 'Contact not found'
        };
      }

      setResults(result);
    } catch (error) {
      setResults({
        success: false,
        error: error.message,
        email: singleEmail
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchProcess = async () => {
    const emails = batchEmails.split('\n').filter(email => email.trim());
    
    if (emails.length === 0) {
      alert('Please enter at least one email address');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      if (batchAction === 'sync') {
        const result = await syncSubscriptionsByEmail(emails);
        setResults(result);
      } else {
        // Convert emails to events format for batch processing
        const events = emails.map(email => ({
          type: batchAction === 'activate' ? 'payment_success' : 'subscription_cancelled',
          email: email.trim(),
          paymentId: `manual_${Date.now()}_${Math.random()}`,
          amount: '3.99'
        }));

        const result = await batchProcessPayments(events);
        setResults(result);
      }
    } catch (error) {
      setResults({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentDataProcess = async () => {
    try {
      const payments = JSON.parse(paymentData);
      
      if (!Array.isArray(payments)) {
        throw new Error('Payment data must be an array');
      }

      setLoading(true);
      setResults(null);

      const result = await batchProcessPayments(payments);
      setResults(result);
    } catch (error) {
      setResults({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const ResultsDisplay = ({ results }) => {
    if (!results) return null;

    return (
      <div className="mt-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Results</h3>
        
        {results.success !== undefined && (
          <div className={`p-3 rounded-md mb-3 ${
            results.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className={`font-medium ${results.success ? 'text-green-800' : 'text-red-800'}`}>
              {results.success ? '✅ Success' : '❌ Failed'}
            </div>
            {results.error && (
              <div className="text-red-600 text-sm mt-1">{results.error}</div>
            )}
          </div>
        )}

        {results.processed !== undefined && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="text-lg font-bold text-blue-600">{results.processed}</div>
              <div className="text-sm text-blue-600">Processed</div>
            </div>
            <div className="bg-green-50 p-3 rounded-md">
              <div className="text-lg font-bold text-green-600">{results.successful}</div>
              <div className="text-sm text-green-600">Successful</div>
            </div>
            <div className="bg-red-50 p-3 rounded-md">
              <div className="text-lg font-bold text-red-600">{results.failed}</div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
          </div>
        )}

        {results.details && (
          <div className="max-h-64 overflow-y-auto">
            <h4 className="font-medium mb-2">Details:</h4>
            {results.details.map((detail, index) => (
              <div key={index} className={`p-2 mb-2 rounded text-sm ${
                detail.success ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="font-medium">{detail.email}</div>
                {detail.contactName && <div>Contact: {detail.contactName}</div>}
                {detail.message && <div>{detail.message}</div>}
                {detail.error && <div className="text-red-600">{detail.error}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-theme-text-primary mb-6">
        Subscription Manager
      </h1>
      <p className="text-theme-text-secondary mb-8">
        Manage subscription status and sync payments from Stripe to GoHighLevel automatically.
      </p>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6 border-b">
        {[
          { id: 'single', label: 'Single User' },
          { id: 'batch', label: 'Batch Processing' },
          { id: 'payments', label: 'Payment Data' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-theme-accent-blue text-theme-accent-blue'
                : 'border-transparent text-theme-text-secondary hover:text-theme-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Single User Tab */}
      {activeTab === 'single' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Single User Management</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              value={singleEmail}
              onChange={(e) => setSingleEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-theme-accent-blue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Action</label>
            <select
              value={singleAction}
              onChange={(e) => setSingleAction(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-theme-accent-blue"
            >
              <option value="activate">Activate Premium</option>
              <option value="deactivate">Deactivate Premium</option>
              <option value="search">Search Contact</option>
            </select>
          </div>

          <button
            onClick={handleSingleProcess}
            disabled={loading}
            className="px-6 py-3 bg-theme-accent-blue text-white rounded-md hover:bg-theme-accent-blue/90 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Execute'}
          </button>
        </div>
      )}

      {/* Batch Processing Tab */}
      {activeTab === 'batch' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Batch Processing</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Email Addresses (one per line)
            </label>
            <textarea
              value={batchEmails}
              onChange={(e) => setBatchEmails(e.target.value)}
              placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-theme-accent-blue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Batch Action</label>
            <select
              value={batchAction}
              onChange={(e) => setBatchAction(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-theme-accent-blue"
            >
              <option value="activate">Activate Premium (All)</option>
              <option value="deactivate">Deactivate Premium (All)</option>
              <option value="sync">Sync Status (Check Only)</option>
            </select>
          </div>

          <button
            onClick={handleBatchProcess}
            disabled={loading}
            className="px-6 py-3 bg-theme-accent-purple text-white rounded-md hover:bg-theme-accent-purple/90 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Execute Batch'}
          </button>
        </div>
      )}

      {/* Payment Data Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Process Payment Data</h2>
          <p className="text-sm text-theme-text-secondary">
            Paste JSON data from Stripe payments to automatically process subscriptions.
          </p>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Payment JSON Data
            </label>
            <textarea
              value={paymentData}
              onChange={(e) => setPaymentData(e.target.value)}
              placeholder={`[
  {
    "type": "payment_success",
    "email": "user@example.com",
    "paymentId": "pi_xxx",
    "amount": "3.99"
  }
]`}
              rows={10}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-theme-accent-blue focus:border-transparent font-mono text-sm"
            />
          </div>

          <button
            onClick={handlePaymentDataProcess}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Process Payments'}
          </button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Expected JSON Format:</h3>
            <pre className="text-sm text-blue-700 overflow-x-auto">
{`[
  {
    "type": "payment_success",
    "email": "customer@example.com",
    "paymentId": "pi_1234567890",
    "amount": "3.99",
    "timestamp": 1234567890
  }
]`}
            </pre>
          </div>
        </div>
      )}

      {/* Results */}
      <ResultsDisplay results={results} />
    </div>
  );
};

export default SubscriptionManager; 