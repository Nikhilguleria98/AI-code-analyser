import { createContext, useEffect, useState } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    totalProjects: 0,
    totalIssuesFound: 0,
    avgSecurityScore: 0,
    criticalIssues: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [userPreferences, setUserPreferences] = useState({
    theme: 'dark',
    emailNotifications: true,
    securityAlerts: true
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((response) => {
        setUser(response.data.user);
        // Fetch user stats
        return api.get('/auth/stats');
      })
      .then((response) => {
        setUserStats(response.data.stats);
        setRecentActivity(response.data.activity || []);
        console.log('User stats loaded:', response.data.stats); // Debug log
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveAuth = (payload) => {
    localStorage.setItem('token', payload.token);
    setUser(payload.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setUserStats({
      totalProjects: 0,
      totalIssuesFound: 0,
      avgSecurityScore: 0,
      criticalIssues: 0
    });
    setRecentActivity([]);
  };

  const updateUserPreferences = (newPreferences) => {
    setUserPreferences((prev) => ({ ...prev, ...newPreferences }));
    api.post('/auth/preferences', newPreferences).catch(console.error);
  };

  const refreshUserStats = async () => {
    try {
      const response = await api.get('/auth/stats');
      setUserStats(response.data.stats);
      setRecentActivity(response.data.activity || []);
    } catch (error) {
      console.error('Failed to refresh user stats:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        saveAuth,
        logout,
        userStats,
        recentActivity,
        userPreferences,
        updateUserPreferences,
        refreshUserStats
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
