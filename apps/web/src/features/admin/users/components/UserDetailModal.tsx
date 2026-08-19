import React, { useState, useEffect } from 'react';
import { BookOpen, Award, Users } from 'lucide-react';
import type { UserItem, UserDetail } from '../types';
import { Avatar, AvatarImage, AvatarFallback } from '../../../../components/ui/Avatar';
import { Dialog } from '../../../../components/ui/Dialog';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';

interface Props {
  isOpen: boolean;
  user: UserItem | null;
  onClose: () => void;
  onFetchDetail: (id: string) => Promise<UserDetail>;
}

export const UserDetailModal: React.FC<Props> = ({ isOpen, user, onClose, onFetchDetail }) => {
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
    <Dialog isOpen={isOpen} onClose={onClose} title="Chi tiết người dùng" maxWidth="lg">
      {loading ? (
        <div className="p-8 text-center animate-pulse text-sm font-bold text-slate-400">
          Đang tải dữ liệu chi tiết...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header User Card */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
            <Avatar size="lg" className="ring-2 ring-indigo-500/20">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={user.full_name || user.email} />}
              <AvatarFallback name={user.full_name || user.email} />
            </Avatar>

            <div>
              <h4 className="text-base font-extrabold text-slate-900">{user.full_name || 'Chưa đặt tên'}</h4>
              <p className="text-xs font-semibold text-slate-500">{user.email}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge variant="indigo" size="sm">
                  Vai trò: {user.role}
                </Badge>
                <Badge variant={user.is_active ? 'success' : 'danger'} size="sm">
                  {user.is_active ? 'Đang hoạt động' : 'Vô hiệu hóa'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-bold text-[10px] block">Số điện thoại</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{user.phone || 'Chưa cung cấp'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-bold text-[10px] block">Địa chỉ</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{user.address || 'Chưa cung cấp'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-bold text-[10px] block">Ngày tham gia</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {new Date(user.created_at).toLocaleString('vi-VN')}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-bold text-[10px] block">Cập nhật gần nhất</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {new Date(user.updated_at).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>

          {/* Activity Counts Breakdown */}
          {detail?._count && (
            <div>
              <h5 className="text-xs font-bold text-slate-500 mb-3">Hoạt động & thống kê</h5>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-center">
                  <BookOpen className="w-4 h-4 text-indigo-600 mx-auto" />
                  <span className="text-lg font-black text-slate-900 mt-1 block">{detail._count.classes}</span>
                  <span className="text-[10px] font-bold text-slate-500">Lớp phụ trách</span>
                </div>

                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-center">
                  <Award className="w-4 h-4 text-amber-600 mx-auto" />
                  <span className="text-lg font-black text-slate-900 mt-1 block">{detail._count.quiz_sessions}</span>
                  <span className="text-[10px] font-bold text-slate-500">Lượt thi quiz</span>
                </div>

                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-center">
                  <Users className="w-4 h-4 text-purple-600 mx-auto" />
                  <span className="text-lg font-black text-slate-900 mt-1 block">{detail._count.questions}</span>
                  <span className="text-[10px] font-bold text-slate-500">Câu hỏi đã tạo</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-end pt-4 border-t border-slate-100 mt-6">
        <Button onClick={onClose} variant="outline">
          Đóng
        </Button>
      </div>
    </Dialog>
  );
};
