export interface UserItem {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  avatar_url?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface UserDetail extends UserItem {
  _count?: {
    classes: number;
    class_members: number;
    questions: number;
    quiz_sessions: number;
    parent_links: number;
    student_links: number;
  };
}

export interface UserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserFiltersState {
  page: number;
  limit: number;
  role?: string;
  is_active?: string;
  search?: string;
}
