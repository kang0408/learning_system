import React from 'react';
import { Eye, Edit3, Key, Trash2, RotateCcw, Skull } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UserItem, UserPagination } from '../types';
import { Avatar, AvatarImage, AvatarFallback } from '../../../../components/ui/Avatar';
import { Button } from '../../../../components/ui/Button';

interface Props {
  users: UserItem[];
  pagination: UserPagination;
  loading: boolean;
  onPageChange: (newPage: number) => void;
  onSelectDetail: (user: UserItem) => void;
  onSelectEdit: (user: UserItem) => void;
  onSelectResetPassword: (user: UserItem) => void;
  onSelectDelete: (user: UserItem) => void;
  onSelectRestore: (user: UserItem) => void;
  onSelectPermanentDelete: (user: UserItem) => void;
}

export const UserTable: React.FC<Props> = ({
  users,
  pagination,
  loading,
  onPageChange,
  onSelectDetail,
  onSelectEdit,
  onSelectResetPassword,
  onSelectDelete,
  onSelectRestore,
  onSelectPermanentDelete,
}) => {
  const { t } = useTranslation();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-900 text-white">
            ADMIN
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
            {t('adminUsers.roles.teacher', 'Giáo viên')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200/40">
            {t('adminUsers.roles.student', 'Học sinh')}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 animate-pulse space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-slate-50 rounded-xl" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
        <p className="text-base font-semibold text-slate-800">{t('adminUsers.table.empty', 'Không tìm thấy người dùng nào')}</p>
        <p className="text-xs text-slate-400 mt-1">{t('adminUsers.table.emptyDesc', 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc vai trò')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between min-h-[450px]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-6">{t('adminUsers.table.user', 'Người dùng')}</th>
              <th className="py-3.5 px-4">{t('adminUsers.table.role', 'Vai trò')}</th>
              <th className="py-3.5 px-4">{t('adminUsers.table.status', 'Trạng thái')}</th>
              <th className="py-3.5 px-4">{t('adminUsers.table.createdAt', 'Ngày tạo')}</th>
              <th className="py-3.5 px-6 text-right">{t('adminUsers.table.actions', 'Thao tác')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {users.map((user) => {
              const avatarUrl = user.avatar_url ? `${import.meta.env.VITE_API_URL}${user.avatar_url}` : undefined;
              const isSoftDeleted = !!user.deleted_at;

              return (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  {/* User Avatar + Name + Email */}
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm" className="ring-1 ring-slate-200">
                        {avatarUrl && <AvatarImage src={avatarUrl} alt={user.full_name || user.email} />}
                        <AvatarFallback name={user.full_name || user.email} />
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate text-sm">
                          {user.full_name || 'Chưa cập nhật tên'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>

                  {/* Active Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {isSoftDeleted ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                        {t('adminUsers.table.softDeleted', 'Đã khóa')}
                      </span>
                    ) : user.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        {t('adminUsers.table.active', 'Đang hoạt động')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                        {t('adminUsers.table.inactive', 'Vô hiệu hóa')}
                      </span>
                    )}
                  </td>

                  {/* Created At */}
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                    {new Date(user.created_at).toLocaleDateString('vi-VN')}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onSelectDetail(user)}
                        title={t('adminUsers.table.view', 'Xem chi tiết')}
                        className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 h-8 w-8 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onSelectEdit(user)}
                        title={t('adminUsers.table.edit', 'Chỉnh sửa thông tin / vai trò')}
                        className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 h-8 w-8 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onSelectResetPassword(user)}
                        title={t('adminUsers.table.resetPwd', 'Đổi mật khẩu')}
                        className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 h-8 w-8 rounded-lg"
                      >
                        <Key className="w-4 h-4" />
                      </Button>

                      {isSoftDeleted ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onSelectRestore(user)}
                            title={t('adminUsers.table.restore', 'Khôi phục tài khoản')}
                            className="text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 h-8 w-8 rounded-lg"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onSelectPermanentDelete(user)}
                            title={t('adminUsers.table.permanentDelete', 'Xóa vĩnh viễn khỏi CSDL')}
                            className="text-slate-400 hover:text-rose-700 hover:bg-rose-50 h-8 w-8 rounded-lg"
                          >
                            <Skull className="w-4 h-4 text-rose-600" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onSelectDelete(user)}
                          title={t('adminUsers.table.softDelete', 'Khóa tài khoản')}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Trang <strong className="text-slate-900 font-mono">{pagination.page}</strong> / <strong className="text-slate-900 font-mono">{pagination.totalPages}</strong> (Tổng cộng <span className="font-mono font-semibold">{pagination.total}</span> người dùng)
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs shadow-xs"
          >
            Trang trước
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs shadow-xs"
          >
            Trang sau
          </Button>
        </div>
      </div>
    </div>
  );
};

