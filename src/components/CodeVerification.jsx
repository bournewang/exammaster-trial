import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { verifyCodeFormat } from '../utils/codeVerification';
import { CheckCircle } from 'lucide-react';

export default function CodeVerification() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();

  const verifyCode = useAuthStore((state) => state.verifyCode);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    if (!code) {
      setError('Please enter the verification code');
      setIsVerifying(false);
      return;
    }

    // Basic client-side format check (server will perform the actual verification)
    if (!verifyCodeFormat(code)) {
      setError('Code format must be like T00010-8AB');
      setIsVerifying(false);
      return;
    }

    try {
      const result = await verifyCode(code);
      if (result) {
        navigate('/lessons');
      } else {
        setError('Verification failed. Please check your code and try again.');
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="bg-blue-500 p-3 rounded-lg">
            <CheckCircle className="text-white" size={32} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">输入试用码</h1>
        <p className="text-center text-gray-600 mb-8">
          输入提供给您的试用码
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            {/* <label className="block text-gray-700 font-semibold mb-2">验证试用码</label> */}
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
              placeholder="T00010-8AB"
              maxLength="10"
              disabled={isVerifying}
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition duration-200"
          >
            {isVerifying ? '验证中...' : '验证试用码'}
          </button>
        </form>
      </div>
    </div>
  );
}
