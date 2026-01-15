import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { activeAdapter } from '../services/dataAdapter';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  loading: boolean;

  // Email + password login
  login: (email: string, password: string) => Promise<boolean>;

  // Google login (email must already exist in Airtable)
  googleLogin: (email: string) => Promise<boolean>;

  logout: () => void;
  changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('creoo_session');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('creoo_session');
      }
    }
    setLoading(false);
  }, []);

  // 🔐 EMAIL + PASSWORD LOGIN
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const emailNormalized = email.trim().toLowerCase();
      const foundUser = await activeAdapter.getUserByEmail(emailNormalized);

      if (!foundUser) return false;
      if (foundUser.passwordHash !== password) return false;

      const sessionUser = {
        ...foundUser,
        lastLoginAt: new Date().toISOString()
      };

      await activeAdapter.updateUserLastLogin(
        sessionUser.userId,
        sessionUser.lastLoginAt
      );

      setUser(sessionUser);
      localStorage.setItem('creoo_session', JSON.stringify(sessionUser));
      return true;

    } catch (err) {
      console.error('Login failed:', err);
      return false;
    }
  };

  // 🔐 GOOGLE LOGIN (NO USER CREATION)
  const googleLogin = async (email: string): Promise<boolean> => {
    try {
      const ALLOWED_DOMAINS = [
  'creooglobal.com',
  'creoo.co',
  'gmail.com'
];

const emailDomain = email.split('@')[1]?.toLowerCase();

if (!emailDomain || !ALLOWED_DOMAINS.includes(emailDomain)) {
  console.error('Blocked domain:', emailDomain);
  return false;
}
      const emailNormalized = email.trim().toLowerCase();
      const foundUser = await activeAdapter.getUserByEmail(emailNormalized);

      if (!foundUser) {
        alert('Access denied. Please contact Jai or use your work email.');
        return false;
      }

      const sessionUser = {
        ...foundUser,
        lastLoginAt: new Date().toISOString()
      };

      await activeAdapter.updateUserLastLogin(
        sessionUser.userId,
        sessionUser.lastLoginAt
      );

      setUser(sessionUser);
      localStorage.setItem('creoo_session', JSON.stringify(sessionUser));
      return true;

    } catch (err) {
      console.error('Google login failed:', err);
      return false;
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!user) return;

    await activeAdapter.updateUser(user.userId, {
      passwordHash: newPassword,
      status: 'active'
    });

    const updatedUser = {
      ...user,
      passwordHash: newPassword,
      status: 'active'
    };

    setUser(updatedUser);
    localStorage.setItem('creoo_session', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('creoo_session');
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
