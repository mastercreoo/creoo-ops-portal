import React, { useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';
import { APP_NAME } from '../constants';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const { user, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');

      try {
        // Fetch Google profile
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        const profile = await res.json();

        if (!profile?.email) {
          throw new Error('Google email not found');
        }

        const success = await googleLogin(profile.email);

        if (!success) {
          setError(
            'Access denied. Please contact Jai for fixing this or use your work email ID.'
          );
        }
      } catch (err) {
        console.error(err);
        setError('Google login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google login failed. Please try again.');
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <span className="text-white text-3xl font-black italic">C</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">{APP_NAME}</h1>
          <p className="text-slate-500 mt-2">
            Internal operations & resource management
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm flex gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <button
            onClick={() => handleGoogleLogin()}
            disabled={loading}
            className="w-full border border-slate-300 py-3 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              className="w-5 h-5"
            />
            {loading ? 'Signing in…' : 'Sign in with Google'}
          </button>
        </div>

        <div className="mt-8 text-center text-xs text-slate-400">
          Authorized personnel only
        </div>
      </div>
    </div>
  );
};

export default Login;
