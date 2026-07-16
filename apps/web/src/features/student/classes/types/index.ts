export interface Teacher {
  id?: string;
  full_name?: string;
}

export interface ClassDetails {
  id?: string;
  name?: string;
  description?: string;
  teacher?: Teacher;
}

export interface ClassItem {
  id: string;
  class_id: string;
  name?: string;
  description?: string;
  teacher_name?: string;
  class?: ClassDetails;
}

export interface JoinClassPayload {
  join_code: string;
}
