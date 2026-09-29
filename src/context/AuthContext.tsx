import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, UserRole } from '../types';

interface AuthContextType {
  currentUser: AppUser | null;
  users: AppUser[];
  login: (username: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  switchUser: (userId: string, password: string) => { success: boolean; message: string };
  changePassword: (userId: string, oldPass: string, newPass: string) => { success: boolean; message: string };
  updateUserName: (userId: string, newName: string) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAssistant: boolean;
}

const DEFAULT_USERS: AppUser[] = [
  {
    id: 'admin',
    username: 'admin',
    name: 'مسؤول مصلحة المستخدمين',
    role: 'admin',
    roleTitle: 'مسؤول المصلحة (الرئيس)',
    passwordHash: 'admin2026',
    avatarColor: 'bg-emerald-800',
  },
  {
    id: 'assistant',
    username: 'assistant',
    name: 'مساعدة مسؤول المصلحة',
    role: 'assistant',
    roleTitle: 'مساعدة المسؤول (المساعدة الإدارية)',
    passwordHash: 'aide2026',
    avatarColor: 'bg-teal-700',
  },
];

const USERS_STORAGE_KEY = 'km_leaves_app_users_v2';
const SESSION_STORAGE_KEY = 'km_leaves_active_session_v2';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading users:', e);
    }
    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const session = localStorage.getItem(SESSION_STORAGE_KEY);
      if (session === 'LOGGED_OUT') {
        return null;
      }
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed && parsed.id) {
          const found = users.find(u => u.id === parsed.id);
          if (found) return found;
        }
      }
    } catch (e) {
      console.error('Error loading session:', e);
    }
    // Default logged in as admin initially for smooth immediate setup
    return DEFAULT_USERS[0];
  });

  // Save users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users:', e);
    }
  }, [users]);

  // Save current session
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Error saving session:', e);
    }
  }, [currentUser]);

  const normalize = (str: string) => str.trim().toLowerCase();

  const login = (usernameInput: string, passwordInput: string): { success: boolean; message: string } => {
    const term = normalize(usernameInput);
    const pass = passwordInput.trim();

    // Match either by username or by Arabic designation
    const foundUser = users.find(u => {
      const uName = normalize(u.username);
      const rName = normalize(u.name);
      if (term === uName) return true;
      if (term === 'المسؤول' && u.role === 'admin') return true;
      if (term === 'المساعدة' && u.role === 'assistant') return true;
      if (term === 'admin' && u.role === 'admin') return true;
      if (term === 'assistant' && u.role === 'assistant') return true;
      if (rName.includes(term) && term.length >= 3) return true;
      return false;
    });

    if (!foundUser) {
      return { success: false, message: 'اسم المستخدم غير مسجل في المنصة. يرجى التأكد من اسم الحساب.' };
    }

    if (foundUser.passwordHash !== pass) {
      return { success: false, message: 'كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.' };
    }

    setCurrentUser(foundUser);
    return { success: true, message: `مرحباً بك يا ${foundUser.name}` };
  };

  const logout = () => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, 'LOGGED_OUT');
    } catch (e) {
      console.error('Error logging out:', e);
    }
    setCurrentUser(null);
  };

  const switchUser = (userId: string, passwordInput: string): { success: boolean; message: string } => {
    const found = users.find(u => u.id === userId);
    if (!found) return { success: false, message: 'المستخدم غير موجود' };

    if (found.passwordHash !== passwordInput.trim()) {
      return { success: false, message: 'كلمة المرور غير صحيحة' };
    }

    setCurrentUser(found);
    return { success: true, message: `تم التبديل بنجاح إلى حساب ${found.name}` };
  };

  const changePassword = (userId: string, oldPass: string, newPass: string): { success: boolean; message: string } => {
    const found = users.find(u => u.id === userId);
    if (!found) return { success: false, message: 'المستخدم غير موجود' };

    if (found.passwordHash !== oldPass.trim()) {
      return { success: false, message: 'كلمة المرور الحالية غير صحيحة' };
    }

    if (!newPass.trim() || newPass.trim().length < 3) {
      return { success: false, message: 'كلمة المرور الجديدة يجب أن تكون 3 أحرف/أرقام على الأقل' };
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, passwordHash: newPass.trim() } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, passwordHash: newPass.trim() } : null);
    }

    return { success: true, message: 'تم تغيير كلمة المرور بنجاح ✅' };
  };

  const updateUserName = (userId: string, newName: string) => {
    if (!newName.trim()) return;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, name: newName.trim() } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, name: newName.trim() } : null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        switchUser,
        changePassword,
        updateUserName,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.role === 'admin',
        isAssistant: currentUser?.role === 'assistant',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
