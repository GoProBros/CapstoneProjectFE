'use client';

import type { CreateStaffUserRequest } from '@/types/userManagement';

interface CreateStaffUserFormProps {
    isOpen: boolean;
    newStaff: CreateStaffUserRequest;
    creating: boolean;
    createError: string | null;
    onClose: () => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onChange: <K extends keyof CreateStaffUserRequest>(field: K, value: CreateStaffUserRequest[K]) => void;
}

export default function CreateStaffUserForm({
    isOpen,
    newStaff,
    creating,
    createError,
    onClose,
    onSubmit,
    onChange,
}: CreateStaffUserFormProps) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
                onClick={event => event.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Tạo tài khoản nhân viên</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={onSubmit} className="px-6 py-5">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Họ tên</label>
                            <input
                                type="text"
                                placeholder="Nhập họ tên"
                                value={newStaff.fullName}
                                onChange={e => onChange('fullName', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Số điện thoại</label>
                            <input
                                type="text"
                                placeholder="Nhập số điện thoại"
                                value={newStaff.phoneNumber}
                                onChange={e => onChange('phoneNumber', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                type="email"
                                placeholder="Nhập email"
                                value={newStaff.email}
                                onChange={e => onChange('email', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mật khẩu</label>
                            <input
                                type="password"
                                placeholder="Nhập mật khẩu"
                                value={newStaff.password}
                                onChange={e => onChange('password', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Yêu cầu xác thực email</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Bật để gửi email xác minh cho tài khoản mới</p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={newStaff.requireEmailVerification ?? false}
                            onClick={() => onChange('requireEmailVerification', !(newStaff.requireEmailVerification ?? false))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                (newStaff.requireEmailVerification ?? false)
                                    ? 'bg-green-500'
                                    : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    (newStaff.requireEmailVerification ?? false) ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>

                    {createError && (
                        <p className="mt-3 text-sm text-red-500">{createError}</p>
                    )}

                    <div className="mt-5 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                        >
                            {creating ? 'Đang tạo...' : 'Tạo nhân viên'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
