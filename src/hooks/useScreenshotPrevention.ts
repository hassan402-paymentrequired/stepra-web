import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { logViolationWithContext, type SecurityViolation } from '@/apis/security';

interface KeyCombination {
  ctrl?: boolean;
  shift?: boolean;
  cmd?: boolean;
  option?: boolean;
  key: string;
}

interface UseScreenshotPreventionOptions {
  enabled?: boolean;
  onScreenshotAttempt?: () => void;
  onSuspiciousActivity?: (type: string) => void;
  watermarkText?: string;
  /** Visual overlay watermark — off by default; disfigures exam UI when enabled */
  showWatermark?: boolean;
  strictMode?: boolean;
  attemptUuid?: string;
  logToBackend?: boolean;
}

interface PendingViolation {
  type: SecurityViolation['type'];
  details: Record<string, any>;
  timestamp: number;
}

export const useScreenshotPrevention = (options: UseScreenshotPreventionOptions = {}) => {
  const {
    enabled = true,
    onScreenshotAttempt,
    onSuspiciousActivity,
    watermarkText = 'CONFIDENTIAL',
    showWatermark = false,
    strictMode = false,
    attemptUuid,
    logToBackend = true
  } = options;

  const [isBlurred, setIsBlurred] = useState(false);
  const suspiciousActivityCount = useRef(0);
  const watermarkRef = useRef<HTMLDivElement | null>(null);
  const violationQueueRef = useRef<PendingViolation[]>([]);
  const lastViolationSendRef = useRef<number>(Date.now());
  const violationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Function to queue violations instead of sending immediately
  const queueViolation = (type: SecurityViolation['type'], details: Record<string, any>) => {
    if (!logToBackend) return;
    
    violationQueueRef.current.push({
      type,
      details,
      timestamp: Date.now(),
    });
  };

  // Function to send queued violations to backend
  const sendQueuedViolations = async () => {
    if (violationQueueRef.current.length === 0) return;
    
    const violationsToSend = [...violationQueueRef.current];
    violationQueueRef.current = []; // Clear queue
    
    // Send each violation (they're already queued, so we can send them)
    for (const violation of violationsToSend) {
      try {
        await logViolationWithContext(violation.type, violation.details, attemptUuid);
      } catch (error) {
        console.error('Failed to log security violation:', error);
        // Re-queue failed violations (optional - you might want to drop them)
        // violationQueueRef.current.push(violation);
      }
    }
    
    lastViolationSendRef.current = Date.now();
  };

  // Set up interval to send violations every 5 minutes
  useEffect(() => {
    if (!enabled || !logToBackend) return;

    // Set up interval to send violations every 5 minutes (300000 ms)
    violationIntervalRef.current = setInterval(() => {
      sendQueuedViolations();
    }, 5 * 60 * 1000); // 5 minutes

    // Send violations on component unmount or when disabled
    return () => {
      if (violationIntervalRef.current) {
        clearInterval(violationIntervalRef.current);
        violationIntervalRef.current = null;
      }
      // Send any remaining violations before cleanup
      if (violationQueueRef.current.length > 0) {
        sendQueuedViolations();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, logToBackend, attemptUuid]);

  useEffect(() => {
    if (!enabled) return;

    // Create multi-layer watermark system
    const createWatermark = () => {
      // Main watermark
      const watermark = document.createElement('div');
      watermark.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 9999;
        opacity: 0.04;
        font-size: 24px;
        font-weight: bold;
        color: var(--foreground);
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      `;
      
      // Create repeating watermark pattern
      const watermarkPattern = Array(20).fill(null).map((_, i) => {
        const rotation = (i * 18) - 45; // Spread rotations from -45 to 270 degrees
        return `<div style="
          position: absolute;
          width: 100vw;
          height: 100vh;
          transform: rotate(${rotation}deg);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.6;
          font-size: ${20 + (i % 3) * 4}px;
        ">${watermarkText}</div>`;
      }).join('');
      
      watermark.innerHTML = watermarkPattern;
      document.body.appendChild(watermark);
      
      // Additional corner watermarks for Mac screenshot protection
      const cornerPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
      const cornerElements: HTMLElement[] = [];
      
      cornerPositions.forEach((position, index) => {
        const corner = document.createElement('div');
        const [vertical, horizontal] = position.split('-');
        corner.style.cssText = `
          position: fixed;
          ${vertical}: 10px;
          ${horizontal}: 10px;
          pointer-events: none;
          z-index: 10000;
          opacity: 0.1;
          font-size: 12px;
          font-weight: 600;
          color: var(--muted-foreground);
          transform: rotate(${index * 90}deg);
          user-select: none;
          font-family: monospace;
        `;
        corner.textContent = `${watermarkText} - ${new Date().toISOString()}`;
        document.body.appendChild(corner);
        cornerElements.push(corner);
      });
      
      watermarkRef.current = watermark;
      (watermarkRef.current as any).cornerElements = cornerElements;
    };

    // Add protective CSS
    const addProtectiveStyles = () => {
      const style = document.createElement('style');
      style.id = 'screenshot-protection';
      style.textContent = `
        .screenshot-protected {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
          -webkit-context-menu: none;
          context-menu: none;
        }
        
        .screenshot-protected * {
          -webkit-user-drag: none;
          -moz-user-drag: none;
          user-drag: none;
        }
        
        /* Hide content during print */
        @media print {
          .screenshot-protected {
            display: none !important;
          }
          body::after {
            content: "Content cannot be printed or screenshot";
            font-size: 2rem;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }
        }

        /* Blur during potential screen recording */
        .suspicious-activity {
          filter: blur(5px) !important;
          transition: filter 0.3s ease;
        }
      `;
      document.head.appendChild(style);
      return style;
    };

    // Screenshot detection methods
    const handleKeyDown = (e: KeyboardEvent) => {
      const prohibitedKeys: (string | KeyCombination)[] = [
        'PrintScreen',
        'F12',
        // Windows/Linux shortcuts
        { ctrl: true, shift: true, key: 'I' }, // Dev tools
        { ctrl: true, shift: true, key: 'J' }, // Console  
        { ctrl: true, shift: true, key: 'C' }, // Inspector
        { ctrl: true, key: 'u' }, // View source
        { ctrl: true, key: 's' }, // Save page
        { ctrl: true, key: 'p' }, // Print
        { ctrl: true, shift: true, key: 'Delete' }, // Clear data
        // Mac shortcuts
        { cmd: true, shift: true, key: '3' }, // Mac full screen screenshot
        { cmd: true, shift: true, key: '4' }, // Mac area screenshot
        { cmd: true, shift: true, key: '5' }, // Mac screenshot & screen recording
        { cmd: true, shift: true, key: '6' }, // Mac Touch Bar screenshot  
        { cmd: true, key: 's' }, // Mac save
        { cmd: true, key: 'p' }, // Mac print
        { cmd: true, option: true, key: 'i' }, // Mac dev tools
        { cmd: true, option: true, key: 'j' }, // Mac console
        { cmd: true, option: true, key: 'c' }, // Mac inspector
        { cmd: true, key: 'u' }, // Mac view source
      ];

      const isProhibited = prohibitedKeys.some(key => {
        if (typeof key === 'string') {
          return e.key === key;
        }
        
        // Check if all specified modifier keys match (ignore unspecified ones)
        const ctrlMatch = key.ctrl !== undefined ? (key.ctrl === e.ctrlKey) : true;
        const shiftMatch = key.shift !== undefined ? (key.shift === e.shiftKey) : true; 
        const cmdMatch = key.cmd !== undefined ? (key.cmd === e.metaKey) : true;
        const optionMatch = key.option !== undefined ? (key.option === e.altKey) : true;
        const keyMatch = e.key.toLowerCase() === key.key.toLowerCase();
        
        return ctrlMatch && shiftMatch && cmdMatch && optionMatch && keyMatch;
      });

      if (isProhibited) {
        e.preventDefault();
        e.stopPropagation();
        suspiciousActivityCount.current++;
        
        // Queue violation instead of sending immediately
        if (logToBackend) {
          const keyCombo = `${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.metaKey ? 'Cmd+' : ''}${e.altKey ? 'Option+' : ''}${e.key}`;
          queueViolation('keyboard_shortcut', {
            key_combination: keyCombo,
            violation_count: suspiciousActivityCount.current,
            platform: navigator.platform,
            is_mac: /Mac|iPhone|iPad|iPod/.test(navigator.platform),
          });
        }
        
        onScreenshotAttempt?.();
        onSuspiciousActivity?.('keyboard_shortcut');
        
        // Escalating warnings based on violation count
        const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
        const screenshotShortcuts = isMac 
          ? 'Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5' 
          : 'Print Screen, Alt+Print Screen';
          
        if (suspiciousActivityCount.current === 1) {
          toast.warning(`Screenshot shortcuts (${screenshotShortcuts}) are disabled during practice sessions.`);
        } else if (suspiciousActivityCount.current <= 3) {
          toast.error(`Screenshot attempts detected (${suspiciousActivityCount.current}). Please follow exam guidelines.`);
        } else if (suspiciousActivityCount.current <= 5) {
          toast.error('Multiple screenshot attempts detected. Continued violations may result in session termination.');
        } else {
          toast.error('⚠️ CRITICAL: Excessive violations detected. Session monitoring active.');
        }
        
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      suspiciousActivityCount.current++;
      
      // Queue violation instead of sending immediately
      if (logToBackend) {
        queueViolation('context_menu', {
          mouse_position: { x: e.clientX, y: e.clientY },
          target_element: e.target ? (e.target as Element).tagName : 'unknown',
        });
      }
      
      onSuspiciousActivity?.('context_menu');
      toast.warning('Right-click is disabled during practice sessions.');
      return false;
    };

    // Window focus/blur detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
        document.body.classList.add('suspicious-activity');
        
        // Queue violation instead of sending immediately
        if (logToBackend) {
          queueViolation('window_hidden', {
            document_visibility_state: document.visibilityState,
            page_focus: document.hasFocus(),
          });
        }
        
        onSuspiciousActivity?.('window_hidden');
        
        if (strictMode) {
          toast.warning('Window focus lost. Content temporarily hidden for security.');
        }
      } else {
        setTimeout(() => {
          setIsBlurred(false);
          document.body.classList.remove('suspicious-activity');
        }, 1000); // Brief delay to prevent rapid switching
      }
    };

    const handleBlur = () => {
      setIsBlurred(true);
      document.body.classList.add('suspicious-activity');
      
      // Queue violation instead of sending immediately
      if (logToBackend) {
        queueViolation('window_blur', {
          active_element: document.activeElement?.tagName || 'unknown',
        });
      }
      
      onSuspiciousActivity?.('window_blur');
    };

    const handleFocus = () => {
      setTimeout(() => {
        setIsBlurred(false);
        document.body.classList.remove('suspicious-activity');
      }, 500);
    };

    // Detect potential screen recording and Mac-specific screenshot apps
    const detectScreenRecording = () => {
      if ('mediaDevices' in navigator) {
        navigator.mediaDevices.enumerateDevices().then(devices => {
          const screenDevices = devices.filter(device => 
            device.label.toLowerCase().includes('screen') || 
            device.label.toLowerCase().includes('display')
          );
          
          if (screenDevices.length > 0) {
            onSuspiciousActivity?.('potential_screen_recording');
            if (logToBackend) {
              queueViolation('potential_screen_recording', {
                screen_devices_detected: screenDevices.length,
                device_labels: screenDevices.map(d => d.label),
              });
            }
          }
        }).catch(() => {
          // Permission denied or not supported
        });
      }

      // Mac-specific: Detect if Screenshot.app might be running
      // This is limited but can detect some activities
      if (/Mac/.test(navigator.platform)) {
        // Monitor for rapid window focus changes (common when using Screenshot.app)
        let focusChangeCount = 0;
        const focusChangeWindow = 5000; // 5 seconds
        
        const detectRapidFocusChanges = () => {
          focusChangeCount++;
          if (focusChangeCount > 3) {
            onSuspiciousActivity?.('rapid_focus_changes');
            if (logToBackend) {
              queueViolation('potential_screen_recording', {
                rapid_focus_changes: focusChangeCount,
                platform: 'Mac',
                possible_screenshot_app: true,
              });
            }
          }
          
          // Reset counter after window
          setTimeout(() => {
            focusChangeCount = Math.max(0, focusChangeCount - 1);
          }, focusChangeWindow);
        };

        window.addEventListener('focus', detectRapidFocusChanges);
        window.addEventListener('blur', detectRapidFocusChanges);
      }
    };

    // Initialize protection
    const style = addProtectiveStyles();
    if (showWatermark) {
      createWatermark();
    }
    document.body.classList.add('screenshot-protected');

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // Detect screen recording on init
    detectScreenRecording();

    // Cleanup function
    return () => {
      document.head.removeChild(style);
      if (watermarkRef.current) {
        document.body.removeChild(watermarkRef.current);
        
        // Remove corner watermarks
        const cornerElements = (watermarkRef.current as any).cornerElements;
        if (cornerElements) {
          cornerElements.forEach((element: HTMLElement) => {
            if (element.parentNode) {
              document.body.removeChild(element);
            }
          });
        }
      }
      document.body.classList.remove('screenshot-protected', 'suspicious-activity');
      
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, watermarkText, strictMode, onScreenshotAttempt, onSuspiciousActivity]);

  return {
    isBlurred,
    suspiciousActivityCount: suspiciousActivityCount.current,
  };
};