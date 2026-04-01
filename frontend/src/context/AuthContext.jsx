import React, { createContext, useState, useContext, useEffect } from 'react';

// Auth Context — manages login state globally
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // current logged-in user
  const [token, setToken] = useState(null);     // JWT token
  const [loading, setLoading] = useState(true); // initial auth check

  // Load user & token from localStorage on app start
  useEffect(() => {
    const savedToken = localStorage.getItem('examToken');
    const savedUser  = localStorage.getItem('examUser');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Login function — saves to state & localStorage
  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('examToken', jwtToken);
    localStorage.setItem('examUser', JSON.stringify(userData));
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('examToken');
    localStorage.removeItem('examUser');
  };

  const isAdmin   = () => user?.role === 'admin';
  const isStudent = () => user?.role === 'student';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, isStudent, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
