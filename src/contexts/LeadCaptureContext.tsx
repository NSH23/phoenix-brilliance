import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

const STORAGE_KEY = 'phoenix_selected_venue';

export const NOT_BOOKED_VENUE = 'Not booked venue';

interface LeadCaptureContextType {
  /** Venue name from form; null = show all collaborations (Other / Not booked / not set). */
  selectedVenue: string | null;
  setSelectedVenue: (venue: string | null) => void;
}

const LeadCaptureContext = createContext<LeadCaptureContextType | undefined>(undefined);

export function LeadCaptureProvider({ children }: { children: ReactNode }) {
  const [selectedVenue, setState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const setSelectedVenue = useCallback((venue: string | null) => {
    setState(venue);
    try {
      if (venue) sessionStorage.setItem(STORAGE_KEY, venue);
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <LeadCaptureContext.Provider value={{ selectedVenue, setSelectedVenue }}>
      {children}
    </LeadCaptureContext.Provider>
  );
}

export function useLeadCapture() {
  const ctx = useContext(LeadCaptureContext);
  if (ctx === undefined) throw new Error('useLeadCapture must be used within LeadCaptureProvider');
  return ctx;
}

export function useLeadCaptureOptional() {
  return useContext(LeadCaptureContext);
}
