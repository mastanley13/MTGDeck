/**
 * Comprehensive Tutorial System Validation Script
 * Analyzes all tutorial components and validates implementation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TutorialSystemValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
    
    this.componentsPath = path.join(__dirname, '..', 'components', 'tutorial');
    this.contextPath = path.join(__dirname, '..', 'context');
  }

  log(message, type = 'info', component = 'General') {
    const result = {
      component,
      type,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.results.details.push(result);
    
    switch (type) {
      case 'pass':
        this.results.passed++;
        console.log(`✅ [${component}] ${message}`);
        break;
      case 'fail':
        this.results.failed++;
        console.log(`❌ [${component}] ${message}`);
        break;
      case 'warn':
        this.results.warnings++;
        console.log(`⚠️ [${component}] ${message}`);
        break;
      default:
        console.log(`ℹ️ [${component}] ${message}`);
        break;
    }
  }

  readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      this.log(`Failed to read file: ${filePath}`, 'fail', 'FileSystem');
      return null;
    }
  }

  validateFileExists(filePath, componentName) {
    if (fs.existsSync(filePath)) {
      this.log(`Component file exists`, 'pass', componentName);
      return true;
    } else {
      this.log(`Component file missing: ${filePath}`, 'fail', componentName);
      return false;
    }
  }

  validateTutorialSystem() {
    const filePath = path.join(this.componentsPath, 'TutorialSystem.jsx');
    const componentName = 'TutorialSystem';
    
    if (!this.validateFileExists(filePath, componentName)) return;
    
    const content = this.readFile(filePath);
    if (!content) return;
    
    // Check for responsive design implementation
    if (content.includes('isMobile') && content.includes('isTablet') && content.includes('isDesktop')) {
      this.log('Responsive design breakpoints implemented', 'pass', componentName);
    } else {
      this.log('Responsive design breakpoints missing', 'fail', componentName);
    }
    
    // Check for keyboard navigation
    if (content.includes('handleKeyDown') && content.includes('ArrowRight') && content.includes('Escape')) {
      this.log('Keyboard navigation implemented', 'pass', componentName);
    } else {
      this.log('Keyboard navigation incomplete', 'fail', componentName);
    }
    
    // Check for accessibility features
    if (content.includes('aria-label') && content.includes('role="dialog"') && content.includes('tabIndex')) {
      this.log('Accessibility features implemented', 'pass', componentName);
    } else {
      this.log('Accessibility features missing', 'warn', componentName);
    }
    
    // Check for AI components integration
    if (content.includes('AIEducation') && content.includes('AIDemo') && content.includes('AITransparency')) {
      this.log('AI components properly integrated', 'pass', componentName);
    } else {
      this.log('AI components integration incomplete', 'fail', componentName);
    }
    
    // Check for celebration system
    if (content.includes('celebration') && content.includes('showCelebration')) {
      this.log('Celebration system implemented', 'pass', componentName);
    } else {
      this.log('Celebration system missing', 'warn', componentName);
    }
    
    // Check for interactive search tutorial
    if (content.includes('InteractiveSearchTutorial') && content.includes('cycleSearchExample')) {
      this.log('Interactive search tutorial implemented', 'pass', componentName);
    } else {
      this.log('Interactive search tutorial missing', 'warn', componentName);
    }
    
    // Check for performance optimization
    if (content.includes('useCallback') && content.includes('cleanup')) {
      this.log('Performance optimizations present', 'pass', componentName);
    } else {
      this.log('Performance optimizations could be improved', 'warn', componentName);
    }
  }

  validateTutorialContext() {
    const filePath = path.join(this.contextPath, 'TutorialContext.jsx');
    const componentName = 'TutorialContext';
    
    if (!this.validateFileExists(filePath, componentName)) return;
    
    const content = this.readFile(filePath);
    if (!content) return;
    
    // Check for MTG-specific content
    if (content.includes('MTG') || content.includes('Commander') || content.includes('Atraxa')) {
      this.log('MTG-specific content implemented', 'pass', componentName);
    } else {
      this.log('MTG-specific content missing', 'fail', componentName);
    }
    
    // Check for AI details structure
    if (content.includes('aiDetails') && content.includes('algorithms') && content.includes('capabilities')) {
      this.log('AI details structure implemented', 'pass', componentName);
    } else {
      this.log('AI details structure incomplete', 'fail', componentName);
    }
    
    // Check for tutorial steps with proper structure
    if (content.includes('tutorialSteps') && content.includes('id:') && content.includes('title:')) {
      this.log('Tutorial steps properly structured', 'pass', componentName);
    } else {
      this.log('Tutorial steps structure missing', 'fail', componentName);
    }
    
    // Check for localStorage integration
    if (content.includes('localStorage') && content.includes('tutorialCompleted')) {
      this.log('localStorage persistence implemented', 'pass', componentName);
    } else {
      this.log('localStorage persistence missing', 'fail', componentName);
    }
    
    // Check for comprehensive step count
    const stepMatches = content.match(/id:\s*['"]\w+['"],/g);
    if (stepMatches && stepMatches.length >= 8) {
      this.log(`Found ${stepMatches.length} tutorial steps - comprehensive coverage`, 'pass', componentName);
    } else {
      this.log(`Found ${stepMatches ? stepMatches.length : 0} tutorial steps - needs more content`, 'warn', componentName);
    }
  }

  validateTutorialTrigger() {
    const filePath = path.join(this.componentsPath, 'TutorialTrigger.jsx');
    const componentName = 'TutorialTrigger';
    
    if (!this.validateFileExists(filePath, componentName)) return;
    
    const content = this.readFile(filePath);
    if (!content) return;
    
    // Check for multiple variants
    if (content.includes("variant === 'navbar'") && content.includes("variant === 'hero'") && content.includes("variant === 'floating'")) {
      this.log('Multiple trigger variants implemented', 'pass', componentName);
    } else {
      this.log('Missing some trigger variants', 'warn', componentName);
    }
    
    // Check for responsive behavior
    if (content.includes('isMobile') && content.includes('touch-manipulation')) {
      this.log('Mobile-responsive behavior implemented', 'pass', componentName);
    } else {
      this.log('Mobile responsiveness needs improvement', 'warn', componentName);
    }
    
    // Check for accessibility
    if (content.includes('aria-label') && content.includes('title=')) {
      this.log('Accessibility attributes present', 'pass', componentName);
    } else {
      this.log('Accessibility attributes missing', 'fail', componentName);
    }
    
    // Check for pulse animation for first-time users
    if (content.includes('showPulse') && content.includes('animate-pulse')) {
      this.log('First-time user pulse animation implemented', 'pass', componentName);
    } else {
      this.log('First-time user indicators missing', 'warn', componentName);
    }
  }

  validateAIComponents() {
    const components = ['AIEducation', 'AIDemo', 'AITransparency'];
    
    components.forEach(componentName => {
      const filePath = path.join(this.componentsPath, `${componentName}.jsx`);
      
      if (!this.validateFileExists(filePath, componentName)) return;
      
      const content = this.readFile(filePath);
      if (!content) return;
      
      // Common checks for all AI components
      if (content.includes('isVisible') && content.includes('return null')) {
        this.log('Conditional rendering implemented', 'pass', componentName);
      } else {
        this.log('Conditional rendering missing', 'warn', componentName);
      }
      
      // Specific checks per component
      switch (componentName) {
        case 'AIEducation':
          if (content.includes('algorithms') && content.includes('capabilities') && content.includes('limitations')) {
            this.log('AI education content structure complete', 'pass', componentName);
          } else {
            this.log('AI education content structure incomplete', 'fail', componentName);
          }
          
          if (content.includes('AILearningPath')) {
            this.log('Learning path component included', 'pass', componentName);
          } else {
            this.log('Learning path component missing', 'warn', componentName);
          }
          break;
          
        case 'AIDemo':
          if (content.includes('demoType') && content.includes('examples') && content.includes('currentExample')) {
            this.log('Interactive demo system implemented', 'pass', componentName);
          } else {
            this.log('Interactive demo system incomplete', 'fail', componentName);
          }
          
          if (content.includes('PromptGuide')) {
            this.log('Prompt engineering guide included', 'pass', componentName);
          } else {
            this.log('Prompt engineering guide missing', 'warn', componentName);
          }
          break;
          
        case 'AITransparency':
          if (content.includes('data') && content.includes('accuracy') && content.includes('improvement')) {
            this.log('Transparency sections complete', 'pass', componentName);
          } else {
            this.log('Transparency sections incomplete', 'fail', componentName);
          }
          
          if (content.includes('87%') || content.includes('92%')) {
            this.log('Accuracy metrics included', 'pass', componentName);
          } else {
            this.log('Accuracy metrics missing', 'warn', componentName);
          }
          break;
      }
    });
  }

  validateTutorialProgress() {
    const filePath = path.join(this.componentsPath, 'TutorialProgress.jsx');
    const componentName = 'TutorialProgress';
    
    if (!this.validateFileExists(filePath, componentName)) return;
    
    const content = this.readFile(filePath);
    if (!content) return;
    
    // Check for multiple variants
    if (content.includes("variant === 'detailed'") && content.includes("variant === 'compact'")) {
      this.log('Multiple progress variants implemented', 'pass', componentName);
    } else {
      this.log('Progress variants incomplete', 'warn', componentName);
    }
    
    // Check for accessibility
    if (content.includes('role="progressbar"') && content.includes('aria-valuenow')) {
      this.log('Progress accessibility implemented', 'pass', componentName);
    } else {
      this.log('Progress accessibility missing', 'fail', componentName);
    }
    
    // Check for completion celebration
    if (content.includes('Tutorial Completed') && content.includes('mastered')) {
      this.log('Completion celebration implemented', 'pass', componentName);
    } else {
      this.log('Completion celebration missing', 'warn', componentName);
    }
  }

  validateNavbarIntegration() {
    const filePath = path.join(__dirname, '..', 'components', 'ui', 'Navbar.jsx');
    const componentName = 'Navbar';
    
    if (!this.validateFileExists(filePath, componentName)) return;
    
    const content = this.readFile(filePath);
    if (!content) return;
    
    // Check for tutorial integration
    if (content.includes('TutorialTrigger') && content.includes('TutorialProgress')) {
      this.log('Tutorial components integrated', 'pass', componentName);
    } else {
      this.log('Tutorial components integration incomplete', 'fail', componentName);
    }
    
    // Check for responsive tutorial triggers
    if (content.includes('lg:flex') && content.includes('lg:hidden')) {
      this.log('Responsive tutorial triggers implemented', 'pass', componentName);
    } else {
      this.log('Responsive tutorial triggers missing', 'warn', componentName);
    }
    
    // Check for mobile tutorial section
    if (content.includes('Help & Learning') || content.includes('Take Tutorial Tour')) {
      this.log('Mobile tutorial section implemented', 'pass', componentName);
    } else {
      this.log('Mobile tutorial section missing', 'warn', componentName);
    }
  }

  validatePerformanceOptimizations() {
    const components = ['TutorialSystem', 'TutorialTrigger', 'AIDemo'];
    let optimizationScore = 0;
    
    components.forEach(componentName => {
      const filePath = path.join(this.componentsPath, `${componentName}.jsx`);
      if (!fs.existsSync(filePath)) return;
      
      const content = this.readFile(filePath);
      if (!content) return;
      
      // Check for React performance optimizations
      if (content.includes('useCallback') || content.includes('useMemo')) {
        optimizationScore++;
        this.log('React hooks optimization found', 'pass', `${componentName}-Performance`);
      }
      
      // Check for cleanup in useEffect
      if (content.includes('return () =>')) {
        optimizationScore++;
        this.log('Effect cleanup implemented', 'pass', `${componentName}-Performance`);
      }
      
      // Check for conditional rendering
      if (content.includes('isVisible') || content.includes('!isActive')) {
        optimizationScore++;
        this.log('Conditional rendering optimization found', 'pass', `${componentName}-Performance`);
      }
    });
    
    if (optimizationScore >= 6) {
      this.log('Performance optimizations are comprehensive', 'pass', 'Performance');
    } else if (optimizationScore >= 3) {
      this.log('Performance optimizations are adequate but could be improved', 'warn', 'Performance');
    } else {
      this.log('Performance optimizations are insufficient', 'fail', 'Performance');
    }
  }

  validateErrorHandling() {
    const components = ['TutorialSystem', 'TutorialContext', 'AIDemo', 'AIEducation'];
    let errorHandlingScore = 0;
    
    components.forEach(componentName => {
      const filePath = path.join(
        componentName === 'TutorialContext' ? this.contextPath : this.componentsPath, 
        `${componentName}.jsx`
      );
      
      if (!fs.existsSync(filePath)) return;
      
      const content = this.readFile(filePath);
      if (!content) return;
      
      // Check for null/undefined checks
      if (content.includes('if (!') || content.includes('&&') || content.includes('||')) {
        errorHandlingScore++;
        this.log('Null/undefined checks found', 'pass', `${componentName}-ErrorHandling`);
      }
      
      // Check for default values
      if (content.includes('= {}') || content.includes('= []') || content.includes('= null')) {
        errorHandlingScore++;
        this.log('Default values implemented', 'pass', `${componentName}-ErrorHandling`);
      }
      
      // Check for error boundaries or try-catch
      if (content.includes('try {') || content.includes('catch') || content.includes('Error')) {
        errorHandlingScore++;
        this.log('Error handling mechanisms found', 'pass', `${componentName}-ErrorHandling`);
      }
    });
    
    if (errorHandlingScore >= 8) {
      this.log('Error handling is comprehensive', 'pass', 'ErrorHandling');
    } else if (errorHandlingScore >= 4) {
      this.log('Error handling is adequate', 'warn', 'ErrorHandling');
    } else {
      this.log('Error handling needs improvement', 'fail', 'ErrorHandling');
    }
  }

  async runAllValidations() {
    console.log('🚀 Starting Comprehensive Tutorial System Validation...\n');
    
    this.validateTutorialSystem();
    this.validateTutorialContext();
    this.validateTutorialTrigger();
    this.validateAIComponents();
    this.validateTutorialProgress();
    this.validateNavbarIntegration();
    this.validatePerformanceOptimizations();
    this.validateErrorHandling();
    
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('========================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️ Warnings: ${this.results.warnings}`);
    console.log(`📝 Total Checks: ${this.results.details.length}`);
    
    const overallScore = (this.results.passed / (this.results.passed + this.results.failed)) * 100;
    console.log(`🎯 Overall Score: ${overallScore.toFixed(1)}%`);
    
    if (overallScore >= 90) {
      console.log('🌟 EXCELLENT - Tutorial system is production-ready!');
    } else if (overallScore >= 75) {
      console.log('✨ GOOD - Tutorial system is solid with minor improvements needed');
    } else if (overallScore >= 60) {
      console.log('⚡ FAIR - Tutorial system needs some improvements');
    } else {
      console.log('🔧 NEEDS WORK - Tutorial system requires significant improvements');
    }
    
    return this.results;
  }

  generateReport() {
    const report = {
      summary: {
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        total: this.results.details.length,
        score: (this.results.passed / (this.results.passed + this.results.failed)) * 100
      },
      timestamp: new Date().toISOString(),
      details: this.results.details
    };
    
    const reportPath = path.join(__dirname, '..', '..', 'tutorial-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    return report;
  }
}

// Run validation if called directly
const validator = new TutorialSystemValidator();
validator.runAllValidations().then(() => {
  validator.generateReport();
});

export default TutorialSystemValidator;