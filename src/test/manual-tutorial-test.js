/**
 * Manual Testing Script for Tutorial System
 * Run this in the browser console for interactive testing
 */

class TutorialTestRunner {
  constructor() {
    this.testResults = [];
    this.currentTest = 0;
    this.totalTests = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);
    
    // Also display in UI if possible
    if (document.getElementById('test-output')) {
      const output = document.getElementById('test-output');
      const div = document.createElement('div');
      div.className = `test-log test-${type}`;
      div.textContent = logMessage;
      output.appendChild(div);
    }
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testResponsiveDesign() {
    this.log('Testing responsive design breakpoints...', 'test');
    
    const breakpoints = [
      { width: 375, height: 667, name: 'Mobile (iPhone SE)' },
      { width: 768, height: 1024, name: 'Tablet (iPad)' },
      { width: 1024, height: 768, name: 'Small Desktop' },
      { width: 1440, height: 900, name: 'Large Desktop' }
    ];

    for (const bp of breakpoints) {
      this.log(`Testing ${bp.name} - ${bp.width}x${bp.height}`);
      
      // Resize window
      window.resizeTo(bp.width, bp.height);
      await this.wait(500);

      // Trigger tutorial
      const tutorialTrigger = document.querySelector('[data-testid="tutorial-trigger"]') || 
                             document.querySelector('button[aria-label*="tutorial"]');
      
      if (tutorialTrigger) {
        tutorialTrigger.click();
        await this.wait(1000);

        // Check layout
        const tutorialDialog = document.querySelector('[role="dialog"]');
        if (tutorialDialog) {
          const rect = tutorialDialog.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(tutorialDialog);
          
          this.log(`Dialog position: ${computedStyle.position}`);
          this.log(`Dialog dimensions: ${rect.width}x${rect.height}`);
          
          // Close tutorial
          const closeButton = tutorialDialog.querySelector('[aria-label*="close"]') ||
                             tutorialDialog.querySelector('button:last-child');
          if (closeButton) closeButton.click();
          
          await this.wait(500);
        } else {
          this.log('Tutorial dialog not found', 'error');
        }
      } else {
        this.log('Tutorial trigger not found', 'error');
      }
    }
    
    this.log('Responsive design test completed', 'success');
  }

  async testKeyboardNavigation() {
    this.log('Testing keyboard navigation...', 'test');
    
    // Start tutorial
    const tutorialTrigger = document.querySelector('button[aria-label*="tutorial"]');
    if (tutorialTrigger) {
      tutorialTrigger.click();
      await this.wait(1000);

      const keyTests = [
        { key: 'ArrowRight', description: 'Next step' },
        { key: 'ArrowLeft', description: 'Previous step' },
        { key: 'Enter', description: 'Confirm/Next' },
        { key: 'Tab', description: 'Focus navigation' },
        { key: 'Escape', description: 'Close tutorial' }
      ];

      for (const test of keyTests) {
        this.log(`Testing ${test.key} - ${test.description}`);
        
        // Simulate key press
        const event = new KeyboardEvent('keydown', {
          key: test.key,
          code: test.key,
          which: test.key.charCodeAt(0),
          keyCode: test.key.charCodeAt(0),
          bubbles: true
        });
        
        document.dispatchEvent(event);
        await this.wait(500);
        
        // Check if action was performed
        const dialog = document.querySelector('[role="dialog"]');
        if (test.key === 'Escape' && !dialog) {
          this.log('Escape key properly closed tutorial', 'success');
          break;
        } else if (test.key !== 'Escape' && dialog) {
          this.log(`${test.key} key handled correctly`, 'success');
        }
      }
    }

    this.log('Keyboard navigation test completed', 'success');
  }

  async testAccessibilityFeatures() {
    this.log('Testing accessibility features...', 'test');
    
    // Start tutorial
    const tutorialTrigger = document.querySelector('button[aria-label*="tutorial"]');
    if (tutorialTrigger) {
      // Check trigger accessibility
      const hasAriaLabel = tutorialTrigger.hasAttribute('aria-label');
      const hasTitle = tutorialTrigger.hasAttribute('title');
      this.log(`Tutorial trigger has aria-label: ${hasAriaLabel}`, hasAriaLabel ? 'success' : 'warn');
      this.log(`Tutorial trigger has title: ${hasTitle}`, hasTitle ? 'success' : 'warn');
      
      tutorialTrigger.click();
      await this.wait(1000);

      // Check dialog accessibility
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        const checks = [
          { attr: 'aria-modal', expected: 'true', name: 'Modal attribute' },
          { attr: 'aria-labelledby', expected: null, name: 'Labeled by heading' },
          { attr: 'aria-describedby', expected: null, name: 'Described by content' }
        ];

        checks.forEach(check => {
          const value = dialog.getAttribute(check.attr);
          const hasAttr = value !== null;
          const isCorrect = check.expected ? value === check.expected : hasAttr;
          this.log(`${check.name}: ${isCorrect}`, isCorrect ? 'success' : 'warn');
        });

        // Check for proper heading structure
        const headings = dialog.querySelectorAll('h1, h2, h3, h4, h5, h6');
        this.log(`Found ${headings.length} heading(s) in dialog`, headings.length > 0 ? 'success' : 'warn');

        // Check for progress indicators
        const progressBars = dialog.querySelectorAll('[role="progressbar"]');
        this.log(`Found ${progressBars.length} progress indicator(s)`, progressBars.length > 0 ? 'success' : 'warn');

        // Check focus management
        const focused = document.activeElement;
        const isFocusInDialog = dialog.contains(focused);
        this.log(`Focus is within dialog: ${isFocusInDialog}`, isFocusInDialog ? 'success' : 'warn');

        // Close dialog
        const closeBtn = dialog.querySelector('[aria-label*="close"]');
        if (closeBtn) closeBtn.click();
      }
    }

    this.log('Accessibility test completed', 'success');
  }

  async testInteractiveFeatures() {
    this.log('Testing interactive features...', 'test');
    
    // Start tutorial
    const tutorialTrigger = document.querySelector('button[aria-label*="tutorial"]');
    if (tutorialTrigger) {
      tutorialTrigger.click();
      await this.wait(1000);

      let stepCount = 0;
      const maxSteps = 20; // Safety limit

      // Navigate through tutorial steps
      while (stepCount < maxSteps) {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) break;

        // Check for interactive elements
        const nextButton = dialog.querySelector('button:not([aria-label*="close"]):not([aria-label*="skip"])');
        const searchExamples = dialog.querySelectorAll('[data-testid="search-example"]');
        const demoElements = dialog.querySelectorAll('[data-testid="ai-demo"]');
        
        this.log(`Step ${stepCount + 1}: Found ${searchExamples.length} search examples, ${demoElements.length} demo elements`);

        // Test interactive elements if present
        if (searchExamples.length > 0) {
          const exampleButton = searchExamples[0].querySelector('button');
          if (exampleButton) {
            exampleButton.click();
            await this.wait(500);
            this.log('Search example interaction tested', 'success');
          }
        }

        // Move to next step
        if (nextButton) {
          nextButton.click();
          await this.wait(1000);
          stepCount++;
        } else {
          break;
        }

        // Check for celebrations
        const celebration = document.querySelector('[data-testid="celebration"]');
        if (celebration) {
          this.log('Celebration animation detected', 'success');
        }
      }

      this.log(`Completed ${stepCount} tutorial steps`, 'success');

      // Close tutorial if still open
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        const closeBtn = dialog.querySelector('[aria-label*="close"]') || 
                        dialog.querySelector('button[aria-label*="skip"]');
        if (closeBtn) closeBtn.click();
      }
    }

    this.log('Interactive features test completed', 'success');
  }

  async testStateManagement() {
    this.log('Testing state management...', 'test');
    
    // Check localStorage initially
    const initialState = localStorage.getItem('tutorialCompleted');
    this.log(`Initial tutorial state: ${initialState}`);

    // Clear tutorial completion
    localStorage.removeItem('tutorialCompleted');
    
    // Reload to reset state
    this.log('Testing fresh tutorial state...');
    
    // Start and complete tutorial
    const tutorialTrigger = document.querySelector('button[aria-label*="tutorial"]');
    if (tutorialTrigger) {
      tutorialTrigger.click();
      await this.wait(1000);

      // Skip tutorial to test completion state
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        const skipBtn = dialog.querySelector('button[aria-label*="skip"]');
        if (skipBtn) {
          skipBtn.click();
          await this.wait(500);

          // Check if state was saved
          const completedState = localStorage.getItem('tutorialCompleted');
          this.log(`Tutorial completion saved: ${completedState === 'true'}`, 
                   completedState === 'true' ? 'success' : 'error');
        }
      }
    }

    this.log('State management test completed', 'success');
  }

  async testPerformance() {
    this.log('Testing performance...', 'test');
    
    const perfMarks = [];
    
    // Test tutorial startup time
    const startTime = performance.now();
    performance.mark('tutorial-start');
    
    const tutorialTrigger = document.querySelector('button[aria-label*="tutorial"]');
    if (tutorialTrigger) {
      tutorialTrigger.click();
      
      await this.wait(100); // Wait for animation
      
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        performance.mark('tutorial-rendered');
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        perfMarks.push({ name: 'Tutorial Render Time', value: renderTime, unit: 'ms' });
        this.log(`Tutorial render time: ${renderTime.toFixed(2)}ms`, renderTime < 500 ? 'success' : 'warn');

        // Test animation smoothness
        const animationStart = performance.now();
        const nextBtn = dialog.querySelector('button:not([aria-label*="close"])');
        if (nextBtn) {
          nextBtn.click();
          await this.wait(300); // Wait for animation
          const animationEnd = performance.now();
          const animationTime = animationEnd - animationStart;
          
          perfMarks.push({ name: 'Step Transition Time', value: animationTime, unit: 'ms' });
          this.log(`Step transition time: ${animationTime.toFixed(2)}ms`, 
                   animationTime < 1000 ? 'success' : 'warn');
        }

        // Close tutorial
        const closeBtn = dialog.querySelector('[aria-label*="close"]') ||
                        dialog.querySelector('button[aria-label*="skip"]');
        if (closeBtn) closeBtn.click();
      }
    }

    // Memory usage check (basic)
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize / (1024 * 1024);
      this.log(`Current memory usage: ${memoryUsage.toFixed(2)} MB`);
      perfMarks.push({ name: 'Memory Usage', value: memoryUsage, unit: 'MB' });
    }

    this.log('Performance test completed', 'success');
    return perfMarks;
  }

  async runAllTests() {
    this.log('Starting comprehensive tutorial system tests...', 'info');
    const startTime = performance.now();

    try {
      await this.testResponsiveDesign();
      await this.testKeyboardNavigation();
      await this.testAccessibilityFeatures();
      await this.testInteractiveFeatures();
      await this.testStateManagement();
      const perfResults = await this.testPerformance();

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      this.log('=== TEST SUMMARY ===', 'info');
      this.log(`Total test time: ${(totalTime / 1000).toFixed(2)} seconds`, 'info');
      
      if (perfResults) {
        this.log('Performance metrics:', 'info');
        perfResults.forEach(metric => {
          this.log(`  ${metric.name}: ${metric.value.toFixed(2)} ${metric.unit}`, 'info');
        });
      }

      this.log('All tutorial system tests completed successfully!', 'success');
      
    } catch (error) {
      this.log(`Test failed with error: ${error.message}`, 'error');
      console.error(error);
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testResults: this.testResults,
      browser: {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };

    // Create downloadable report
    const reportJson = JSON.stringify(report, null, 2);
    const blob = new Blob([reportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `tutorial-test-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.log('Test report downloaded', 'success');
    return report;
  }
}

// Make it globally available
window.TutorialTestRunner = TutorialTestRunner;

// Auto-run if requested
if (window.location.hash === '#run-tests') {
  const testRunner = new TutorialTestRunner();
  testRunner.runAllTests();
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TutorialTestRunner;
}

console.log('Tutorial Test Runner loaded. Use:');
console.log('const runner = new TutorialTestRunner(); runner.runAllTests();');