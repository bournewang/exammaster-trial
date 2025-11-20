import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { verifyCodeFormat } from '../utils/codeVerification';
import { getToken } from '../utils/auth';
import { clearAuthData } from '../utils/auth';
import { CheckCircle } from 'lucide-react';

const CODE_VERIFY_ENDPOINT = import.meta.env.VITE_CODE_VERIFY_ENDPOINT || '/api/verify-code';

export default function CodeVerification() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();

  const verifyCode = useAuthStore((state) => state.verifyCode);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // If a token exists and is valid, skip code verification
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/lessons');
      return;
    }

    const token = getToken();
    if (!token) return;

    const checkToken = async () => {
      try {
        const response = await fetch(CODE_VERIFY_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });
        const data = await response.json().catch(() => ({}));
        if (data && data.valid) {
          navigate('/lessons');
        } else if (data && data.message === 'Invalid or expired token') {
          // Token is expired, clear it and show code verification form
          clearAuthData();
        }
      } catch (e) {
        // Ignore errors; user will see the code verification form
      }
    };

    checkToken();
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    if (!code) {
      setError('请输入课程码');
      setIsVerifying(false);
      return;
    }

    // Basic client-side format check (server will perform the actual verification)
    if (!verifyCodeFormat(code)) {
      setError('课程码格式类似：T00010-8AB');
      setIsVerifying(false);
      return;
    }

    try {
      const result = await verifyCode(code);
      if (result) {
        navigate('/lessons');
      } else {
        setError('验证失败，请重新输入课程码。');
      }
    } catch (err) {
      setError(err.message || '验证失败，请重试！');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-4 w-full max-w-md">
        <div className="flex justify-center mb-4">
          <div className=" p-3 rounded-lg">
            {/* <CheckCircle className="text-white" size={32} /> */}
            <img src="/logo.png" alt="考试大师" className="h-24 w-24" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">考试大师，专注中高考快速提分</h1>
        <p className="text-center text-gray-600 mb-8">
          输入提供给您的课程码
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            {/* <label className="block text-gray-700 font-semibold mb-2">验证课程码</label> */}
            <input
              type="text"
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9-]/g, '')
                    .slice(0, 10),
                )
              }
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-center text-2xl tracking-widest font-bold"
              placeholder="XXXXXX-XXX"
              maxLength="10"
              disabled={isVerifying}
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition duration-200"
          >
            {isVerifying ? '验证中...' : '进入课程'}
          </button>
        </form>
      </div>
    </div>
  );
}
