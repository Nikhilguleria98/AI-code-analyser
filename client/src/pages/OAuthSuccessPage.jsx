import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const OAuthSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { saveAuth } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      navigate('/login');
      return;
    }

    localStorage.setItem('token', token);
    api.get('/auth/me').then((response) => {
      saveAuth({ token, user: response.data.user });
      navigate('/');
    });
  }, [navigate, saveAuth, searchParams]);

  return <div className="flex min-h-screen items-center justify-center text-soft">Signing you in...</div>;
};

export default OAuthSuccessPage;
