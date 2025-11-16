import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, User, UserPlus } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      register(email, password, name);
      navigate('/verify-code');
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="bg-green-500 p-3 rounded-lg">
            <UserPlus className="text-white" size={32} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">创建账户</h1>
        <p className="text-center text-gray-600 mb-8">加入我们的学习社区</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">全名</label>
            <div className="flex items-center border-2 border-gray-300 rounded-lg focus-within:border-green-500">
              <User className="text-gray-400 ml-3" size={20} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-4 py-2 outline-none"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">邮箱</label>
            <div className="flex items-center border-2 border-gray-300 rounded-lg focus-within:border-green-500">
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
            <div className="flex items-center border-2 border-gray-300 rounded-lg focus-within:border-green-500">
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

          <div>
            <label className="block text-gray-700 font-semibold mb-2">确认密码</label>
            <div className="flex items-center border-2 border-gray-300 rounded-lg focus-within:border-green-500">
              <Lock className="text-gray-400 ml-3" size={20} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="flex-1 px-4 py-2 outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition duration-200"
          >
            创建账户
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            已有账户？{' '}
            <Link to="/login" className="text-green-500 hover:text-green-600 font-semibold">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
