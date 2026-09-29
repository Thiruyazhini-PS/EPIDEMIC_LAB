// src/utils/authSession.ts
/**
 * Frontend-only Authentication Session Manager.
 *
 * Provides a clean, isolated state management layer for mock research credentials.
 * Easily swappable with a real JWT / OAuth2 backend authentication client later.
 */

export interface ResearchUser {
  id: string;
  name: string;
  role: string;
  email: string;
  researchId: string;
  nodeId?: number;
  institution?: string;
  sessionStartedAt: string;
  isGuest: boolean;
}

const STORAGE_KEY = 'epidemic_lab_research_session_v1';

export const AuthSession = {
  /**
   * Retrieves the current saved session from local storage, if valid.
   */
  getSession(): ResearchUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.researchId) {
        return parsed as ResearchUser;
      }
      return null;
    } catch (e) {
      console.warn('Failed to parse auth session:', e);
      return null;
    }
  },

  /**
   * Persists a research session.
   */
  saveSession(user: ResearchUser): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save auth session:', e);
    }
  },

  /**
   * Clears the current session (Logout).
   */
  clearSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear auth session:', e);
    }
  },

  /**
   * Returns true if a valid user session is active.
   */
  isAuthenticated(): boolean {
    return AuthSession.getSession() !== null;
  },

  /**
   * Creates a mock research user profile.
   */
  createMockUser(partial: Partial<ResearchUser>): ResearchUser {
    return {
      id: partial.id || `usr_${Date.now()}`,
      name: partial.name || 'Research Fellow',
      role: partial.role || 'Senior Epidemiologist',
      email: partial.email || 'researcher@epidemiclab.io',
      researchId: partial.researchId || `LAB-${Math.floor(1000 + Math.random() * 9000)}`,
      nodeId: partial.nodeId ?? 0,
      institution: partial.institution || 'Institute for Disease Dynamics',
      sessionStartedAt: new Date().toISOString(),
      isGuest: partial.isGuest ?? false,
    };
  },
};
