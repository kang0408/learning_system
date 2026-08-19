import { useState } from 'react';
import { useAdminUsers } from '../../features/admin/users/hooks/useAdminUsers';
import { UserFilters } from '../../features/admin/users/components/UserFilters';
import { UserTable } from '../../features/admin/users/components/UserTable';
import { CreateUserModal } from '../../features/admin/users/components/CreateUserModal';
import { EditUserModal } from '../../features/admin/users/components/EditUserModal';
import { ResetPasswordModal } from '../../features/admin/users/components/ResetPasswordModal';
import { UserDetailModal } from '../../features/admin/users/components/UserDetailModal';
import { ConfirmDialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { toast } from '../../utils/toast';
import { Users, RefreshCw } from 'lucide-react';
import type { UserItem } from '../../features/admin/users/types';

export default function AdminUserManagement() {
  const {
    users,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    fetchUsers,
    createUser,
    updateUser,
    resetPassword,
    deleteUser,
    hardDeleteUser,
    restoreUser,
    fetchUserDetail,
  } = useAdminUsers();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEditUser, setSelectedEditUser] = useState<UserItem | null>(null);
  const [selectedResetUser, setSelectedResetUser] = useState<UserItem | null>(null);
  const [selectedDetailUser, setSelectedDetailUser] = useState<UserItem | null>(null);

  // State for Delete, Restore & Permanent Delete Confirmations
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [userToRestore, setUserToRestore] = useState<UserItem | null>(null);
  const [userToPermanentDelete, setUserToPermanentDelete] = useState<UserItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleRefresh = async () => {
    await fetchUsers();
    toast.info('Đã cập nhật lại danh sách người dùng');
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    try {
      await deleteUser(userToDelete.id);
      toast.success(`Đã xóa mềm tài khoản ${userToDelete.full_name || userToDelete.email} thành công!`);
      setUserToDelete(null);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Lỗi khi xóa người dùng';
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!userToRestore) return;
    setActionLoading(true);
    try {
      await restoreUser(userToRestore.id);
      toast.success(`Đã khôi phục tài khoản ${userToRestore.full_name || userToRestore.email} thành công!`);
      setUserToRestore(null);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Lỗi khi khôi phục người dùng';
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!userToPermanentDelete) return;
    setActionLoading(true);
    try {
      await hardDeleteUser(userToPermanentDelete.id);
      toast.success(`Đã xóa VĨNH VIỄN tài khoản ${userToPermanentDelete.full_name || userToPermanentDelete.email} khỏi hệ thống!`);
      setUserToPermanentDelete(null);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Lỗi khi xóa vĩnh viễn người dùng';
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-200">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý người dùng hệ thống</h1>
          </div>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Quản lý tài khoản toàn bộ học sinh, giáo viên, phụ huynh và quản trị viên hệ thống
          </p>
        </div>

        <Button 
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-sm font-bold">
          {error}
        </div>
      )}

      {/* Filters Bar */}
      <UserFilters
        filters={filters}
        setFilters={setFilters}
        onOpenCreateModal={() => setIsCreateOpen(true)}
      />

      {/* Users Data Table */}
      <UserTable
        users={users}
        pagination={pagination}
        loading={loading}
        onPageChange={handlePageChange}
        onSelectDetail={(u) => setSelectedDetailUser(u)}
        onSelectEdit={(u) => setSelectedEditUser(u)}
        onSelectResetPassword={(u) => setSelectedResetUser(u)}
        onSelectDelete={(u) => setUserToDelete(u)}
        onSelectRestore={(u) => setUserToRestore(u)}
        onSelectPermanentDelete={(u) => setUserToPermanentDelete(u)}
      />

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={createUser}
      />

      <EditUserModal
        isOpen={!!selectedEditUser}
        user={selectedEditUser}
        onClose={() => setSelectedEditUser(null)}
        onSubmit={updateUser}
      />

      <ResetPasswordModal
        isOpen={!!selectedResetUser}
        user={selectedResetUser}
        onClose={() => setSelectedResetUser(null)}
        onSubmit={resetPassword}
      />

      <UserDetailModal
        isOpen={!!selectedDetailUser}
        user={selectedDetailUser}
        onClose={() => setSelectedDetailUser(null)}
        onFetchDetail={fetchUserDetail}
      />

      {/* Soft Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Xóa mềm tài khoản"
        description={`Bạn có chắc chắn muốn xóa mềm tài khoản ${userToDelete?.full_name || userToDelete?.email}? Tài khoản sẽ chuyển sang trạng thái vô hiệu hóa.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        isDanger={true}
        isLoading={actionLoading}
      />

      {/* Restore User Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!userToRestore}
        onClose={() => setUserToRestore(null)}
        onConfirm={handleConfirmRestore}
        title="Khôi phục tài khoản"
        description={`Khôi phục tài khoản người dùng ${userToRestore?.full_name || userToRestore?.email} và cho phép truy cập lại hệ thống?`}
        confirmText="Xác nhận khôi phục"
        cancelText="Hủy"
        isDanger={false}
        isLoading={actionLoading}
      />

      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!userToPermanentDelete}
        onClose={() => setUserToPermanentDelete(null)}
        onConfirm={handleConfirmPermanentDelete}
        title="Xóa VĨNH VIỄN tài khoản"
        description={`Bạn có chắc chắn muốn xóa VĨNH VIỄN tài khoản ${userToPermanentDelete?.full_name || userToPermanentDelete?.email} khỏi cơ sở dữ liệu? Thao tác này không thể khôi phục.`}
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy"
        isDanger={true}
        isLoading={actionLoading}
      />
    </div>
  );
}
