import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';

interface MembersHeaderProps {
  classId: string;
}

export const MembersHeader: React.FC<MembersHeaderProps> = ({ classId }) => {
  return (
    <div className="flex items-center bg-white p-6 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] transition-all duration-300">
      <Link 
        to={`/teacher/classes/${classId}`} 
        className="mr-6 p-3 border-2 border-transparent hover:border-zinc-900 hover:bg-indigo-100 transition-colors"
      >
        <ArrowLeft className="w-6 h-6 text-zinc-900" />
      </Link>
      <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 flex items-center">
        <Users className="w-8 h-8 mr-4 text-indigo-600" />
        Danh sách Học sinh
      </h1>
    </div>
  );
};
