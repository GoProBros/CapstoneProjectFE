'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { userManagementService } from '@/services/userManagementService';
import CreateStaffUserForm from './users/CreateStaffUserForm';
import UserDetailModal from './users/UserDetailModal';
import UsersTable from './users/UsersTable';
import type {
    CreateStaffUserRequest,
    UserManagementDetail,
    UserManagementListItem,
} from '@/types/userManagement';

const PAGE_SIZE = 10;

export default function UsersFeature() {
    const [users, setUsers] = useState<UserManagementListItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [pageIndex, setPageIndex] = useState(1);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

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

    const fetchUsers = useCallback(async (page: number) => {
        setLoading(true);
        setFetchError(null);
        try {
            const result = await userManagementService.getUsers({
                pageIndex: page,
                pageSize: PAGE_SIZE,
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
    }, []);

    useEffect(() => {
        fetchUsers(pageIndex);
    }, [fetchUsers, pageIndex]);

    const roleOptions = useMemo(() => {
        return Array.from(new Set(users.map(user => user.role).filter(Boolean))).sort();
    }, [users]);

    const filteredUsers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return users.filter(user => {
            const matchSearch =
                query.length === 0 ||
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                user.phone.toLowerCase().includes(query);
            const matchRole = roleFilter === '' || user.role === roleFilter;
            return matchSearch && matchRole;
        });
    }, [users, searchQuery, roleFilter]);

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
                    Thêm Người Dùng
                </button>
            </div>

            <CreateStaffUserForm
                isOpen={isCreateOpen}
                newStaff={newStaff}
                creating={creating}
                createError={createError}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={handleCreateStaff}
                onChange={handleStaffFieldChange}
            />

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
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Tất cả vai trò</option>
                        {roleOptions.map(role => (
                            <option key={role} value={role}>
                                {role}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

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
                users={filteredUsers}
                searchQuery={searchQuery}
                roleFilter={roleFilter}
                pageIndex={pageIndex}
                totalPages={totalPages}
                totalCount={totalCount}
                onViewDetail={handleViewDetail}
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
