import React from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement 
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { analyzeDeck } from '../../utils/deckAnalytics';
import ManaSymbolSVG from '../ui/ManaSymbolSVG';
// Tabler Icons
import { 
  IconCards, 
  IconCrown, 
  IconBolt, 
  IconPalette, 
  IconChartBar, 
  IconChartPie, 
  IconClipboardList, 
  IconSearch,
  IconTrendingUp,
  IconAlertTriangle,
  IconInfoCircle,
  IconCheck
} from '@tabler/icons-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Modern MTG color palette matching the site theme
const MODERN_CHART_COLORS = {
  W: '#f8fafc', // Clean white
  U: '#3b82f6', // Modern blue (matches primary-500)
  B: '#1e293b', // Dark slate
  R: '#ef4444', // Modern red
  G: '#10b981', // Emerald green
  Colorless: '#94a3b8', // Slate gray
  // Card types with site's color scheme
  Creature: '#3b82f6',     // Primary blue
  Instant: '#06b6d4',      // Cyan
  Sorcery: '#8b5cf6',      // Purple
  Artifact: '#94a3b8',     // Slate
  Enchantment: '#10b981',  // Emerald
  Planeswalker: '#f59e0b', // Amber
  Land: '#6b7280',         // Gray
  Other: '#64748b',        // Slate gray
};

const StatCard = ({ title, value, subtitle, icon, gradient = false }) => (
  <div className={`relative overflow-hidden rounded-xl border border-slate-700/50 p-6 transition-all duration-300 hover:scale-105 hover:border-primary-500/50 ${
    gradient 
      ? 'bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80' 
      : 'bg-slate-800/50'
  } backdrop-blur-sm shadow-lg hover:shadow-xl`}>
    {/* Animated background glow */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
    
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="text-slate-400 text-sm font-medium uppercase tracking-wide">{title}</div>
        {icon && <div className="text-primary-400 opacity-70">{icon}</div>}
      </div>
      <div className={`text-3xl font-bold mb-1 ${gradient ? 'bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent' : 'text-white'}`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-slate-400 text-sm">{subtitle}</div>
      )}
    </div>
  </div>
);

const ManaCurveChart = ({ manaCurve }) => {
  const labels = Object.keys(manaCurve).map(cmc => cmc === '7' ? '7+' : cmc);
  const totalNonLandCards = Object.values(manaCurve).reduce((sum, count) => sum + count, 0);
  
  const data = {
    labels,
    datasets: [
      {
        label: 'Number of Cards',
        data: Object.values(manaCurve),
        backgroundColor: 'rgba(59, 130, 246, 0.8)', // Primary blue with opacity
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Mana Curve (Non-Land Cards)',
        color: '#e2e8f0', // slate-200
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)', // slate-900 with opacity
        titleColor: '#e2e8f0',
        bodyColor: '#cbd5e1',
        borderColor: '#3b82f6',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(context) {
            const cmc = context[0].label;
            return `CMC ${cmc}`;
          },
          label: function(context) {
            const count = context.parsed.y;
            const percentage = totalNonLandCards > 0 ? ((count / totalNonLandCards) * 100).toFixed(1) : 0;
            return `${count} cards (${percentage}% of non-lands)`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Converted Mana Cost',
          color: '#94a3b8',
          font: { weight: '500' }
        },
        ticks: { 
          color: '#94a3b8', // slate-400
          font: { weight: '500' }
        },
        grid: { 
          color: 'rgba(71, 85, 105, 0.3)', // slate-600 with opacity
          drawBorder: false,
        },
        border: { display: false }
      },
      y: {
        title: {
          display: true,
          text: 'Number of Cards',
          color: '#94a3b8',
          font: { weight: '500' }
        },
        ticks: { 
          color: '#94a3b8', // slate-400
          font: { weight: '500' },
          stepSize: 1
        },
        grid: { 
          color: 'rgba(71, 85, 105, 0.3)', // slate-600 with opacity
          drawBorder: false,
        },
        border: { display: false }
      }
    }
  };

  return (
    <div className="h-64">
      <Bar data={data} options={options} />
    </div>
  );
};

const ColorDistributionChart = ({ colorDistribution }) => {
  // Remove colors with 0 cards
  const filteredColors = {};
  Object.entries(colorDistribution).forEach(([color, count]) => {
    if (count > 0) {
      filteredColors[color] = count;
    }
  });

  if (Object.keys(filteredColors).length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <div className="text-center">
          <IconChartPie size={48} className="mx-auto mb-2 opacity-50" />
          <div>No colors to analyze</div>
        </div>
      </div>
    );
  }

  const totalCards = Object.values(filteredColors).reduce((sum, count) => sum + count, 0);

  const data = {
    labels: Object.keys(filteredColors).map(color => {
      const colorNames = {
        W: 'White',
        U: 'Blue', 
        B: 'Black',
        R: 'Red',
        G: 'Green',
        Colorless: 'Colorless'
      };
      return colorNames[color] || color;
    }),
    datasets: [
      {
        data: Object.values(filteredColors),
        backgroundColor: Object.keys(filteredColors).map(color => MODERN_CHART_COLORS[color] || '#64748b'),
        borderColor: '#1e293b',
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverBorderColor: '#3b82f6',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // We'll create a custom legend
      },
      title: {
        display: true,
        text: 'Color Distribution',
        color: '#e2e8f0',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#e2e8f0',
        bodyColor: '#cbd5e1',
        borderColor: '#3b82f6',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const count = context.parsed;
            const percentage = ((count / totalCards) * 100).toFixed(1);
            return `${context.label}: ${count} cards (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className="h-64 relative">
      <div className="h-48">
        <Pie data={data} options={options} />
      </div>
      {/* Custom Legend with Mana Symbols */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-2 pt-2">
        {Object.entries(filteredColors).map(([color, count]) => {
          const percentage = ((count / totalCards) * 100).toFixed(0);
          return (
            <div key={color} className="flex items-center space-x-1 bg-slate-700/50 rounded-lg px-2 py-1">
              {color !== 'Colorless' ? (
                <ManaSymbolSVG symbol={`{${color}}`} size="xs" />
              ) : (
                <ManaSymbolSVG symbol="{C}" size="xs" />
              )}
              <span className="text-xs font-medium text-slate-300">
                {count} ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CardTypeChart = ({ typeBreakdown }) => {
  // Remove types with 0 cards
  const filteredTypes = {};
  Object.entries(typeBreakdown).forEach(([type, count]) => {
    if (count > 0) {
      filteredTypes[type] = count;
    }
  });

  if (Object.keys(filteredTypes).length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <div className="text-center">
          <IconCards size={48} className="mx-auto mb-2 opacity-50" />
          <div>No card types to analyze</div>
        </div>
      </div>
    );
  }

  const totalCards = Object.values(filteredTypes).reduce((sum, count) => sum + count, 0);

  const data = {
    labels: Object.keys(filteredTypes),
    datasets: [
      {
        data: Object.values(filteredTypes),
        backgroundColor: Object.keys(filteredTypes).map(type => MODERN_CHART_COLORS[type] || '#64748b'),
        borderColor: '#1e293b',
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverBorderColor: '#3b82f6',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Custom legend below
      },
      title: {
        display: true,
        text: 'Card Type Breakdown',
        color: '#e2e8f0',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#e2e8f0',
        bodyColor: '#cbd5e1',
        borderColor: '#3b82f6',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const count = context.parsed;
            const percentage = ((count / totalCards) * 100).toFixed(1);
            return `${context.label}: ${count} cards (${percentage}%)`;
          }
        }
      }
    },
  };

  // Get type icons for different card types
  const getTypeIcon = (type) => {
    const iconMap = {
      'Creature': '👹',
      'Instant': '⚡',
      'Sorcery': '🌟',
      'Artifact': '⚙️',
      'Enchantment': '✨',
      'Planeswalker': '👑',
      'Land': '🏞️',
      'Other': '❓'
    };
    return iconMap[type] || '❓';
  };

  return (
    <div className="h-64 relative">
      <div className="h-48">
        <Pie data={data} options={options} />
      </div>
      {/* Custom Legend with Icons and Percentages */}
      <div className="absolute bottom-0 left-0 right-0 grid grid-cols-2 gap-1 pt-2 text-xs">
        {Object.entries(filteredTypes)
          .sort(([,a], [,b]) => b - a) // Sort by count descending
          .slice(0, 6) // Show top 6 types
          .map(([type, count]) => {
            const percentage = ((count / totalCards) * 100).toFixed(0);
            return (
              <div key={type} className="flex items-center space-x-1 bg-slate-700/30 rounded px-1 py-0.5">
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: MODERN_CHART_COLORS[type] || '#64748b' }}
                ></div>
                <span className="text-xs font-medium text-slate-300 truncate">
                  {type}: {count} ({percentage}%)
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
};

const ColorIdentityDisplay = ({ colorDistribution }) => {
  const colors = ['W', 'U', 'B', 'R', 'G'];
  const hasColors = colors.filter(color => colorDistribution[color] > 0);
  
  if (hasColors.length === 0 && colorDistribution.Colorless === 0) {
    return <span className="text-slate-400">No colors</span>;
  }

  return (
    <div className="flex items-center space-x-2 flex-wrap">
      {hasColors.map(color => (
        <div key={color} className="flex items-center space-x-1 bg-slate-700/50 rounded-lg px-2 py-1 mb-1">
          <ManaSymbolSVG symbol={`{${color}}`} size="sm" />
          <span className="text-xs font-medium text-slate-300">{colorDistribution[color]}</span>
        </div>
      ))}
      {colorDistribution.Colorless > 0 && (
        <div className="flex items-center space-x-1 bg-slate-700/50 rounded-lg px-2 py-1 mb-1">
          <ManaSymbolSVG symbol="{C}" size="sm" />
          <span className="text-xs font-medium text-slate-300">{colorDistribution.Colorless}</span>
        </div>
      )}
    </div>
  );
};

const DeckInsights = ({ analysis }) => {
  const insights = [];
  
  // Calculate non-land cards for mana curve analysis
  const nonLandCards = analysis.totalCards - (analysis.typeBreakdown.Land || 0);
  const landCount = analysis.typeBreakdown.Land || 0;
  
  // Mana curve analysis
  const peakCMC = Object.entries(analysis.manaCurve).reduce((a, b) => 
    analysis.manaCurve[a[0]] > analysis.manaCurve[b[0]] ? a : b
  );
  
  // Land count insight
  if (landCount > 0) {
    const landPercentage = ((landCount / analysis.totalCards) * 100).toFixed(0);
    if (landCount < 30) {
      insights.push({
        type: 'warning',
        title: 'Low land count',
        description: `${landCount} lands (${landPercentage}%) may cause mana issues`,
        icon: <IconAlertTriangle size={20} />
      });
    } else if (landCount > 40) {
      insights.push({
        type: 'info',
        title: 'High land count',
        description: `${landCount} lands (${landPercentage}%) - very stable mana base`,
        icon: <IconInfoCircle size={20} />
      });
    } else {
      insights.push({
        type: 'success',
        title: 'Good land ratio',
        description: `${landCount} lands (${landPercentage}%) provides stable mana`,
        icon: <IconCheck size={20} />
      });
    }
  }
  
  if (analysis.averageCMC > 4) {
    insights.push({
      type: 'warning',
      title: 'High mana curve',
      description: `Average CMC of ${analysis.averageCMC} may slow down your deck`,
      icon: <IconAlertTriangle size={20} />
    });
  } else if (analysis.averageCMC < 2.5) {
    insights.push({
      type: 'info',
      title: 'Low mana curve',
      description: `Average CMC of ${analysis.averageCMC} allows for fast plays`,
      icon: <IconTrendingUp size={20} />
    });
  } else {
    insights.push({
      type: 'success',
      title: 'Balanced mana curve',
      description: `Average CMC of ${analysis.averageCMC} is well-positioned`,
      icon: <IconCheck size={20} />
    });
  }

  // Color distribution analysis
  const colorCount = Object.values(analysis.colorDistribution).filter(count => count > 0).length;
  if (colorCount > 3) {
    insights.push({
      type: 'warning',
      title: 'Complex mana base',
      description: `${colorCount} colors may require careful mana fixing`,
      icon: <IconAlertTriangle size={20} />
    });
  } else if (colorCount === 1) {
    insights.push({
      type: 'success',
      title: 'Mono-colored deck',
      description: 'Simple and consistent mana requirements',
      icon: <IconCheck size={20} />
    });
  }

  // Card type analysis
  const creaturePercentage = (analysis.typeBreakdown.Creature / nonLandCards) * 100;
  if (creaturePercentage < 20) {
    insights.push({
      type: 'info',
      title: 'Spell-heavy deck',
      description: `Only ${Math.round(creaturePercentage)}% creatures - ensure win conditions`,
      icon: <IconInfoCircle size={20} />
    });
  } else if (creaturePercentage > 50) {
    insights.push({
      type: 'success',
      title: 'Creature-focused',
      description: `${Math.round(creaturePercentage)}% creatures provide strong board presence`,
      icon: <IconCheck size={20} />
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
        <IconSearch size={24} />
        <span>Deck Insights</span>
      </h3>
      
      {/* Summary Stats */}
      <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
        <div className="text-sm text-slate-300">
          <div className="flex justify-between">
            <span>Non-land cards:</span>
            <span className="font-medium">{nonLandCards}</span>
          </div>
          <div className="flex justify-between">
            <span>Lands (excluded from curve):</span>
            <span className="font-medium">{landCount}</span>
          </div>
        </div>
      </div>
      
      {insights.length > 0 ? (
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div key={index} className={`p-3 rounded-lg border-l-4 flex items-start space-x-3 ${
              insight.type === 'warning' ? 'bg-amber-500/10 border-amber-500 text-amber-100' :
              insight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-100' :
              'bg-blue-500/10 border-blue-500 text-blue-100'
            }`}>
              <div className="flex-shrink-0 mt-0.5">
                {insight.icon}
              </div>
              <div>
                <div className="font-medium">{insight.title}</div>
                <div className="text-sm opacity-90">{insight.description}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-slate-400 text-center py-4">
          <IconCheck size={48} className="mx-auto mb-2 opacity-50" />
          <div>Deck looks well balanced!</div>
        </div>
      )}
    </div>
  );
};

const DeckAnalytics = ({ deck }) => {
  if (!deck || !deck.cards || deck.cards.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80 backdrop-blur-sm shadow-xl p-8">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5"></div>
        
        <div className="relative z-10 text-center">
          <IconChartBar size={64} className="mx-auto mb-4 text-primary-400 opacity-50" />
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
            Deck Analytics
          </h2>
          <p className="text-slate-400 text-lg">
            Add cards to your deck to see detailed analytics and insights.
          </p>
        </div>
      </div>
    );
  }

  const analysis = analyzeDeck(deck);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary-400 via-blue-400 to-primary-500 bg-clip-text text-transparent flex items-center justify-center space-x-3">
          <IconChartBar size={32} className="text-primary-400" />
          <span>Deck Analytics</span>
        </h2>
        <p className="text-slate-400">
          Comprehensive analysis and insights for your deck
        </p>
      </div>

      {/* Key Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Cards"
          value={analysis.totalCards}
          subtitle="cards in deck"
          icon={<IconCards size={24} />}
          gradient={true}
        />
        
        <StatCard
          title="Commander"
          value={analysis.commander || 'None'}
          subtitle="deck leader"
          icon={<IconCrown size={24} />}
        />
        
        <StatCard
          title="Average CMC"
          value={analysis.averageCMC}
          subtitle="mana cost average"
          icon={<IconBolt size={24} />}
          gradient={true}
        />
        
        <StatCard
          title="Color Identity"
          value={
            <div className="mt-2">
              <ColorIdentityDisplay colorDistribution={analysis.colorDistribution} />
            </div>
          }
          subtitle="deck colors"
          icon={<IconPalette size={24} />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5"></div>
          <div className="relative z-10">
            <ManaCurveChart manaCurve={analysis.manaCurve} />
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5"></div>
          <div className="relative z-10">
            <ColorDistributionChart colorDistribution={analysis.colorDistribution} />
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5"></div>
          <div className="relative z-10">
            <CardTypeChart typeBreakdown={analysis.typeBreakdown} />
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card Type Details */}
        <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5"></div>
          <div className="relative z-10">
            <h3 className="text-lg font-semibold text-primary-400 mb-4 flex items-center space-x-2">
              <IconClipboardList size={24} />
              <span>Card Type Distribution</span>
            </h3>
            <div className="space-y-3">
              {Object.entries(analysis.typeBreakdown)
                .filter(([_, count]) => count > 0)
                .sort(([,a], [,b]) => b - a)
                .map(([type, count]) => {
                  const percentage = ((count / analysis.totalCards) * 100).toFixed(1);
                  return (
                    <div key={type} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: MODERN_CHART_COLORS[type] || '#64748b' }}
                        ></div>
                        <span className="font-medium text-slate-200">{type}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">{count}</div>
                        <div className="text-xs text-slate-400">{percentage}%</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-blue-500/5"></div>
          <div className="relative z-10">
            <DeckInsights analysis={analysis} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckAnalytics; 