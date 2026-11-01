import React, { createContext, useContext, useEffect, useState } from 'react';
import { FormAccess, UserProfile, UserRole } from '../types';
import { fetchUsers, saveUser } from '../firebase';

interface AuthContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserFormAccess: (userId: string, access: FormAccess) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  createUser: (username: string, password: string, role: UserRole, access: FormAccess) => Promise<{ success: boolean; error?: string }>;
  canWrite: boolean;
  isSuperUser: boolean;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_SESSION_KEY = 'mpr_r06_active_session_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshUsers = async () => {
    const list = await fetchUsers();
    setUsers(list);
    return;
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const list = await fetchUsers();
      setUsers(list);

      const savedUsername = localStorage.getItem(CURRENT_USER_SESSION_KEY);
      if (savedUsername) {
        const found = list.find((u) => u.username.toUpperCase() === savedUsername.toUpperCase());
        if (found) {
          setCurrentUser(found);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const list = await fetchUsers();
    setUsers(list);

    const cleanUsername = username.trim().toUpperCase();
    const cleanPassword = password.trim();

    const matched = list.find((u) => u.username.toUpperCase() === cleanUsername);
    if (!matched) {
      return { success: false, error: 'User does not exist. Check username.' };
    }

    if (matched.password !== cleanPassword) {
      return { success: false, error: 'Incorrect password. Default is 1234.' };
    }

    setCurrentUser(matched);
    localStorage.setItem(CURRENT_USER_SESSION_KEY, matched.username);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_SESSION_KEY);
  };

  const updateUserFormAccess = async (userId: string, access: FormAccess) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const updated: UserProfile = { ...target, formAccess: access };
    await saveUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    if (currentUser?.id === userId) {
      setCurrentUser(updated);
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const updated: UserProfile = { ...target, role };
    await saveUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    if (currentUser?.id === userId) {
      setCurrentUser(updated);
    }
  };

  const createUser = async (
    username: string,
    password: string,
    role: UserRole,
    access: FormAccess
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanUsername = username.trim().toUpperCase();
    if (!cleanUsername) {
      return { success: false, error: 'Username cannot be empty.' };
    }

    if (users.some((u) => u.username.toUpperCase() === cleanUsername)) {
      return { success: false, error: 'User with this name already exists.' };
    }

    const newUser: UserProfile = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username: cleanUsername,
      password: password.trim() || '1234',
      role,
      formAccess: access,
      createdAt: new Date().toISOString(),
    };

    await saveUser(newUser);
    setUsers((prev) => [newUser, ...prev]);
    return { success: true };
  };

  const canWrite = currentUser?.role === 'super' || currentUser?.formAccess === 'write';
  const isSuperUser = currentUser?.role === 'super';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        loading,
        login,
        logout,
        updateUserFormAccess,
        updateUserRole,
        createUser,
        canWrite,
        isSuperUser,
        refreshUsers,
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
