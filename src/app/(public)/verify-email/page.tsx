'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { verifyEmail } from '@/services/auth/authService'

type VerificationStatus = 'loading' | 'success' | 'error'

// Animation variants - defined outside component to avoid recreation
const loadingVariants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.6, 1, 0.6],
  },
}

const successVariants = {
  initial: { scale: 0, rotate: -180, opacity: 0 },
  animate: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
}

const errorVariants = {
  initial: { x: -50, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5 },
  },
}

const VerifyEmailContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<VerificationStatus>('loading')
  const [message, setMessage] = useState<string>('')
  const [countdown, setCountdown] = useState<number>(3)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token xác thực không hợp lệ')
      return
    }

    let countdownInterval: NodeJS.Timeout | null = null
    let isMounted = true

    const verifyUserEmail = async () => {
      try {
        setStatus('loading')
        setMessage('Đang xác thực email...')
        
        // Call API to verify email
        await verifyEmail(token)
        
        if (!isMounted) return
        
        setStatus('success')
        setMessage('Email của bạn đã được xác thực thành công!')
        
        // Start countdown before redirecting
        let countdownValue = 3
        countdownInterval = setInterval(() => {
          countdownValue -= 1
          
          if (isMounted) {
            setCountdown(countdownValue)
          }
          
          if (countdownValue <= 0) {
            if (countdownInterval) {
              clearInterval(countdownInterval)
            }
            if (isMounted) {
              router.push('/login')
            }
          }
        }, 1000)
      } catch (error) {
        console.error('Email verification error:', error)
        
        if (!isMounted) return
        
        setStatus('error')
        
        if (error instanceof Error) {
          setMessage(error.message || 'Xác thực email thất bại. Vui lòng thử lại.')
        } else {
          setMessage('Xác thực email thất bại. Vui lòng thử lại.')
        }
      }
    }

    verifyUserEmail()

    return () => {
      isMounted = false
      if (countdownInterval) {
        clearInterval(countdownInterval)
      }
    }
  }, [token, router])

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0e0d15] via-[#282832] to-[#0e0d15] flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(74, 222, 128, 0.15) 0%, rgba(74, 222, 128, 0.05) 70%, transparent 100%)',
          }}
        ></div>
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-2xl"
          style={{
            background: 'radial-gradient(circle, rgba(96, 165, 250, 0.1) 0%, rgba(96, 165, 250, 0.05) 70%, transparent 100%)',
          }}
        ></div>
      </div>

      {/* Main Container */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Content */}
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            {status === 'loading' && (
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-[#4ADE80] via-emerald-400 to-blue-400 rounded-full flex items-center justify-center"
                animate="animate"
                variants={loadingVariants}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <svg
                  className="w-8 h-8 text-white animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-[#4ADE80] via-emerald-400 to-blue-400 rounded-full flex items-center justify-center"
                initial="initial"
                animate="animate"
                variants={successVariants}
              >
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center"
                initial="initial"
                animate="animate"
                variants={errorVariants}
              >
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.div>
            )}

            {/* Title */}
            <h1 className="text-2xl font-bold text-white">
              {status === 'loading' && 'Đang xác thực email'}
              {status === 'success' && 'Xác thực thành công!'}
              {status === 'error' && 'Xác thực thất bại'}
            </h1>

            {/* Message */}
            <p className="text-slate-300 text-sm leading-relaxed">
              {message}
            </p>

            {/* Redirect Info */}
            {status === 'success' && (
              <motion.div
                className="w-full pt-4 border-t border-slate-700/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-slate-400 text-sm">
                  Sẽ quay lại trang đăng nhập trong{' '}
                  <span className="font-semibold text-[#4ADE80]">{countdown}</span> giây
                </p>
              </motion.div>
            )}

            {/* Error Actions */}
            {status === 'error' && (
              <div className="w-full pt-4 space-y-3 border-t border-slate-700/50">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full px-4 py-2 bg-gradient-to-r from-[#4ADE80] to-emerald-500 hover:from-[#3fce6f] hover:to-emerald-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-[#4ADE80]/50"
                >
                  Quay lại Đăng nhập
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-all duration-300 border border-slate-600/50 hover:border-slate-500"
                >
                  Tạo tài khoản mới
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-slate-400 text-xs">
          <p>
            Nếu bạn không nhận được email, vui lòng kiểm tra thư mục Spam hoặc liên hệ
            <span className="text-[#4ADE80] font-semibold"> hỗ trợ</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

const VerifyEmailFallback = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0e0d15] via-[#282832] to-[#0e0d15] flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-slate-700/50 rounded-2xl p-8 shadow-2xl text-center">
        <p className="text-slate-300 text-sm">Đang tải trang xác thực...</p>
      </div>
    </div>
  )
}

const VerifyEmailPage = () => {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  )
}

export default VerifyEmailPage
