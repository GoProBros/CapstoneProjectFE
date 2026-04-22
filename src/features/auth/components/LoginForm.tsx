"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, User, Phone, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

const passRules = [
  { label: 'Tối thiểu 6 ký tự', test: (p: string) => p.length >= 6 },
  { label: 'Ít nhất một chữ thường', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Ít nhất một chữ in hoa', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Ít nhất một chữ số', test: (p: string) => /[0-9]/.test(p) },
];

const validatePassword = (password: string) => {
  const errors = passRules.filter(r => !r.test(password)).map(r => r.label);
  return { isValid: errors.length === 0, errors };
};

interface LoginFormProps {
  error: string | null;
  setError: (error: string | null) => void;
}

export default function LoginForm({ error, setError }: LoginFormProps) {
  const { login: authLogin, register: authRegister, loginWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerPhoneNumber, setRegisterPhoneNumber] = useState('');
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const switchTab = (signup: boolean) => {
    setIsSignUp(signup);
    setError(null);
    setPassword('');
    setEmail('');
    setRegisterFullName('');
    setRegisterPhoneNumber('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleGoogleLoginSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) { setError('Không nhận được thông tin từ Google'); return; }
    setIsLoading(true); setError(null);
    try { await loginWithGoogle(credentialResponse.credential); }
    catch (err) { setError(err instanceof Error ? err.message : 'Đăng nhập Google thất bại.'); }
    finally { setIsLoading(false); }
  };

  const handleCustomGoogleButtonClick = () => {
    // Trigger the hidden Google button
    const googleButton = googleButtonRef.current?.querySelector('[role="button"]') as HTMLElement;
    if (googleButton) {
      googleButton.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isSignUp) {
      const v = validatePassword(password);
      if (!v.isValid) { setError('Mật khẩu không đáp ứng yêu cầu.'); return; }
      if (password !== confirmPassword) { setError('Mật khẩu nhập lại không khớp.'); return; }
    }
    setIsLoading(true);
    try {
      if (isSignUp) {
        await authRegister({ email, password, fullName: registerFullName, phoneNumber: registerPhoneNumber });
      } else {
        await authLogin({ email, password });
      }
    } catch (err: any) {
      setError(err.message || (isSignUp ? 'Đăng ký thất bại. Vui lòng thử lại.' : 'Đăng nhập thất bại. Vui lòng kiểm tra lại.'));
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase = "w-full pl-9 pr-3 py-2.5 bg-slate-800/50 border-2 border-slate-700/50 rounded-xl focus:border-[#4ADE80] focus:bg-slate-800/70 focus:shadow-lg focus:shadow-[#4ADE80]/10 hover:border-slate-600/50 transition-all duration-300 text-white text-sm placeholder-slate-500 focus:outline-none disabled:opacity-50";
  const iconBase = "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4ADE80] transition-colors pointer-events-none";

  return (
    <motion.div
      className="w-full max-w-sm"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
    >
      <motion.div
        layout
        className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl shadow-black/20 mt-6 max-h-[95vh] overflow-y-auto overflow-x-hidden scrollbar-hide"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ layout: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }, duration: 0.8, delay: 0.5 }}
      >
        {/* Header */}
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <h3 className="text-xl font-bold text-white mb-1">
            {isSignUp ? 'Tạo Tài Khoản' : 'Chào Mừng Trở Lại'}
          </h3>
          <p className="text-slate-300 text-sm">
            {isSignUp ? 'Tạo tài khoản mới để bắt đầu' : 'Đăng nhập để truy cập dashboard'}
          </p>
        </motion.div>

        {/* Tab Switcher — CourtSync spring */}
        <div className="relative flex bg-slate-800/50 rounded-2xl p-1 mb-4 border border-slate-700/50">
          <motion.div
            className="absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-[#4ADE80] to-blue-400 rounded-xl shadow-lg shadow-[#4ADE80]/25"
            animate={{ x: isSignUp ? '95%' : '0%' }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          />
          <button type="button" onClick={() => switchTab(false)} disabled={isLoading}
            className={`relative z-10 flex-1 py-2 px-3 rounded-xl font-medium text-sm transition-all duration-300 ${!isSignUp ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
            Đăng nhập
          </button>
          <button type="button" onClick={() => switchTab(true)} disabled={isLoading}
            className={`relative z-10 flex-1 py-2 px-3 rounded-xl font-medium text-sm transition-all duration-300 ${isSignUp ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
            Đăng ký
          </button>
        </div>

        {/* Error Banner — CourtSync shake */}
        <AnimatePresence initial={false}>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: [0, -5, 5, -5, 5, 0] }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.5 }}
              className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 mb-4"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-xs">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ONE form — SignUp fields collapse in, Email+Password always shown */}
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* SignUp-only fields with AnimatePresence height collapse */}
          <AnimatePresence initial={false}>
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="space-y-3 overflow-hidden"
              >
                <motion.div
                  className="group"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <label className="block text-xs font-medium text-slate-300 mb-1">Họ và tên</label>
                  <div className="relative">
                    <User className={iconBase} />
                    <input type="text" value={registerFullName} onChange={e => setRegisterFullName(e.target.value)} required disabled={isLoading} className={inputBase} placeholder="Nguyễn Văn A" />
                  </div>
                </motion.div>
                <motion.div
                  className="group"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                >
                  <label className="block text-xs font-medium text-slate-300 mb-1">Số điện thoại</label>
                  <div className="relative">
                    <Phone className={iconBase} />
                    <input type="tel" value={registerPhoneNumber} onChange={e => setRegisterPhoneNumber(e.target.value)} required disabled={isLoading} className={inputBase} placeholder="0912345678" />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email — always shown */}
          <motion.div
            className="group"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.9 }}
          >
            <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
            <div className="relative">
              <Mail className={iconBase} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} className={inputBase} placeholder="your.email@example.com" />
            </div>
          </motion.div>

          {/* Password — always shown */}
          <motion.div
            className="group"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.0 }}
          >
            <label className="block text-xs font-medium text-slate-300 mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className={iconBase} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className={`${inputBase} pr-10 ${password.length > 0 && isSignUp && !validatePassword(password).isValid ? 'border-red-500/40' : ''}`}
                placeholder="••••••••"
              />
              {/* Eye toggle — CourtSync rotate animation */}
              <button
                type="button"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {showPassword ? (
                    <motion.span key="off" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                      <EyeOff className="w-4 h-4" />
                    </motion.span>
                  ) : (
                    <motion.span key="on" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                      <Eye className="w-4 h-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
            {/* Password rules — signup only */}
            <AnimatePresence initial={false}>
              {isSignUp && password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-2 grid grid-cols-2 gap-1 overflow-hidden"
                >
                  {passRules.map(rule => (
                    <div key={rule.label} className={`flex items-center gap-1 text-xs ${rule.test(password) ? 'text-[#4ADE80]' : 'text-slate-500'}`}>
                      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        {rule.test(password)
                          ? <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          : <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        }
                      </svg>
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Confirm Password — signup only, appears after password */}
          <AnimatePresence initial={false}>
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="group pt-0">
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nhập lại mật khẩu</label>
                  <div className="relative">
                    <Lock className={iconBase} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className={`${inputBase} pr-10 ${confirmPassword.length > 0 && confirmPassword !== password ? 'border-red-500/40' : confirmPassword.length > 0 && confirmPassword === password ? 'border-[#4ADE80]/50' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onMouseDown={() => setShowConfirmPassword(true)}
                      onMouseUp={() => setShowConfirmPassword(false)}
                      onMouseLeave={() => setShowConfirmPassword(false)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {showConfirmPassword ? (
                          <motion.span key="off" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                            <EyeOff className="w-4 h-4" />
                          </motion.span>
                        ) : (
                          <motion.span key="on" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                            <Eye className="w-4 h-4" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                    {confirmPassword.length > 0 && (
                      <div className={`absolute right-9 top-1/2 -translate-y-1/2 text-xs ${confirmPassword === password ? 'text-[#4ADE80]' : 'text-red-400'}`}>
                        {confirmPassword === password ? '✓' : '✗'}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forgot Password — login only */}
          <AnimatePresence initial={false}>
            {!isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="flex justify-end">
                  <a href="#" className="text-xs text-slate-400 hover:text-[#4ADE80] transition-colors duration-200">
                    Quên mật khẩu?
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit — CourtSync whileHover/whileTap + arrow nudge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.2 }}
          >
            <motion.button
              type="submit"
              disabled={isLoading || (isSignUp && password.length > 0 && !validatePassword(password).isValid) || (isSignUp && confirmPassword.length > 0 && confirmPassword !== password)}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="group w-full py-2.5 px-4 bg-gradient-to-r from-[#4ADE80] to-blue-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#4ADE80]/25 hover:shadow-xl hover:shadow-[#4ADE80]/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <motion.div
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <>
                  <span>{isSignUp ? 'Đăng ký' : 'Đăng nhập'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </motion.div>
        </form>

        {/* Divider */}
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-3 text-slate-500 text-xs">Hoặc</span></div>
        </div>

        {/* Custom Google Button */}
        <button
          onClick={handleCustomGoogleButtonClick}
          type="button"
          disabled={isLoading}
          className="group relative w-full h-11 flex items-center justify-center gap-3 rounded-xl bg-slate-800/50 border-2 border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600/50 text-white text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Tiếp tục với Google</span>
        </button>

        {/* Hidden Google Login Button */}
        <div ref={googleButtonRef} className="hidden">
          <GoogleLogin 
            onSuccess={handleGoogleLoginSuccess} 
            onError={() => setError('Đăng nhập Google thất bại. Vui lòng thử lại.')}
          />
        </div>

        {/* Footer */}
        <p className="mt-3 text-center text-slate-500 text-xs">
          Bằng việc đăng nhập, bạn đồng ý với{' '}
          <a href="#" className="text-[#4ADE80] hover:underline">Điều khoản dịch vụ</a>
          {' '}và{' '}
          <a href="#" className="text-[#4ADE80] hover:underline">Chính sách bảo mật</a>
        </p>
      </motion.div>
    </motion.div>
  );
}
