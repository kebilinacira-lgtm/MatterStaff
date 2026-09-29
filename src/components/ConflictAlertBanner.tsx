import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { AlertTriangle, Users, Wifi, Clock, ShieldAlert } from 'lucide-react';

interface PresenceData {
  userId: string;
  userName: string;
  role: string;
  lastActive: string;
  currentAction?: string;
  editingEmployeeName?: string;
}

export const ConflictAlertBanner: React.FC = () => {
  const { currentUser } = useAuth();
  const [otherActiveUsers, setOtherActiveUsers] = useState<PresenceData[]>([]);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const presenceDocRef = doc(db, 'presence', currentUser.id);

    // Heartbeat function to declare active presence every 10 seconds
    const updatePresence = async () => {
      try {
        await setDoc(presenceDocRef, {
          userId: currentUser.id,
          userName: currentUser.name,
          role: currentUser.role,
          lastActive: new Date().toISOString(),
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `presence/${currentUser.id}`);
      }
    };

    updatePresence();
    heartbeatRef.current = setInterval(updatePresence, 10000);

    // Listen to the other user's presence (Admin listens to Assistant, Assistant listens to Admin)
    const otherUserId = currentUser.id === 'admin' ? 'assistant' : 'admin';
    const otherDocRef = doc(db, 'presence', otherUserId);

    const unsubscribe = onSnapshot(otherDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as PresenceData;
        const lastActiveTime = new Date(data.lastActive).getTime();
        const now = Date.now();
        // If active in the last 30 seconds, consider connected right now
        if (now - lastActiveTime < 35000) {
          setOtherActiveUsers([data]);
        } else {
          setOtherActiveUsers([]);
        }
      } else {
        setOtherActiveUsers([]);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `presence/${otherUserId}`);
    });

    // Cleanup when leaving
    const handleUnload = async () => {
      try {
        await deleteDoc(presenceDocRef);
      } catch {
        // ignore on exit
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      unsubscribe();
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, [currentUser]);

  if (otherActiveUsers.length === 0) {
    return null;
  }

  const other = otherActiveUsers[0];
  const isOtherAdmin = other.role === 'admin';

  return (
    <div 
      id="live-conflict-banner"
      className="bg-amber-500/15 border-b-2 border-amber-500 text-amber-950 px-4 py-2.5 shadow-sm transition-all animate-fade-in"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-black text-sm text-amber-900">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span>إنذار وتنبيه: هناك مستخدم آخر يعمل على المنصة في نفس اللحظة!</span>
            </div>
            <p className="text-xs text-amber-800 font-medium">
              الطرف الآخر المتصل الآن: <strong className="text-amber-950 underline">{other.userName} ({isOtherAdmin ? 'مسؤول المصلحة' : 'مساعدة المصلحة'})</strong>. 
              يرجى التنسيق وعدم تعديل نفس ملف الموظف في نفس اللحظة تفادياً للتعارض (Conflict).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold bg-amber-100/90 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg shrink-0">
          <Wifi className="w-3.5 h-3.5 text-green-600 animate-pulse" />
          <span>المزامنة الحية نشطة (Firebase Cloud)</span>
        </div>
      </div>
    </div>
  );
};
