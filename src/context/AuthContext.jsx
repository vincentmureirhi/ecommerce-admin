import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const newToken = localStorage.getItem("token");
    const newUser = localStorage.getItem("user");

    console.log('✅ AuthContext initializing:', {
      token: newToken ? 'EXISTS' : 'NONE',
      user: newUser ? JSON.parse(newUser).email : 'NONE',
    });

    if (newToken && newUser) {
      setToken(newToken);
      setUser(JSON.parse(newUser));
      setIsAuthed(true);
    } else {
      setToken(null);
      setUser(null);
      setIsAuthed(false);
    }
    
    setLoading(false);
  }, []);

  // Listen for storage changes (from other tabs/windows)
  useEffect(() => {
    const handleStorageChange = (e) => {
      console.log('🔔 Storage event detected:', e.key);

      if (e.key === 'token') {
        const newToken = e.newValue;
        console.log('🔑 Token updated:', newToken ? 'SET' : 'CLEARED');
        setToken(newToken);
        setIsAuthed(!!newToken);
      }

      if (e.key === 'user') {
        if (e.newValue) {
          try {
            const parsedUser = JSON.parse(e.newValue);
            console.log('👤 User updated:', parsedUser.email);
            setUser(parsedUser);
          } catch (error) {
            console.error('❌ Failed to parse user:', error);
            setUser(null);
          }
        } else {
          console.log('👤 User cleared');
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = () => {
    console.log('🚪 Logging out...');
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setIsAuthed(false);
  };

  // Override setToken to also update isAuthed
  const updateToken = (newToken) => {
    setToken(newToken);
    setIsAuthed(!!newToken);
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
  };

  // Override setUser to also save to localStorage
  const updateUser = (newUser) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  const value = {
    user,
    setUser: updateUser,
    token,
    setToken: updateToken,
    isAuthed,
    setIsAuthed,
    logout,
    loading,
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
