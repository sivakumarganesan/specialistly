import { createContext, useContext, useState, useEffect } from 'react';

// API Base URL - for production uses /api (relative), for dev uses localhost
const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isSpecialist: boolean;
  membership: 'free' | 'pro';
  subscription: {
    planType: string;
    price: number;
    status: string;
    billingCycle: string;
    features: string[];
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentPage: string;
  userType: "specialist" | "customer" | "admin" | null;
  setCurrentPage: (page: string) => void;
  setUserType: (type: "specialist" | "customer" | "admin") => void;
  signup: (data: any) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateSubscription: (planType: 'free' | 'pro') => Promise<void>;
  updateUserName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('homepage');
  const [userType, setUserType] = useState<"specialist" | "customer" | "admin" | null>(null);

  // Load auth data from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    const savedUserType = localStorage.getItem('userType') as "specialist" | "customer" | "admin" | null;
    
    if (savedToken && savedUser) {
      // Check if token is expired before restoring the session
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          // Token already expired — clear it
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('userType');
        } else {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          const userTypeValue = savedUserType || "customer";
          setUserType(userTypeValue);
          setCurrentPage(userTypeValue === 'customer' ? 'my-learning' : 'dashboard');
        }
      } catch {
        // Malformed token — clear it
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
      }
    }
    setIsLoading(false);
  }, []);

  // Listen for session-expired events dispatched by apiClient
  useEffect(() => {
    const handleSessionExpired = () => {
      setToken(null);
      setUser(null);
      setUserType(null);
      setCurrentPage('homepage');
      alert('Your session has expired. Please log in again.');
    };
    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  const signup = async (data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Signup failed');
      }

      const result = await response.json();
      
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('userType', data.userType || 'customer');
      
      setToken(result.token);
      setUser(result.user);
      const userTypeValue = data.userType || 'customer';
      setUserType(userTypeValue);
      // Set default page based on user type
      const defaultPage = userTypeValue === 'admin' ? 'admin-dashboard' : (userTypeValue === 'specialist' ? 'dashboard' : 'my-learning');
      setCurrentPage(defaultPage);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const result = await response.json();
      
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('userType', result.userType || 'customer');
      
      setToken(result.token);
      setUser(result.user);
      const userTypeValue = result.userType || 'customer';
      setUserType(userTypeValue);
      // Set default page based on user type
      const defaultPage = userTypeValue === 'admin' ? 'admin-dashboard' : (userTypeValue === 'specialist' ? 'dashboard' : 'my-learning');
      setCurrentPage(defaultPage);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    setToken(null);
    setUser(null);
    setUserType(null);
    setCurrentPage('homepage');
  };

  const updateUserName = (name: string) => {
    if (user) {
      const updatedUser = { ...user, name };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const updateSubscription = async (planType: 'free' | 'pro') => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/subscription`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ planType }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Update failed');
      }

      const result = await response.json();
      
      localStorage.setItem('user', JSON.stringify(result.user));
      setUser(result.user);
    } catch (error) {
      console.error('Update subscription error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        currentPage,
        userType,
        setCurrentPage,
        setUserType,
        signup,
        login,
        logout,
        updateSubscription,
        updateUserName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
