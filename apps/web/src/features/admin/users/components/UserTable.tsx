import React from 'react';
import { Eye, Edit3, Key, Trash2, RotateCcw, Shield, Skull } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UserItem, UserPagination } from '../types';
import { Avatar, AvatarImage, AvatarFallback } from '../../../../components/ui/Avatar';
import { Badge } from '../../../../components/ui/Badge';
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
          <Badge variant="indigo" size="sm" className="gap-1">
            <Shield className="w-3 h-3" /> {t('adminUsers.roles.admin', 'Admin')}
          </Badge>
        );
      case 'teacher':
        return <Badge variant="secondary" size="sm" className="bg-blue-50 text-blue-700 border-blue-200">{t('adminUsers.roles.teacher', 'Giáo viên')}</Badge>;
      default:
        return <Badge variant="success" size="sm">{t('adminUsers.roles.student', 'Học sinh')}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-pulse space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-xl" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
        <p className="text-base font-bold text-slate-700">{t('adminUsers.table.empty', 'Không tìm thấy người dùng nào')}</p>
        <p className="text-xs font-semibold text-slate-400 mt-1">{t('adminUsers.table.emptyDesc', 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc vai trò')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col justify-between min-h-[450px]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold text-slate-500">
              <th className="py-4 px-6">{t('adminUsers.table.user', 'Người dùng')}</th>
              <th className="py-4 px-4">{t('adminUsers.table.role', 'Vai trò')}</th>
              <th className="py-4 px-4">{t('adminUsers.table.status', 'Trạng thái')}</th>
              <th className="py-4 px-4">{t('adminUsers.table.createdAt', 'Ngày tạo')}</th>
              <th className="py-4 px-6 text-right">{t('adminUsers.table.actions', 'Thao tác')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {users.map((user) => {
              const avatarUrl = user.avatar_url ? `${import.meta.env.VITE_API_URL}${user.avatar_url}` : undefined;
              const isSoftDeleted = !!user.deleted_at;

              return (
                <tr key={user.id} className="hover:bg-slate-50/60 transition-colors group">
                  {/* User Avatar + Name + Email */}
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        {avatarUrl && <AvatarImage src={avatarUrl} alt={user.full_name || user.email} />}
                        <AvatarFallback name={user.full_name || user.email} />
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                          {user.full_name || 'Chưa cập nhật tên'}
                        </p>
                        <p className="text-xs font-semibold text-slate-400 truncate">{user.email}</p>
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
                      <Badge variant="danger" size="sm">{t('adminUsers.table.softDeleted', 'Đã xóa mềm')}</Badge>
                    ) : user.is_active ? (
                      <Badge variant="success" size="sm">{t('adminUsers.table.active', 'Đang hoạt động')}</Badge>
                    ) : (
                      <Badge variant="default" size="sm">{t('adminUsers.table.inactive', 'Vô hiệu hóa')}</Badge>
                    )}
                  </td>

                  {/* Created At */}
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
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
                        className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 h-8 w-8"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onSelectEdit(user)}
                        title={t('adminUsers.table.edit', 'Chỉnh sửa thông tin / vai trò')}
                        className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 h-8 w-8"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onSelectResetPassword(user)}
                        title={t('adminUsers.table.resetPwd', 'Đổi mật khẩu')}
                        className="text-slate-400 hover:text-amber-600 hover:bg-amber-50 h-8 w-8"
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
                            className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 h-8 w-8"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onSelectPermanentDelete(user)}
                            title={t('adminUsers.table.permanentDelete', 'Xóa vĩnh viễn khỏi CSDL')}
                            className="text-slate-400 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                          >
                            <Skull className="w-4 h-4 text-red-600" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onSelectDelete(user)}
                          title={t('adminUsers.table.softDelete', 'Khóa tài khoản')}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8"
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
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-500">
        <div>
          Trang <strong className="text-slate-900">{pagination.page}</strong> / <strong className="text-slate-900">{pagination.totalPages}</strong> (Tổng cộng {pagination.total} người dùng)
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            Trang trước
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Trang sau
          </Button>
        </div>
      </div>
    </div>
  );
};
