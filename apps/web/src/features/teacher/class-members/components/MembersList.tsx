import React from 'react';
import { Link } from 'react-router-dom';
import { UserMinus, Loader2 } from 'lucide-react';
import type { ClassMember } from '../types';

interface MembersListProps {
  classId: string;
  members: ClassMember[];
  isRemoving: boolean;
  onRemove: (studentId: string) => void;
}

export const MembersList: React.FC<MembersListProps> = ({ classId, members, isRemoving, onRemove }) => {
  return (
    <div className="overflow-x-auto bg-white border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-zinc-100 border-b-4 border-zinc-900">
            <th className="p-6 font-black uppercase tracking-widest text-zinc-900">Học sinh</th>
            <th className="p-6 font-black uppercase tracking-widest text-zinc-900">Email</th>
            <th className="p-6 font-black uppercase tracking-widest text-zinc-900 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-zinc-200">
          {members.map((m) => (
            <tr key={m.student.id} className="hover:bg-indigo-50 transition-colors">
              <td className="p-6 flex items-center">
                <Link 
                  to={`/teacher/classes/${classId}/members/${m.student.id}`}
                  className="flex items-center hover:text-indigo-600 transition group"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-zinc-900 bg-indigo-200 text-indigo-900 flex items-center justify-center font-black text-xl mr-4 group-hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                    {m.student.full_name?.charAt(0) || '?'}
                  </div>
                  <span className="font-bold text-lg text-zinc-900 uppercase tracking-wider">{m.student.full_name}</span>
                </Link>
              </td>
              <td className="p-6 text-zinc-600 font-bold">{m.student.email}</td>
              <td className="p-6 text-right">
                <button 
                  onClick={() => onRemove(m.student.id)}
                  disabled={isRemoving}
                  className="text-white bg-red-600 border-2 border-zinc-900 hover:bg-red-700 disabled:opacity-50 px-4 py-2 font-black uppercase tracking-widest flex items-center inline-flex shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] active:translate-y-[2px] active:shadow-none transition-all"
                  title="Xóa khỏi lớp"
                >
                  {isRemoving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <UserMinus className="w-5 h-5 mr-2" />} 
                  Xóa
                </button>
              </td>
            </tr>
          ))}
          {members.length === 0 && (
            <tr>
              <td colSpan={3} className="p-12 text-center text-zinc-500 font-bold uppercase tracking-wider">
                Chưa có học sinh nào trong lớp.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
