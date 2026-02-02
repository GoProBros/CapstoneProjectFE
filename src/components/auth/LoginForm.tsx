"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Validate password requirements:
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one number
 * - Minimum length > 6
 */
const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Mật khẩu tối thiểu 6 ký tự');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất một chữ thường');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất một chữ in hoa');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất một chữ số');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

interface LoginFormProps {
  error: string | null;
  setError: (error: string | null) => void;
}

export default function LoginForm({ error, setError }: LoginFormProps) {
  const router = useRouter();
  const { login: authLogin, register: authRegister } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  
  // Shared form state for both login and register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register-only form state
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerPhoneNumber, setRegisterPhoneNumber] = useState('');

  const handleGoogleSignIn = () => {
    console.log('Google Sign In clicked');
    // TODO: Implement Google OAuth
  };

  const handlePasswordChange = (value: string, isRegister: boolean = false) => {
    setPassword(value);
    if (isRegister) {
      // Only show validation errors for register form
      if (value.length > 0) {
        const validation = validatePassword(value);
        setPasswordErrors(validation.errors);
      } else {
        setPasswordErrors([]);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authLogin({
        email: email,
        password: password,
      });
      // AuthContext will handle saving to localStorage and navigation
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordErrors(passwordValidation.errors);
      setError('Mật khẩu không đáp ứng yêu cầu. Vui lòng kiểm tra lại.');
      setIsLoading(false);
      return;
    }

    try {
      await authRegister({
        email: email,
        password: password,
        fullName: registerFullName,
        phoneNumber: registerPhoneNumber,
      });
      // AuthContext will handle saving to localStorage and navigation
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="w-full max-w-sm flex items-center justify-center"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
    >
        <div className="w-full">
          <motion.div
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl shadow-black/20 mt-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {/* Form Header */}
            <motion.div
              className="text-center mb-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <h3 className="text-xl font-bold text-white mb-2">
                {isLogin ? 'Chào mừng' : 'Đăng ký tài khoản'}
              </h3>
              <p className="text-slate-300 text-sm">
                {isLogin ? 'Đăng nhập để truy cập dashboard của bạn' : 'Tạo tài khoản mới để bắt đầu'}
              </p>
            </motion.div>

          {/* Login Form */}
          {isLogin ? (
            <motion.form
              onSubmit={handleLogin}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              <div>
                <label htmlFor="login-email" className="block text-slate-300 text-sm font-medium mb-1.5">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4ADE80] focus:border-transparent transition-all disabled:opacity-50"
                  placeholder="your.email@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="login-password" className="block text-slate-300 text-sm font-medium mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value, false)}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4ADE80] focus:border-transparent transition-all disabled:opacity-50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onMouseDown={() => setShowPassword(true)}
                    onMouseUp={() => setShowPassword(false)}
                    onMouseLeave={() => setShowPassword(false)}
                    onTouchStart={() => setShowPassword(true)}
                    onTouchEnd={() => setShowPassword(false)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#4ADE80] to-blue-400 hover:from-[#4ADE80]/90 hover:to-blue-400/90 text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>

              {/* Toggle to Register */}
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setError(null);
                    setPasswordErrors([]);
                  }}
                  disabled={isLoading}
                  className="text-[#4ADE80] hover:text-[#4ADE80]/80 transition-colors font-medium disabled:opacity-50 text-sm"
                >
                  Chưa có tài khoản? Đăng ký ngay
                </button>
              </div>
            </motion.form>
          ) : (
            /* Register Form */
            <motion.form
              onSubmit={handleRegister}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              <div>
                <label htmlFor="register-fullname" className="block text-slate-300 text-sm font-medium mb-1.5">
                  Họ và tên
                </label>
                <input
                  id="register-fullname"
                  type="text"
                  value={registerFullName}
                  onChange={(e) => setRegisterFullName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4ADE80] focus:border-transparent transition-all disabled:opacity-50"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label htmlFor="register-email" className="block text-slate-300 text-sm font-medium mb-1.5">
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4ADE80] focus:border-transparent transition-all disabled:opacity-50"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="register-phone" className="block text-slate-300 text-sm font-medium mb-1.5">
                  Số điện thoại
                </label>
                <input
                  id="register-phone"
                  type="tel"
                  value={registerPhoneNumber}
                  onChange={(e) => setRegisterPhoneNumber(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4ADE80] focus:border-transparent transition-all disabled:opacity-50"
                  placeholder="0912345678"
                />
              </div>
              
              <div>
                <label htmlFor="register-password" className="block text-slate-300 text-sm font-medium mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value, true)}
                    required
                    disabled={isLoading}
                    className={`w-full px-4 py-3 pr-12 bg-white/10 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                      passwordErrors.length > 0 && password.length > 0
                        ? 'border-red-500/50 focus:ring-red-500 focus:border-transparent'
                        : 'border-white/20 focus:ring-[#4ADE80] focus:border-transparent'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onMouseDown={() => setShowPassword(true)}
                    onMouseUp={() => setShowPassword(false)}
                    onMouseLeave={() => setShowPassword(false)}
                    onTouchStart={() => setShowPassword(true)}
                    onTouchEnd={() => setShowPassword(false)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Password Requirements */}
                {password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="mt-1.5 space-y-0.5"
                  >
                    <div className={`flex items-center text-xs ${password.length >= 6 ? 'text-green-400' : 'text-slate-400'}`}>
                      <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        {password.length >= 6 ? (
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        )}
                      </svg>
                      Độ dài tối thiểu 6 ký tự
                    </div>
                    <div className={`flex items-center text-xs ${/[a-z]/.test(password) ? 'text-green-400' : 'text-slate-400'}`}>
                      <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        {/[a-z]/.test(password) ? (
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        )}
                      </svg>
                      Ít nhất một chữ thường
                    </div>
                    <div className={`flex items-center text-xs ${/[A-Z]/.test(password) ? 'text-green-400' : 'text-slate-400'}`}>
                      <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        {/[A-Z]/.test(password) ? (
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        )}
                      </svg>
                      Ít nhất một chữ in hoa
                    </div>
                    <div className={`flex items-center text-xs ${/[0-9]/.test(password) ? 'text-green-400' : 'text-slate-400'}`}>
                      <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        {/[0-9]/.test(password) ? (
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        )}
                      </svg>
                      Ít nhất một chữ số
                    </div>
                  </motion.div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || (password.length > 0 && passwordErrors.length > 0)}
                className="w-full bg-gradient-to-r from-[#4ADE80] to-blue-400 hover:from-[#4ADE80]/90 hover:to-blue-400/90 text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
              </button>

              {/* Toggle to Login */}
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setError(null);
                    setPasswordErrors([]);
                  }}
                  disabled={isLoading}
                  className="text-[#4ADE80] hover:text-[#4ADE80]/80 transition-colors font-medium disabled:opacity-50 text-sm"
                >
                  Đã có tài khoản? Đăng nhập
                </button>
              </div>
            </motion.form>
          )}

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-slate-400">Hoặc</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.9 }}
          >
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-2.5 px-6 rounded-xl flex items-center justify-center space-x-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Đăng nhập với Google</span>
            </button>
          </motion.div>

          {/* Footer */}
          <motion.div
            className="mt-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.1 }}
          >
            <p className="text-slate-400 text-xs">
              Bằng việc đăng nhập, bạn đồng ý với{' '}
              <a href="#" className="text-[#4ADE80] hover:text-[#4ADE80]/80 transition-colors hover:underline">
                Điều khoản dịch vụ
              </a>
              {' '}và{' '}
              <a href="#" className="text-[#4ADE80] hover:text-[#4ADE80]/80 transition-colors hover:underline">
                Chính sách bảo mật
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
