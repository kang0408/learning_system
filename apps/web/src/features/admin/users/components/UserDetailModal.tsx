import React, { useState, useEffect } from 'react';
import { BookOpen, Award, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UserItem, UserDetail } from '../types';
import { Avatar, AvatarImage, AvatarFallback } from '../../../../components/ui/Avatar';
import { Dialog } from '../../../../components/ui/Dialog';
import { Button } from '../../../../components/ui/Button';

interface Props {
  isOpen: boolean;
  user: UserItem | null;
  onClose: () => void;
  onFetchDetail: (id: string) => Promise<UserDetail>;
}

export const UserDetailModal: React.FC<Props> = ({ isOpen, user, onClose, onFetchDetail }) => {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setLoading(true);
      onFetchDetail(user.id)
        .then(res => setDetail(res))
        .catch(err => console.error('Fetch detail failed:', err))
        .finally(() => setLoading(false));
    }
  }, [user, isOpen, onFetchDetail]);

  if (!user) return null;

  const avatarUrl = user.avatar_url ? `${import.meta.env.VITE_API_URL}${user.avatar_url}` : undefined;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t('adminUsers.detailModal.title', 'Chi tiết người dùng')} maxWidth="lg">
      {loading ? (
        <div className="py-12 text-center text-xs font-mono font-semibold text-slate-400 animate-pulse">
          {t('common.loading', 'Đang tải dữ liệu...')}
        </div>
      ) : (
        <div className="space-y-6 pt-1">
          {/* Header User Card */}
          <div className="flex items-center gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
            <Avatar size="lg" className="ring-2 ring-slate-200 shadow-xs flex-shrink-0">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={user.full_name || user.email} />}
              <AvatarFallback name={user.full_name || user.email} />
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="text-base font-bold text-slate-900 truncate">{user.full_name || '---'}</h4>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-900 text-white">
                    {user.role.toUpperCase()}
                  </span>
                  {user.is_active ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      {t('adminUsers.table.active', 'Đang hoạt động')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                      {t('adminUsers.table.inactive', 'Vô hiệu hóa')}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{user.email}</p>
            </div>
          </div>

          {/* Profile Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                {t('adminUsers.table.phone', 'Số điện thoại')}
              </span>
              <span className="font-mono font-semibold text-slate-800 mt-1 block">
                {user.phone || '---'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                {t('adminUsers.createModal.address', 'Địa chỉ')}
              </span>
              <span className="font-semibold text-slate-800 mt-1 block truncate">
                {user.address || '---'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                {t('adminUsers.table.createdAt', 'Ngày tham gia')}
              </span>
              <span className="font-mono font-semibold text-slate-800 mt-1 block">
                {new Date(user.created_at).toLocaleDateString('vi-VN')}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                {t('adminUsers.detailModal.lastLogin', 'Cập nhật gần nhất')}
              </span>
              <span className="font-mono font-semibold text-slate-800 mt-1 block">
                {new Date(user.updated_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>

          {/* Activity Statistics Cards Breakdown */}
          {detail?._count && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                Hoạt động & thống kê
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70 text-center">
                  <BookOpen className="w-4 h-4 text-slate-400 mx-auto" />
                  <span className="text-xl font-bold font-mono text-slate-900 mt-1.5 block">
                    {detail._count.classes}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 block truncate">
                    {t('adminUsers.detailModal.managedClasses', 'Lớp phụ trách')}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70 text-center">
                  <Award className="w-4 h-4 text-slate-400 mx-auto" />
                  <span className="text-xl font-bold font-mono text-slate-900 mt-1.5 block">
                    {detail._count.quiz_sessions}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 block truncate">
                    Lượt thi quiz
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70 text-center">
                  <HelpCircle className="w-4 h-4 text-slate-400 mx-auto" />
                  <span className="text-xl font-bold font-mono text-slate-900 mt-1.5 block">
                    {detail._count.questions}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 block truncate">
                    Câu hỏi đã tạo
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-end pt-4 border-t border-slate-100 mt-6">
        <Button
          onClick={onClose}
          variant="outline"
          className="border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          {t('adminUsers.detailModal.close', 'Đóng')}
        </Button>
      </div>
    </Dialog>
  );
};
