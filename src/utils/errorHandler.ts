/**
 * Global error handler to suppress non-critical errors from browser extensions
 */
const setupErrorHandling = () => {
  if (typeof window === 'undefined') return;

  // Store original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  // List of error patterns to ignore
  const IGNORED_ERRORS = [
    'share-modal.js',
    'The message port closed before a response was received',
    'Failed to load resource: net::ERR_BLOCKED_BY_CLIENT',
  ];

  // Override console.error
  console.error = (...args: any[]) => {
    const errorString = args.join(' ');
    
    // Check if this is an error we want to ignore
    const shouldIgnore = IGNORED_ERRORS.some(pattern => 
      errorString.includes(pattern)
    );
    
    if (!shouldIgnore) {
      originalConsoleError.apply(console, args);
    }
  };

  // Override console.warn
  console.warn = (...args: any[]) => {
    const warningString = args.join(' ');
    
    // Check if this is a warning we want to ignore
    const shouldIgnore = IGNORED_ERRORS.some(pattern => 
      warningString.includes(pattern)
    );
    
    if (!shouldIgnore) {
      originalConsoleWarn.apply(console, args);
    }
  };

  // Global error handler
  window.onerror = (message, source, lineno, colno, error) => {
    const errorString = `${message} ${source} ${lineno}:${colno}`;
    
    // Check if this is an error we want to ignore
    const shouldIgnore = IGNORED_ERRORS.some(pattern => 
      errorString.includes(pattern)
    );
    
    if (!shouldIgnore) {
      // Log the error using the original console.error
      originalConsoleError('Unhandled error:', { message, source, lineno, colno, error });
      return true; // Prevent default error handling
    }
    
    return true; // Prevent default error handling for ignored errors too
  };

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorString = String(event.reason || event);
    
    // Check if this is an error we want to ignore
    const shouldIgnore = IGNORED_ERRORS.some(pattern => 
      errorString.includes(pattern)
    );
    
    if (!shouldIgnore) {
      originalConsoleError('Unhandled promise rejection:', event.reason || event);
    }
    
    // Prevent default handling
    event.preventDefault();
  });
};

export default setupErrorHandling;
