import React from 'react';
import { Search, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UserFiltersState } from '../types';
import { Select } from '../../../../components/ui/Select';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';

interface Props {
  filters: UserFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<UserFiltersState>>;
  onOpenCreateModal: () => void;
}

export const UserFilters: React.FC<Props> = ({ filters, setFilters, onOpenCreateModal }) => {
  const { t } = useTranslation();

  const roleOptions = [
    { label: t('adminUsers.filters.allRoles', 'Tất cả vai trò'), value: '' },
    { label: t('adminUsers.roles.student', 'Học sinh'), value: 'student' },
    { label: t('adminUsers.roles.teacher', 'Giáo viên'), value: 'teacher' },
    { label: t('adminUsers.roles.admin', 'Quản trị viên'), value: 'admin' },
  ];

  const statusOptions = [
    { label: t('adminUsers.filters.allStatus', 'Tất cả trạng thái'), value: '' },
    { label: t('adminUsers.filters.active', 'Đang hoạt động'), value: 'true' },
    { label: t('adminUsers.filters.inactive', 'Vô hiệu hóa / Xóa mềm'), value: 'false' },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Input
            type="text"
            value={filters.search || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
            placeholder={t('adminUsers.filters.searchPlaceholder', 'Tìm kiếm theo tên hoặc email...')}
            className="pl-10"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Role Select */}
        <div className="w-full sm:w-48">
          <Select
            value={filters.role || ''}
            onChange={(val) => setFilters(prev => ({ ...prev, role: val, page: 1 }))}
            options={roleOptions}
            placeholder={t('adminUsers.filters.allRoles', 'Chọn vai trò')}
          />
        </div>

        {/* Status Select */}
        <div className="w-full sm:w-48">
          <Select
            value={filters.is_active || ''}
            onChange={(val) => setFilters(prev => ({ ...prev, is_active: val, page: 1 }))}
            options={statusOptions}
            placeholder={t('adminUsers.filters.allStatus', 'Chọn trạng thái')}
          />
        </div>
      </div>

      {/* Add User Button */}
      <Button
        onClick={onOpenCreateModal}
        variant="primary"
        className="flex-shrink-0 gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold"
      >
        <UserPlus className="w-4 h-4" />
        {t('adminUsers.header.create', 'Thêm người dùng')}
      </Button>
    </div>
  );
};
