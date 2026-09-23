import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, StudentProfile, TeacherProfile, UserRole } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  profile: StudentProfile | TeacherProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  quickDemoLogin: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | TeacherProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('edumentor_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const savedToken = localStorage.getItem('edumentor_token');
    if (!savedToken) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.auth.getMe();
      if (data.success && data.user) {
        setUser(data.user);
        setProfile(data.profile);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Session restoration failed:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    if (res.success && res.token) {
      localStorage.setItem('edumentor_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setProfile(res.profile);
    }
  };

  const register = async (data: any) => {
    const res = await api.auth.register(data);
    if (res.success && res.token) {
      localStorage.setItem('edumentor_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('edumentor_token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const quickDemoLogin = async (role: UserRole) => {
    const credentials = {
      student: { email: 'student@edumentor.ai', password: 'password123' },
      teacher: { email: 'teacher@edumentor.ai', password: 'password123' },
      admin: { email: 'admin@edumentor.ai', password: 'password123' },
    }[role];

    await login(credentials.email, credentials.password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        register,
        logout,
        quickDemoLogin,
        refreshUser,
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
