import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { logViolationWithContext } from '@/apis/security';

interface UseScreenshotPreventionOptions {
  enabled?: boolean;
  onScreenshotAttempt?: () => void;
  onSuspiciousActivity?: (type: string) => void;
  watermarkText?: string;
  strictMode?: boolean;
  attemptId?: number;
  logToBackend?: boolean;
}

export const useScreenshotPrevention = (options: UseScreenshotPreventionOptions = {}) => {
  const {
    enabled = true,
    onScreenshotAttempt,
    onSuspiciousActivity,
    watermarkText = 'CONFIDENTIAL',
    strictMode = false,
    attemptId,
    logToBackend = true
  } = options;

  const [isBlurred, setIsBlurred] = useState(false);
  const suspiciousActivityCount = useRef(0);
  const watermarkRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Create dynamic watermark
    const createWatermark = () => {
      const watermark = document.createElement('div');
      watermark.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 9999;
        opacity: 0.05;
        font-size: 48px;
        font-weight: bold;
        color: #000;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        user-select: none;
        background-image: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 100px,
          rgba(0,0,0,0.02) 100px,
          rgba(0,0,0,0.02) 200px
        );
      `;
      watermark.textContent = watermarkText;
      document.body.appendChild(watermark);
      watermarkRef.current = watermark;
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
      const prohibitedKeys = [
        'PrintScreen',
        'F12',
        { ctrl: true, shift: true, key: 'I' }, // Dev tools
        { ctrl: true, shift: true, key: 'J' }, // Console
        { ctrl: true, shift: true, key: 'C' }, // Inspector
        { ctrl: true, key: 'u' }, // View source
        { ctrl: true, key: 's' }, // Save page
        { ctrl: true, key: 'p' }, // Print
        { cmd: true, shift: true, key: '3' }, // Mac screenshot
        { cmd: true, shift: true, key: '4' }, // Mac area screenshot
        { cmd: true, shift: true, key: '5' }, // Mac screen recording
      ];

      const isProhibited = prohibitedKeys.some(key => {
        if (typeof key === 'string') {
          return e.key === key;
        }
        return (
          (key.ctrl ? e.ctrlKey : true) &&
          (key.shift ? e.shiftKey : true) &&
          (key.cmd ? e.metaKey : true) &&
          e.key.toLowerCase() === key.key.toLowerCase()
        );
      });

      if (isProhibited) {
        e.preventDefault();
        e.stopPropagation();
        suspiciousActivityCount.current++;
        
        // Log to backend if enabled
        if (logToBackend) {
          logViolationWithContext('keyboard_shortcut', {
            key_combination: `${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.metaKey ? 'Cmd+' : ''}${e.key}`,
            violation_count: suspiciousActivityCount.current,
          }, attemptId);
        }
        
        onScreenshotAttempt?.();
        onSuspiciousActivity?.('keyboard_shortcut');
        
        // Escalating warnings based on violation count
        if (suspiciousActivityCount.current === 1) {
          toast.warning('Screenshot shortcuts are disabled during practice sessions.');
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
      
      // Log to backend
      if (logToBackend) {
        logViolationWithContext('context_menu', {
          mouse_position: { x: e.clientX, y: e.clientY },
          target_element: e.target ? (e.target as Element).tagName : 'unknown',
        }, attemptId);
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
        
        // Log to backend
        if (logToBackend) {
          logViolationWithContext('window_hidden', {
            document_visibility_state: document.visibilityState,
            page_focus: document.hasFocus(),
          }, attemptId);
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
      
      // Log to backend
      if (logToBackend) {
        logViolationWithContext('window_blur', {
          active_element: document.activeElement?.tagName || 'unknown',
        }, attemptId);
      }
      
      onSuspiciousActivity?.('window_blur');
    };

    const handleFocus = () => {
      setTimeout(() => {
        setIsBlurred(false);
        document.body.classList.remove('suspicious-activity');
      }, 500);
    };

    // Detect potential screen recording (experimental)
    const detectScreenRecording = () => {
      if ('mediaDevices' in navigator) {
        navigator.mediaDevices.enumerateDevices().then(devices => {
          const screenDevices = devices.filter(device => 
            device.label.toLowerCase().includes('screen') || 
            device.label.toLowerCase().includes('display')
          );
          
          if (screenDevices.length > 0) {
            onSuspiciousActivity?.('potential_screen_recording');
          }
        }).catch(() => {
          // Permission denied or not supported
        });
      }
    };

    // Initialize protection
    const style = addProtectiveStyles();
    createWatermark();
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