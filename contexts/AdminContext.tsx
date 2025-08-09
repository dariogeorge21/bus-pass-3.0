'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
}

interface AdminContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: AdminUser) => void;
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Validate session on mount and periodically
  useEffect(() => {
    validateSession();
    
    // Set up periodic session validation (every 5 minutes)
    const interval = setInterval(validateSession, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const validateSession = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/validate', {
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.valid) {
          setUser(result.data.user);
          setIsLoading(false);
          return true;
        }
      }

      // Session invalid, clear user data
      setUser(null);
      localStorage.removeItem('admin_user');
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Session validation error:', error);
      setUser(null);
      localStorage.removeItem('admin_user');
      setIsLoading(false);
      return false;
    }
  };

  const login = (userData: AdminUser) => {
    setUser(userData);
    localStorage.setItem('admin_user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Call logout API
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });

      // Clear user data
      setUser(null);
      localStorage.removeItem('admin_user');
      
      toast.success('Logged out successfully');
      router.push('/admin');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const value: AdminContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    validateSession
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

// Higher-order component for protecting admin routes
export function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAdmin();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/admin');
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}
