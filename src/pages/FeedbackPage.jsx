import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const GHL_FORM_ID = '1ShKicSxdhayy2DrpTPm';
const GHL_FORM_BASE = `https://api.leadconnectorhq.com/widget/form/${GHL_FORM_ID}`;

const allowedPrefillKeys = [
  'type',
  'feature',
  'deckId',
  'deckName',
  'severity',
  'frequency',
  'impact',
  'details',
  'email',
  'environment',
  'browser',
  'page'
];

const FeedbackPage = () => {
  const location = useLocation();

  const iframeSrc = useMemo(() => {
    const inputParams = new URLSearchParams(location.search);
    const out = new URLSearchParams();

    allowedPrefillKeys.forEach((key) => {
      if (inputParams.has(key)) {
        out.set(key, inputParams.get(key) || '');
      }
    });

    if (!out.has('page')) {
      out.set('page', location.pathname);
    }

    const query = out.toString();
    return query ? `${GHL_FORM_BASE}?${query}` : GHL_FORM_BASE;
  }, [location.search, location.pathname]);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12 space-y-12">
        <div className="text-center">
          <h1 className="text-5xl lg:text-6xl font-bold text-gradient-primary mb-6">Feedback & Bug Reports</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Tell us what’s not working or what you’d like improved.
          </p>
        </div>

        <div className="relative glassmorphism-card p-8 border-primary-500/30">
          <div className="w-full" style={{ height: '1025px' }}>
            <iframe
              src={iframeSrc}
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
              id={`inline-${GHL_FORM_ID}`}
              data-layout="{'id':'INLINE'}"
              data-trigger-type="alwaysShow"
              data-trigger-value=""
              data-activation-type="alwaysActivated"
              data-activation-value=""
              data-deactivation-type="neverDeactivate"
              data-deactivation-value=""
              data-form-name="Feedback & Bug Reports"
              data-height="1025"
              data-layout-iframe-id={`inline-${GHL_FORM_ID}`}
              data-form-id={GHL_FORM_ID}
              title="Feedback & Bug Reports"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;


