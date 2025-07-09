import React from 'react';

/**
 * Component to display validation results and applied fixes from the AI deck builder
 */
const ValidationSummary = ({ violations, appliedFixes, isVisible }) => {
  if (!isVisible || (!violations?.length && !appliedFixes?.length)) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
      <div className="flex items-center space-x-2 mb-4">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h4 className="text-sm font-semibold text-white">AI Validation & Fixes</h4>
      </div>

      {violations && violations.length > 0 && (
        <div className="mb-4">
          <h5 className="text-xs font-medium text-slate-400 mb-2">Issues Found:</h5>
          <div className="space-y-2">
            {violations.map((violation, index) => (
              <div key={index} className="flex items-start space-x-2 text-xs">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  violation.severity === 'critical' ? 'bg-red-400' : 
                  violation.severity === 'moderate' ? 'bg-yellow-400' : 'bg-blue-400'
                }`}></div>
                <div className="flex-1">
                  <span className="text-slate-300 font-medium">{violation.card}</span>
                  <span className="text-slate-400 ml-2">- {violation.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {appliedFixes && appliedFixes.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-slate-400 mb-2">Smart Replacements Applied:</h5>
          <div className="space-y-2">
            {appliedFixes.map((fix, index) => (
              <div key={index} className="flex items-start space-x-2 text-xs">
                <div className="w-2 h-2 rounded-full mt-1.5 bg-green-400"></div>
                <div className="flex-1">
                  <span className="text-red-300 line-through">{fix.original_card}</span>
                  <span className="text-slate-400 mx-2">→</span>
                  <span className="text-green-300 font-medium">{fix.replacement_card}</span>
                  {fix.synergy_score && (
                    <span className="text-blue-400 ml-2">
                      (Synergy: {fix.synergy_score}/10)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-700/50">
        <p className="text-xs text-slate-400 text-center">
          AI validation ensures your deck is Commander-legal and optimally synergistic
        </p>
      </div>
    </div>
  );
};

export default ValidationSummary; 