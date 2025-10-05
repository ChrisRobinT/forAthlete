import React, { createContext, useState, useContext, useEffect } from 'react';
import { api, authAPI } from '../services/api';
import { saveToken, getToken, removeToken } from '../services/storage';

interface AuthContextType {
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const savedToken = await getToken();
      if (savedToken) {
        try {
          await api.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${savedToken}` }
          });
          setToken(savedToken);
        } catch (error) {
          await removeToken();
          setToken(null);
        }
      }
    } catch (error) {
      console.error('Error loading token:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { access_token } = response.data;

      await saveToken(access_token);
      setToken(access_token);
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await removeToken();
      setToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};