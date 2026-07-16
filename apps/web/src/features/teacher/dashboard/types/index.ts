export interface TeacherClassItem {
  id: string;
  name: string;
  description: string;
  subject: string;
  join_code: string;
  _count?: { members: number };
}

export interface CreateClassPayload {
  name: string;
  subject: string;
  description: string;
}
