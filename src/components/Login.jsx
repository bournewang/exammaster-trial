import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    try {
      login(email, password);
      navigate('/verify-code');
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="bg-blue-500 p-3 rounded-lg">
            <LogIn className="text-white" size={32} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">欢迎回来</h1>
        <p className="text-center text-gray-600 mb-8">登录您的账户</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">邮箱</label>
            <div className="flex items-center border-2 border-gray-300 rounded-lg focus-within:border-blue-500">
              <Mail className="text-gray-400 ml-3" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-2 outline-none"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">密码</label>
            <div className="flex items-center border-2 border-gray-300 rounded-lg focus-within:border-blue-500">
              <Lock className="text-gray-400 ml-3" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 px-4 py-2 outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition duration-200"
          >
            登录
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            没有账户？{' '}
            <Link to="/register" className="text-blue-500 hover:text-blue-600 font-semibold">
              注册新账户
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
