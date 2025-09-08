import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '../types';
import { apiService } from './api';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user_data');
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        // If parsing fails, clear invalid data
        localStorage.removeItem('user_data');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response: AuthResponse = await apiService.login(credentials);
      // Объединяем данные пользователя с профилем сотрудника
      const userData = {
        ...response.user,
        employee_profile: response.employee_profile
      };
      setUser(userData);
      // Save full user data to localStorage
      localStorage.setItem('user_data', JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      const response: AuthResponse = await apiService.register(userData);
      // Объединяем данные пользователя с профилем сотрудника
      const userDataWithProfile = {
        ...response.user,
        employee_profile: response.employee_profile
      };
      setUser(userDataWithProfile);
      // Save full user data to localStorage
      localStorage.setItem('user_data', JSON.stringify(userDataWithProfile));
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
      // Clear user data from localStorage
      localStorage.removeItem('user_data');
    } catch (error) {
      // Even if logout fails, clear local state
      setUser(null);
      localStorage.removeItem('user_data');
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
