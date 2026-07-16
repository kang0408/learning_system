export interface StudentInfo {
  id: string;
  full_name: string;
  email: string;
}

export interface ClassMember {
  student: StudentInfo;
  joined_at: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

export interface GetMembersResponse {
  data: ClassMember[];
  meta: PaginationMeta;
}
