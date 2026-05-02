import useAuthStore from '../store/authStore';

export const useAuth = () => {
  const { user, token, role, isAuthenticated, logout, loading, error } = useAuthStore();
  
  return {
    user,
    token,
    role,
    isAuthenticated,
    logout,
    loading,
    error
  };
};
