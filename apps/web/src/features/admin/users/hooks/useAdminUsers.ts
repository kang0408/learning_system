import { useState, useEffect, useCallback } from 'react';
import api from '../../../../api/axios';
import type { UserItem, UserDetail, UserPagination, UserFiltersState } from '../types';

export function useAdminUsers() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState<UserPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<UserFiltersState>({
    page: 1,
    limit: 10,
    role: '',
    is_active: '',
    search: '',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.role) params.role = filters.role;
      if (filters.is_active) params.is_active = filters.is_active;
      if (filters.search) params.search = filters.search;

      const res = await api.get('/api/users/admin/list', { params });
      if (res.data?.data) {
        setUsers(res.data.data);
        if (res.data.meta) {
          setPagination(res.data.meta);
        }
      }
    } catch (err: any) {
      console.error('Fetch admin users failed:', err);
      setError(err.response?.data?.error || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = async (data: any) => {
    const res = await api.post('/api/users/admin', data);
    await fetchUsers();
    return res.data;
  };

  const updateUser = async (id: string, data: any) => {
    const res = await api.patch(`/api/users/admin/${id}`, data);
    await fetchUsers();
    return res.data;
  };

  const resetPassword = async (id: string, new_password: string) => {
    const res = await api.patch(`/api/users/admin/${id}/password`, { new_password });
    return res.data;
  };

  const deleteUser = async (id: string) => {
    const res = await api.delete(`/api/users/admin/${id}`);
    await fetchUsers();
    return res.data;
  };

  const hardDeleteUser = async (id: string) => {
    const res = await api.delete(`/api/users/admin/${id}/permanent`);
    await fetchUsers();
    return res.data;
  };

  const restoreUser = async (id: string) => {
    const res = await api.post(`/api/users/admin/${id}/restore`);
    await fetchUsers();
    return res.data;
  };

  const fetchUserDetail = async (id: string): Promise<UserDetail> => {
    const res = await api.get(`/api/users/admin/${id}`);
    return res.data.data;
  };

  return {
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
  };
}
