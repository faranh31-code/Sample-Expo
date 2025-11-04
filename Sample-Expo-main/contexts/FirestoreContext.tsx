import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    DocumentData,
    onSnapshot,
    orderBy,
    query,
    QueryDocumentSnapshot,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';

export interface FocusSession {
  id: string;
  userId: string;
  status: 'Completed' | 'Failed';
  duration: number; // in minutes
  timestamp: Timestamp;
  timePlantedSeconds: number;
}

interface FirestoreContextType {
  sessions: FocusSession[];
  loading: boolean;
  addSession: (duration: number, status: 'Completed' | 'Failed') => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  getSessionsByDate: (date: Date) => FocusSession[];
  getDayStreak: () => number;
  clearFilter: () => void;
  filteredSessions: FocusSession[];
  setFilterDate: (date: Date | null) => void;
  filterDate: Date | null;
}

const FirestoreContext = createContext<FirestoreContextType | undefined>(undefined);

export const useFirestore = () => {
  const context = useContext(FirestoreContext);
  if (context === undefined) {
    throw new Error('useFirestore must be used within a FirestoreProvider');
  }
  return context;
};

interface FirestoreProviderProps {
  children: React.ReactNode;
}

export const FirestoreProvider: React.FC<FirestoreProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setFilteredSessions([]);
      setLoading(false);
      return;
    }

    const sessionsRef = collection(db, 'users', user.uid, 'focus_sessions');
    const q = query(sessionsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsData: FocusSession[] = [];
      snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        sessionsData.push({
          id: doc.id,
          userId: data.userId,
          status: data.status,
          duration: data.duration,
          timestamp: data.timestamp,
          timePlantedSeconds: data.timePlantedSeconds || 0,
        });
      });
      setSessions(sessionsData);
      setFilteredSessions(sessionsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!filterDate) {
      setFilteredSessions(sessions);
      return;
    }

    const filtered = sessions.filter(session => {
      const sessionDate = session.timestamp.toDate();
      const filterDateOnly = new Date(filterDate);
      filterDateOnly.setHours(0, 0, 0, 0);

      return sessionDate.toDateString() === filterDateOnly.toDateString();
    });

    setFilteredSessions(filtered);
  }, [sessions, filterDate]);

  const addSession = async (duration: number, status: 'Completed' | 'Failed'): Promise<void> => {
    if (!user) return;

    const sessionData = {
      userId: user.uid,
      status,
      duration,
      timestamp: serverTimestamp(),
      timePlantedSeconds: duration * 60, // Convert minutes to seconds
    };

    await addDoc(collection(db, 'users', user.uid, 'focus_sessions'), sessionData);
  };

  const deleteSession = async (sessionId: string): Promise<void> => {
    if (!user) return;

    await deleteDoc(doc(db, 'users', user.uid, 'focus_sessions', sessionId));
  };

  const getSessionsByDate = (date: Date): FocusSession[] => {
    return sessions.filter(session => {
      const sessionDate = session.timestamp.toDate();
      return sessionDate.toDateString() === date.toDateString();
    });
  };

  const getDayStreak = (): number => {
    if (sessions.length === 0) return 0;

    const completedSessions = sessions.filter(session => session.status === 'Completed');
    if (completedSessions.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    for (let i = 0; i < 365; i++) { // Check up to 365 days back
      const hasSession = completedSessions.some(session => {
        const sessionDate = session.timestamp.toDate();
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === currentDate.getTime();
      });

      if (hasSession) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const clearFilter = (): void => {
    setFilterDate(null);
  };

  const setFilterDateHandler = (date: Date | null): void => {
    setFilterDate(date);
  };

  const value: FirestoreContextType = {
    sessions,
    loading,
    addSession,
    deleteSession,
    getSessionsByDate,
    getDayStreak,
    clearFilter,
    filteredSessions,
    setFilterDate: setFilterDateHandler,
    filterDate,
  };

  return (
    <FirestoreContext.Provider value={value}>
      {children}
    </FirestoreContext.Provider>
  );
};
