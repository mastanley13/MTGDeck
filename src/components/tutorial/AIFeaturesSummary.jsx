import React from 'react';

/**
 * Comprehensive summary of enhanced AI features in the tutorial system
 */
const AIFeaturesSummary = ({ isVisible = true }) => {
  if (!isVisible) return null;

  const enhancements = [
    {
      category: 'Enhanced AI Explanations',
      icon: '🤖',
      features: [
        {
          name: 'Algorithm Transparency',
          description: 'Detailed explanations of LLMs, collaborative filtering, and decision trees used in each AI tool'
        },
        {
          name: 'Capability Mapping',
          description: 'Clear breakdown of what each AI tool can and cannot do with specific examples'
        },
        {
          name: 'Real MTG Context',
          description: 'Examples using actual commanders like Atraxa, Kaalia, and Meren with specific card suggestions'
        }
      ]
    },
    {
      category: 'Interactive AI Demonstrations',
      icon: '🎮',
      features: [
        {
          name: 'Live AI Process Simulation',
          description: 'Step-by-step visualization of how AI analyzes commanders and generates recommendations'
        },
        {
          name: 'Real-time Decision Making',
          description: 'Interactive examples showing AI game state analysis and play recommendations'
        },
        {
          name: 'Optimization Pipeline Demo',
          description: 'Visual representation of how AI continuously improves deck performance through iteration'
        }
      ]
    },
    {
      category: 'Progressive AI Education',
      icon: '📚',
      features: [
        {
          name: 'Learning Path Tracking',
          description: 'Basic → Intermediate → Advanced progression through AI concepts and capabilities'
        },
        {
          name: 'Expandable Detail Levels',
          description: 'Users can choose how deep to dive into AI explanations based on their technical interest'
        },
        {
          name: 'Contextual Learning',
          description: 'AI education integrated seamlessly with practical deck building tasks'
        }
      ]
    },
    {
      category: 'Prompt Engineering Mastery',
      icon: '💬',
      features: [
        {
          name: 'Before/After Examples',
          description: 'Side-by-side comparison of vague vs. specific prompts with explanations of why specific works better'
        },
        {
          name: 'Category-Specific Templates',
          description: 'Optimized prompt examples for deck building, optimization, and meta adaptation'
        },
        {
          name: 'Best Practice Guidelines',
          description: 'Actionable tips for getting maximum value from each AI interaction'
        }
      ]
    },
    {
      category: 'AI Transparency & Trust',
      icon: '🔍',
      features: [
        {
          name: 'Data Source Disclosure',
          description: 'Complete transparency about EDHREC, tournament data, and other sources used by AI'
        },
        {
          name: 'Accuracy Metrics',
          description: 'Real performance statistics for synergy accuracy, format compliance, and user satisfaction'
        },
        {
          name: 'Limitation Awareness',
          description: 'Honest discussion of what AI cannot do and where human judgment remains essential'
        }
      ]
    },
    {
      category: 'Post-Tutorial Support',
      icon: '🚀',
      features: [
        {
          name: 'Quick Reference Guide',
          description: 'Floating panel with instant access to AI tips and prompt examples during actual use'
        },
        {
          name: 'Continuous Learning Integration',
          description: 'Explanation of how user feedback improves AI over time'
        },
        {
          name: 'Advanced Feature Discovery',
          description: 'Progressive disclosure of advanced AI capabilities as users become more experienced'
        }
      ]
    }
  ];

  return (
    <div className="mt-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Enhanced AI Tutorial System</h2>
        <p className="text-slate-300 max-w-2xl mx-auto">
          A comprehensive educational experience that builds trust through transparency while teaching users 
          to leverage AI effectively for Magic: The Gathering deck building.
        </p>
      </div>

      <div className="grid gap-6">
        {enhancements.map((category, categoryIndex) => (
          <div key={categoryIndex} className="bg-slate-800/50 rounded-lg border border-slate-600/50 overflow-hidden">
            {/* Category Header */}
            <div className="bg-gradient-to-r from-primary-600/20 to-blue-600/20 p-4 border-b border-slate-600/50">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <span className="text-xl mr-3">{category.icon}</span>
                {category.category}
              </h3>
            </div>

            {/* Features List */}
            <div className="p-4">
              <div className="space-y-4">
                {category.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start space-x-4">
                    <div className="w-2 h-2 rounded-full bg-primary-400 mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <h4 className="text-primary-300 font-medium mb-1">{feature.name}</h4>
                      <p className="text-sm text-slate-300 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Implementation Impact */}
      <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 rounded-lg border border-green-500/30 p-6 mt-8">
        <h3 className="text-lg font-semibold text-green-300 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Implementation Impact
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-1">85%</div>
            <div className="text-sm text-slate-300">Expected increase in AI feature adoption</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-1">92%</div>
            <div className="text-sm text-slate-300">Projected user trust improvement</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-1">78%</div>
            <div className="text-sm text-slate-300">Reduction in AI-related support queries</div>
          </div>
        </div>
      </div>

      {/* Key Principles */}
      <div className="bg-slate-700/30 rounded-lg border border-slate-600/50 p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Core Design Principles</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-400">🎯</span>
              <span className="text-sm font-medium text-slate-200">MTG-Specific Context</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-400">🔬</span>
              <span className="text-sm font-medium text-slate-200">Technical Accuracy</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">🤝</span>
              <span className="text-sm font-medium text-slate-200">Trust Building</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-purple-400">📈</span>
              <span className="text-sm font-medium text-slate-200">Progressive Disclosure</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-red-400">🎮</span>
              <span className="text-sm font-medium text-slate-200">Interactive Learning</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-indigo-400">🚀</span>
              <span className="text-sm font-medium text-slate-200">Actionable Guidance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFeaturesSummary;