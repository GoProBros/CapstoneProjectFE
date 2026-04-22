'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userManagementService } from '@/services/admin/userManagementService';
import CreateStaffUserForm from './users/CreateStaffUserForm';
import UserDetailModal from './users/UserDetailModal';
import UsersTable from './users/UsersTable';
import type {
    CreateStaffUserRequest,
    UserManagementDetail,
    UserManagementListItem,
    UserManagementRoleFilter,
    UserManagementStatusValue,
} from '@/types/userManagement';

const PAGE_SIZE = 10;

const ROLE_FILTER_OPTIONS: Array<{ value: '' | '1' | '2'; label: string }> = [
    { value: '', label: 'Tất cả vai trò' },
    { value: '1', label: 'Người dùng' },
    { value: '2', label: 'Nhân viên' },
];

const isActiveStatus = (status: string): boolean => {
    const normalizedStatus = status.trim().toLowerCase();
    return normalizedStatus === 'active' || normalizedStatus === '1';
};

export function UsersFeature() {
    const { user } = useAuth();
    const [users, setUsers] = useState<UserManagementListItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [pageIndex, setPageIndex] = useState(1);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusActionUserId, setStatusActionUserId] = useState<string | null>(null);
    const [statusActionError, setStatusActionError] = useState<string | null>(null);

    const [selectedUser, setSelectedUser] = useState<UserManagementDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [createSuccess, setCreateSuccess] = useState<string | null>(null);
    const [newStaff, setNewStaff] = useState<CreateStaffUserRequest>({
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        requireEmailVerification: false,
    });

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const normalizedRole = user?.role?.trim().toLowerCase() ?? '';
    const isAdminRole =
        normalizedRole === 'admin' ||
        normalizedRole === 'administrator' ||
        normalizedRole === 'quản trị viên';

    const selectedRoleFilter = useMemo<UserManagementRoleFilter | undefined>(() => {
        if (roleFilter === '1') {
            return 1;
        }

        if (roleFilter === '2') {
            return 2;
        }

        if (roleFilter === '3') {
            return 3;
        }

        return undefined;
    }, [roleFilter]);

    const fetchUsers = useCallback(async (page: number) => {
        setLoading(true);
        setFetchError(null);
        try {
            const result = await userManagementService.getUsers({
                pageIndex: page,
                pageSize: PAGE_SIZE,
                role: selectedRoleFilter,
                search: searchQuery,
            });

            setUsers(result.items ?? []);
            setTotalCount(result.totalCount ?? 0);
        } catch (error) {
            setFetchError(error instanceof Error ? error.message : 'Không thể tải danh sách người dùng');
            setUsers([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedRoleFilter]);

    useEffect(() => {
        fetchUsers(pageIndex);
    }, [fetchUsers, pageIndex]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSearchQuery(searchInput.trim());
        }, 350);

        return () => {
            window.clearTimeout(timer);
        };
    }, [searchInput]);

    useEffect(() => {
        setPageIndex(1);
    }, [searchQuery, roleFilter]);

    const handleViewDetail = async (userId: string) => {
        setIsDetailModalOpen(true);
        setDetailLoading(true);
        setDetailError(null);
        setSelectedUser(null);
        try {
            const detail = await userManagementService.getUserDetail(userId);
            setSelectedUser(detail);
        } catch (error) {
            setDetailError(error instanceof Error ? error.message : 'Không thể tải chi tiết người dùng');
            setSelectedUser(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setDetailError(null);
        setDetailLoading(false);
        setSelectedUser(null);
    };

    const handleToggleUserStatus = async (user: UserManagementListItem) => {
        const nextStatus: UserManagementStatusValue = isActiveStatus(user.status) ? 0 : 1;

        setStatusActionUserId(user.id);
        setStatusActionError(null);

        try {
            await userManagementService.updateUserStatus(user.id, { status: nextStatus });

            if (selectedUser?.id === user.id) {
                setSelectedUser(prev => (prev ? { ...prev, status: nextStatus === 1 ? 'Active' : 'InActive' } : prev));
            }

            await fetchUsers(pageIndex);
        } catch (error) {
            setStatusActionError(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái người dùng');
        } finally {
            setStatusActionUserId(null);
        }
    };

    const handleStaffFieldChange = <K extends keyof CreateStaffUserRequest>(
        field: K,
        value: CreateStaffUserRequest[K]
    ) => {
        setNewStaff(prev => ({ ...prev, [field]: value }));
    };

    const handleCreateStaff = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setCreating(true);
        setCreateError(null);
        setCreateSuccess(null);
        try {
            const payload: CreateStaffUserRequest = {
                email: newStaff.email.trim(),
                password: newStaff.password,
                fullName: newStaff.fullName.trim(),
                phoneNumber: newStaff.phoneNumber.trim(),
                requireEmailVerification: newStaff.requireEmailVerification ?? false,
            };

            await userManagementService.createStaffUser(payload);
            setCreateSuccess('Tạo tài khoản nhân viên thành công');
            setNewStaff({
                email: '',
                password: '',
                fullName: '',
                phoneNumber: '',
                requireEmailVerification: false,
            });
            setIsCreateOpen(false);
            fetchUsers(pageIndex);
        } catch (error) {
            setCreateError(error instanceof Error ? error.message : 'Không thể tạo tài khoản nhân viên');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-headline mb-2">
                        Quản Lý Người Dùng
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                        Quản lý tài khoản người dùng, phân quyền và xem báo cáo hoạt động
                    </p>
                </div>
                {isAdminRole && (
                    <button
                        onClick={() => {
                            setIsCreateOpen(true);
                            setCreateError(null);
                            setCreateSuccess(null);
                        }}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Thêm Nhân Viên
                    </button>
                )}
            </div>

            {isAdminRole && (
                <CreateStaffUserForm
                    isOpen={isCreateOpen}
                    newStaff={newStaff}
                    creating={creating}
                    createError={createError}
                    onClose={() => setIsCreateOpen(false)}
                    onSubmit={handleCreateStaff}
                    onChange={handleStaffFieldChange}
                />
            )}

            {createSuccess && (
                <div className="px-4 py-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
                    {createSuccess}
                </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Tìm kiếm người dùng..."
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        {ROLE_FILTER_OPTIONS.map(option => (
                            <option key={option.value || 'all'} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {statusActionError && (
                <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
                    <span>{statusActionError}</span>
                    <button onClick={() => setStatusActionError(null)} className="ml-4 underline text-sm shrink-0">
                        Đóng
                    </button>
                </div>
            )}

            {fetchError && (
                <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
                    <span>{fetchError}</span>
                    <button onClick={() => fetchUsers(pageIndex)} className="ml-4 underline text-sm shrink-0">
                        Thử lại
                    </button>
                </div>
            )}

            <UsersTable
                loading={loading}
                users={users}
                searchQuery={searchQuery}
                roleFilter={roleFilter}
                pageIndex={pageIndex}
                totalPages={totalPages}
                totalCount={totalCount}
                onViewDetail={handleViewDetail}
                onToggleStatus={handleToggleUserStatus}
                statusActionUserId={statusActionUserId}
                onPrevPage={() => setPageIndex(prev => Math.max(1, prev - 1))}
                onNextPage={() => setPageIndex(prev => Math.min(totalPages, prev + 1))}
            />

            <UserDetailModal
                isOpen={isDetailModalOpen}
                loading={detailLoading}
                error={detailError}
                user={selectedUser}
                onClose={handleCloseDetailModal}
            />
        </div>
    );
}
