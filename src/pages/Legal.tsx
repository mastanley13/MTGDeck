import React from 'react';
import { Helmet } from 'react-helmet-async';

const Legal = () => {
  return (
    <>
      <Helmet>
        <title>Legal Notice - AI Deck Tutor Fair Use Disclaimer</title>
        <meta name="description" content="Legal notice and fair use disclaimer for AI Deck Tutor. Learn about our compliance with Wizards of the Coast Fan Content Policy and third-party data sources." />
        <meta name="keywords" content="legal, disclaimer, fair use, MTG, Magic The Gathering, Wizards of the Coast, fan content" />
        <link rel="canonical" href="https://aidecktutor.com/legal" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Legal Notice - AI Deck Tutor Fair Use Disclaimer" />
        <meta property="og:description" content="Legal notice and fair use disclaimer for AI Deck Tutor. Learn about our compliance with Wizards of the Coast Fan Content Policy." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://aidecktutor.com/legal" />
        <meta property="og:image" content="https://storage.googleapis.com/msgsndr/zKZ8Zy6VvGR1m7lNfRkY/media/6830e4ad6417b23718765500.png" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Legal Notice - AI Deck Tutor Fair Use Disclaimer" />
        <meta name="twitter:description" content="Legal notice and fair use disclaimer for AI Deck Tutor." />
        <meta name="twitter:image" content="https://storage.googleapis.com/msgsndr/zKZ8Zy6VvGR1m7lNfRkY/media/6830e4ad6417b23718765500.png" />
      </Helmet>
      
      <div className="min-h-screen bg-slate-900">
        {/* Background effects */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mb-8">
              <img 
                src="https://storage.googleapis.com/msgsndr/zKZ8Zy6VvGR1m7lNfRkY/media/6830e4ad6417b23718765500.png"
                alt="AI Deck Tutor Logo"
                className="h-16 sm:h-20 mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-300 mb-6"
              />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gradient-primary mb-6">
              Legal Notice
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Fair Use Disclaimer for AI Deck Tutor
            </p>
          </div>

          {/* Legal Content */}
          <div className="glassmorphism-card p-8 border-slate-700/50">
            <div className="prose prose-slate prose-invert max-w-none">
              <h2 className="text-2xl font-bold text-white mb-6">Legal Notice & Fair‑Use Disclaimer for <strong>AI Deck Tutor</strong></h2>
              
              <div className="space-y-8">
                <section>
                  <h3 className="text-xl font-semibold text-primary-400 mb-4">1. Trademarks & Copyrights</h3>
                  <div className="text-slate-300 space-y-3">
                    <p>– <strong>MAGIC: THE GATHERING®</strong>, <strong>MTG®</strong>, all card names, card images, set names, and associated logos are trademarks and © 1993–2025 <strong>Wizards of the Coast LLC</strong>, a subsidiary of Hasbro, Inc. All rights reserved.</p>
                    <p>– <strong>AI Deck Tutor</strong> is <strong>not</strong> affiliated with, endorsed, sponsored, or specifically approved by Wizards of the Coast LLC or Hasbro, Inc.</p>
                    <p>– Any use of Wizards intellectual property on this site is permitted under Wizards' <em>Fan Content Policy</em>. For full details, see <a href="https://company.wizards.com/en/legal/fancontentpolicy" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300">https://company.wizards.com/en/legal/fancontentpolicy</a>.</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-primary-400 mb-4">2. Third‑Party Data Sources</h3>
                  <div className="text-slate-300 space-y-3">
                    <p>– Card images and Oracle text are provided courtesy of <strong>Scryfall</strong> (<a href="https://scryfall.com" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300">https://scryfall.com</a>) under the <em>Creative Commons BY‑NC 4.0</em> licence.</p>
                    <p>– Deck statistics and metagame data are aggregated from <strong>EDHREC</strong>, <strong>Archidekt</strong>, <strong>Moxfield</strong>, and other public APIs. These platforms are unaffiliated with Wizards of the Coast and with AI Deck Tutor.</p>
                    <p>– All trademarks, service marks, and other intellectual‑property rights referenced remain the property of their respective owners.</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-primary-400 mb-4">3. Purpose of Use</h3>
                  <div className="text-slate-300 space-y-3">
                    <p>Content on AI Deck Tutor is provided <strong>solely for educational, informational, and non‑commercial community purposes</strong>: helping players build, analyse, and enjoy Magic: The Gathering™ decks.</p>
                    <p>No portion of this site is intended to infringe upon or dilute any intellectual‑property rights. If you are a rights holder and believe your work is used improperly, contact us at <strong>support@aidecktutor.com</strong> for prompt resolution.</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-primary-400 mb-4">4. No Official Representation</h3>
                  <div className="text-slate-300 space-y-3">
                    <p>Opinions, analyses, and recommendations expressed on AI Deck Tutor are those of the site and its contributors, <strong>not</strong> Wizards of the Coast, Hasbro, Scryfall, EDHREC, Archidekt, or Moxfield.</p>
                    <p>Wizards of the Coast does <strong>not</strong> guarantee, approve, or authorise the operation or content of this website.</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-primary-400 mb-4">5. Fair‑Use Basis</h3>
                  <div className="text-slate-300 space-y-3">
                    <p>Card images, text excerpts, and statistical data are reproduced here in limited form under the principles of <strong>fair use</strong> (17 U.S.C. § 107) for commentary, research, and teaching within the Magic community.</p>
                    <p>All commercial rights to Wizards products are reserved to Wizards of the Coast LLC. AI Deck Tutor neither sells nor distributes official cards or digital objects.</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-primary-400 mb-4">6. Updates & Revisions</h3>
                  <div className="text-slate-300 space-y-3">
                    <p>This notice may be updated periodically to remain compliant with Wizards' Fan Content Policy, Scryfall's licensing terms, and other applicable laws. <em>Last updated 9 July 2025.</em></p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-primary-400 mb-4">7. Affiliate Disclosure</h3>
                  <div className="text-slate-300 space-y-3">
                    <p>AI Deck Tutor is a participant in the Amazon Services LLC Associates Program, TCGPlayer's affiliate program, and other affiliate programs. We may earn commissions on purchases made through our affiliate links.</p>
                  </div>
                </section>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-700/50 text-center">
                <p className="text-slate-400">
                  By using AI Deck Tutor you agree to these terms. Questions? <strong>support@aidecktutor.com</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Legal; 