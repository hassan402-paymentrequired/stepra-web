import api from '@/lib/api';

export interface SecurityViolation {
  type: 'screenshot_attempt' | 'context_menu' | 'keyboard_shortcut' | 'window_blur' | 'window_hidden' | 'potential_screen_recording';
  details?: Record<string, any>;
  attempt_id?: number;
  url?: string;
  user_agent?: string;
}

export interface SecurityViolationResponse {
  success: boolean;
  message: string;
  data: {
    violation_count: number;
    warning_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
    action?: 'warning_issued' | 'session_termination_recommended';
  };
}

export interface SecurityStatusResponse {
  success: boolean;
  data: {
    today_violations: number;
    recent_violations: number;
    warning_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
    status: 'active' | 'blocked';
  };
}

/**
 * Log a security violation to the backend.
 */
export const logSecurityViolation = async (violation: SecurityViolation): Promise<SecurityViolationResponse> => {
  const response = await api.post('/security/violations', {
    type: violation.type,
    details: violation.details,
    attempt_id: violation.attempt_id,
    url: violation.url || window.location.href,
    user_agent: violation.user_agent || navigator.userAgent,
  });
  return response.data;
};

/**
 * Get the current user's security violation status.
 */
export const getSecurityStatus = async (): Promise<SecurityStatusResponse> => {
  const response = await api.get('/security/violations/status');
  return response.data;
};

/**
 * Helper function to automatically log violations with common details.
 */
export const logViolationWithContext = async (
  type: SecurityViolation['type'],
  additionalDetails?: Record<string, any>,
  attemptId?: number
) => {
  try {
    const violation: SecurityViolation = {
      type,
      details: {
        timestamp: new Date().toISOString(),
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...additionalDetails,
      },
      attempt_id: attemptId,
      url: window.location.href,
      user_agent: navigator.userAgent,
    };

    return await logSecurityViolation(violation);
  } catch (error) {
    console.error('Failed to log security violation:', error);
    // Don't throw error to avoid breaking user experience
    return null;
  }
};