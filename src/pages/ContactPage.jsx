import React from 'react';

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl lg:text-6xl font-bold text-gradient-primary mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Have questions, feedback, or need support? Fill out the form below and our team will get back to you as soon as possible.
          </p>
        </div>

        {/* Contact Form Section */}
        <div className="relative glassmorphism-card p-8 border-primary-500/30">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Send Us a Message</h2>
            <p className="text-slate-300">We typically respond within 24 hours.</p>
          </div>
          <div className="w-full h-[850px]">
            <iframe
              src="https://api.leadconnectorhq.com/widget/form/sU8WwcBnlQpQg2IHowUN"
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
              id="inline-sU8WwcBnlQpQg2IHowUN"
              data-layout="{'id':'INLINE'}"
              data-trigger-type="alwaysShow"
              data-trigger-value=""
              data-activation-type="alwaysActivated"
              data-activation-value=""
              data-deactivation-type="neverDeactivate"
              data-deactivation-value=""
              data-form-name="Form 0"
              data-height="835"
              data-layout-iframe-id="inline-sU8WwcBnlQpQg2IHowUN"
              data-form-id="sU8WwcBnlQpQg2IHowUN"
              title="Contact Us Form"
              allowFullScreen
            ></iframe>
            {/* To enable the LeadConnector form, add the following script to your public/index.html: */}
            {/* <script src="https://link.msgsndr.com/js/form_embed.js"></script> */}
          </div>
        </div>

        {/* Contact Info */}
        <div className="text-center text-slate-400 text-sm">
          <p>Prefer email? Reach us at <a href="mailto:support@aidecktutor.com" className="text-blue-400 hover:underline">support@aidecktutor.com</a></p>
        </div>
      </div>
    </div>
  );
};

export default ContactPage; 