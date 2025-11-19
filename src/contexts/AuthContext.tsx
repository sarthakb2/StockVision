
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  isAuthenticated: false
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Check if user is already logged in - with improved session persistence
  useEffect(() => {
    const checkAuthStatus = () => {
      const storedUser = localStorage.getItem('stockay_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          // Handle corrupted localStorage data
          localStorage.removeItem('stockay_user');
        }
      }
      setLoading(false);
    };
    
    checkAuthStatus();
  }, []);

  // Mock login function - in a real app, this would call an API
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, any email/password combination will work
      const mockUser = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: email.split('@')[0],
        email: email
      };
      
      // Store user in localStorage with proper serialization
      localStorage.setItem('stockay_user', JSON.stringify(mockUser));
      setUser(mockUser);
      
      toast({
        title: "Login successful!",
        description: "Welcome back to STOCKAY.",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid email or password.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock signup function
  const signup = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: name,
        email: email
      };
      
      localStorage.setItem('stockay_user', JSON.stringify(mockUser));
      setUser(mockUser);
      
      toast({
        title: "Account created!",
        description: "Welcome to STOCKAY.",
      });
    } catch (error) {
      toast({
        title: "Signup failed",
        description: "Please try again with different credentials.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('stockay_user');
    setUser(null);
    toast({
      title: "Logged out",
      description: "You have been logged out of STOCKAY.",
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      signup, 
      logout, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return React.useContext(AuthContext);
};
