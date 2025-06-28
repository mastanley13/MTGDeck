import React from 'react';
import { IconCurrencyDollar, IconClock } from '@tabler/icons-react';

const PriceHistory = ({ deck }) => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-blue-500/10"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-primary-400 flex items-center space-x-2">
            <IconCurrencyDollar size={20} />
            <span>Price History</span>
          </h3>
        </div>

        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <IconClock size={32} className="text-primary-400" />
            </div>
            <h4 className="text-2xl font-bold text-white mb-4">Coming Soon</h4>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md mx-auto">
              Historical price tracking and trends will be available in a future update.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceHistory; 