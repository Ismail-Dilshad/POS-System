import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/charts/stats-cards';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DeleteModal } from '@/components/ui/delete-modal';
import { useToast } from '@/components/ui/toast';
import { UserFilter, type UserFilterOptions } from '@/components/filters/user-filter';
import { UserModal } from '@/components/modals/user-modal';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import {
    formatDatePart,
    formatTimePart,
    type TimestampInput,
} from '@/lib/datetime';
import { userService, type User } from '@/services/business/userService';
import { type BreadcrumbItem } from '@/types';
import { type Column } from '@/types/table';
import { Head } from '@inertiajs/react';
import {
    Edit,
    Plus,
    RefreshCw,
    Shield,
    Trash2,
    UserCheck,
    User as UserIcon,
    Users as UsersIcon,
    UserX,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Users() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [refreshing, setRefreshing] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<UserFilterOptions>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('navigation.admin') },
        { title: t('navigation.users'), href: '/admin/users' },
    ];

    // Load users from backend
    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await userService.getUsers();
            if (response.success && response.data) {
                setUsers(response.data);
            }
        } catch {
            // You could add toast notification here
        } finally {
            setLoading(false);
        }
    };

    // Load users on component mount
    useEffect(() => {
        loadUsers();
    }, []);

    // Filter and sort users
    const filteredUsers = users.filter((user) => {
        // Search filter (name and username)
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            const matchesName = user.full_name
                .toLowerCase()
                .includes(searchTerm);
            const matchesUsername = user.username
                .toLowerCase()
                .includes(searchTerm);

            if (!matchesName && !matchesUsername) return false;
        }

        // Role filter
        if (filters.role && filters.role !== 'all') {
            if (user.role !== filters.role) return false;
        }

        // Status filter
        if (filters.status && filters.status !== 'all') {
            if (filters.status === 'active' && !user.is_active) return false;
            if (filters.status === 'inactive' && user.is_active) return false;
        }

        return true;
    });

    // User table columns
    const userColumns: Column<User>[] = [
        {
            key: 'full_name',
            header: t('users.table_columns.full_name'),
            accessor: 'full_name',
            sortable: true,
            headerClassName: 'text-blue-700 dark:text-blue-300',
            render: (value) => (
                <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-[#1F3F3F]/60 dark:text-[#1F3F3F]/40" />
                    <span className="font-medium">{String(value || '')}</span>
                </div>
            ),
        },
        {
            key: 'username',
            header: t('users.table_columns.username'),
            accessor: 'username',
            sortable: true,
            headerClassName: 'text-indigo-700 dark:text-indigo-300',
            render: (value) => (
                <span className="font-mono text-sm text-muted-foreground">
                    {String(value || '')}
                </span>
            ),
        },
        {
            key: 'role',
            header: t('users.table_columns.role'),
            accessor: 'role',
            sortable: true,
            headerClassName: 'text-green-700 dark:text-green-300',
            render: (value) => {
                const roleConfig = {
                    admin: {
                        label: t('users.role_labels.admin'),
                        className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
                    },
                    cashier: {
                        label: t('users.role_labels.cashier'),
                        className: 'bg-primary-100 text-[#1F3F3F]/80 border-primary-200 hover:bg-primary-200 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-800',
                    },
                    dataentry: {
                        label: t('users.role_labels.dataentry'),
                        className:
                            'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
                    },
                };
                const config = roleConfig[value as keyof typeof roleConfig];
                return (
                    <Badge variant="outline" className={config.className}>
                        {config.label}
                    </Badge>
                );
            },
        },
        {
            key: 'is_active',
            header: t('users.table_columns.status'),
            accessor: 'is_active',
            sortable: true,
            headerClassName: 'text-purple-700 dark:text-purple-300',
            render: (value) => (
                <Badge
                    variant={value ? 'default' : 'secondary'}
                    className={
                        value
                            ? 'border-green-200 bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                            : 'border-gray-200 bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800'
                    }
                >
                    {value ? t('users.status_labels.active') : t('users.status_labels.inactive')}
                </Badge>
            ),
        },
        {
            key: 'phone',
            header: t('users.table_columns.phone'),
            accessor: 'phone',
            sortable: true,
            headerClassName: 'text-red-700 dark:text-red-300',
            render: (value) => (
                <span className="text-sm text-muted-foreground">
                    {String(value || 'N/A')}
                </span>
            ),
        },
        {
            key: 'created_at',
            header: t('users.table_columns.created'),
            accessor: 'created_at',
            sortable: true,
            headerClassName: 'text-teal-700 dark:text-teal-300',
            render: (value) => {
                const date = formatDatePart(value as TimestampInput, '');
                const time = formatTimePart(value as TimestampInput, '');

                if (!date && !time) {
                    return (
                        <span className="text-sm text-muted-foreground">
                            N/A
                        </span>
                    );
                }

                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                            {date || 'N/A'}
                        </span>
                        {time ? (
                            <span className="text-xs text-muted-foreground">
                                {time}
                            </span>
                        ) : null}
                    </div>
                );
            },
        },
        {
            key: 'actions',
            header: t('users.table_columns.actions'),
            headerClassName: 'text-pink-700 dark:text-pink-300',
            render: (_, row) => (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(row)}
                        className="h-8 w-8 p-0 border-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
                        title={t('users.action_titles.edit_user')}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(row)}
                        disabled={row.username === 'admin'}
                        className={`h-8 w-8 p-0 border-0 ${
                            row.username === 'admin'
                                ? 'cursor-not-allowed opacity-50'
                                : 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20'
                        }`}
                        title={
                            row.username === 'admin'
                                ? t('users.action_titles.cannot_delete_admin')
                                : t('users.action_titles.delete_user')
                        }
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    // Pagination logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await loadUsers();
        } catch {
            // Failed to refresh users
        } finally {
            setRefreshing(false);
        }
    };

    const handleAddUser = () => {
        setEditingUser(null);
        setIsUserModalOpen(true);
    };

    const handleUserModalClose = () => {
        setIsUserModalOpen(false);
        setEditingUser(null);
    };

    const handleSaveUser = async (userData: User) => {
        try {
            if (editingUser) {
                // Update existing user
                await userService.updateUser(editingUser.id!, userData);
            } else {
                // Create new user
                await userService.createUser(userData);
            }

            // Reload users list
            await loadUsers();
        } catch {
            throw new Error(t('users.error_messages.save_failed')); // Re-throw to let the modal handle the error
        }
    };

    // Action handlers
    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleDeleteUser = (user: User) => {
        // Check if this is the first admin user (username: 'admin')
        if (user.username === 'admin') {
            // Show error toast for first admin
            toast({
                title: t('users.error_messages.cannot_delete_admin'),
                description: t('users.error_messages.cannot_delete_admin_desc'),
                type: 'error',
            });
            return;
        }

        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteModalClose = () => {
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        try {
            await userService.deleteUser(userToDelete.id!);
            await loadUsers();
            handleDeleteModalClose();

            toast({
                title: t('users.error_messages.user_deleted'),
                description: t('users.error_messages.user_deleted_desc', { name: userToDelete.full_name }),
                type: 'success',
            });
        } catch {
            toast({
                title: t('users.error_messages.delete_failed'),
                description: t('users.error_messages.delete_failed_desc'),
                type: 'error',
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('navigation.users')} />
            <div className="flex flex-1 flex-col gap-6 rounded-xl p-6">
                <PageHeader
                    title={t('users.title')}
                    description={t('users.description')}
                >
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="!border-indigo-300 !bg-indigo-50 !text-indigo-700 hover:!border-indigo-500 hover:!bg-indigo-100 dark:!border-indigo-600 dark:!bg-indigo-900/20 dark:!text-indigo-300 dark:hover:!border-indigo-500 dark:hover:!bg-indigo-900/30"
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                            />
                            {refreshing ? t('users.refreshing') : t('users.refresh')}
                        </Button>
                        <Button size="sm" onClick={handleAddUser} className="!border-teal-300 !bg-teal-50 !text-teal-700 hover:!border-teal-500 hover:!bg-teal-100 dark:!border-teal-600 dark:!bg-teal-900/20 dark:!text-teal-300 dark:hover:!border-teal-500 dark:hover:!bg-teal-900/30">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('users.add_user')}
                        </Button>
                    </div>
                </PageHeader>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title={t('users.users')}
                        value={users.length.toString()}
                        description={t('users.total_users')}
                        icon={UsersIcon}
                        color="blue"
                        badge={{
                            text: t('users.total_count'),
                            variant: 'secondary',
                            color: 'blue',
                        }}
                    />
                    <StatCard
                        title={t('users.active_users')}
                        value={users
                            .filter((user) => user.is_active)
                            .length.toString()}
                        description={t('users.active_users_desc')}
                        icon={UserCheck}
                        color="green"
                        badge={{
                            text: t('users.active'),
                            variant: 'default',
                            color: 'green',
                        }}
                    />
                    <StatCard
                        title={t('users.admins')}
                        value={users
                            .filter((user) => user.role === 'admin')
                            .length.toString()}
                        description={t('users.admins_desc')}
                        icon={Shield}
                        color="red"
                        badge={{
                            text: t('users.admin'),
                            variant: 'destructive',
                            color: 'red',
                        }}
                    />
                    <StatCard
                        title={t('users.inactive_users')}
                        value={users
                            .filter((user) => !user.is_active)
                            .length.toString()}
                        description={t('users.inactive_users_desc')}
                        icon={UserX}
                        color="orange"
                        badge={{
                            text: t('users.inactive'),
                            variant: 'secondary',
                            color: 'orange',
                        }}
                    />
                </div>

                {/* Filter Component */}
                <UserFilter
                    filters={filters}
                    onFiltersChange={setFilters}
                    className="bg-background"
                />

                {/* Users Data Table */}
                <DataTable
                    title={t('users.users')}
                    subtitle={`${t('users.showing')} ${filteredUsers.length} ${t('users.of')} ${users.length} ${t('users.users')}`}
                    data={paginatedUsers}
                    columns={userColumns}
                    loading={loading}
                    emptyMessage={
                        Object.keys(filters).length > 0
                            ? t('users.empty_states.no_users_filtered')
                            : t('users.empty_states.no_users_found')
                    }
                    pagination={{
                        currentPage,
                        totalPages,
                        pageSize: itemsPerPage,
                        onPageChange: setCurrentPage,
                        totalItems: filteredUsers.length,
                    }}
                />

                {/* User Modal */}
                <UserModal
                    isOpen={isUserModalOpen}
                    onClose={handleUserModalClose}
                    user={editingUser}
                    onSave={handleSaveUser}
                />

                {/* Delete Modal */}
                <DeleteModal
                    isOpen={isDeleteModalOpen}
                    title={t('users.delete_modal.title')}
                    description={
                        userToDelete
                            ? t('users.delete_modal.description', { name: userToDelete.full_name })
                            : ''
                    }
                    confirmButtonText={t('users.delete_modal.confirm')}
                    cancelButtonText={t('users.delete_modal.cancel')}
                    onConfirm={handleDeleteConfirm}
                    onClose={handleDeleteModalClose}
                />
            </div>
        </AppLayout>
    );
}
