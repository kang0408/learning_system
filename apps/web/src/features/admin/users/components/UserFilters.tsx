import React from 'react';
import { Search, UserPlus } from 'lucide-react';
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
  const roleOptions = [
    { label: 'Tất cả vai trò', value: '' },
    { label: 'Học sinh', value: 'student' },
    { label: 'Giáo viên', value: 'teacher' },
    { label: 'Phụ huynh', value: 'parent' },
    { label: 'Quản trị viên', value: 'admin' },
  ];

  const statusOptions = [
    { label: 'Tất cả trạng thái', value: '' },
    { label: 'Đang hoạt động', value: 'true' },
    { label: 'Vô hiệu hóa / Xóa mềm', value: 'false' },
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
            placeholder="Tìm kiếm theo tên hoặc email..."
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
            placeholder="Chọn vai trò"
          />
        </div>

        {/* Status Select */}
        <div className="w-full sm:w-48">
          <Select
            value={filters.is_active || ''}
            onChange={(val) => setFilters(prev => ({ ...prev, is_active: val, page: 1 }))}
            options={statusOptions}
            placeholder="Chọn trạng thái"
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
        Thêm người dùng
      </Button>
    </div>
  );
};
