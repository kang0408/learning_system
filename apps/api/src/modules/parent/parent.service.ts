import { ParentRepository } from './parent.repository';
import { ApiError } from '../../lib/ApiError';

export class ParentService {
  constructor(private readonly parentRepository: ParentRepository) {}

  async linkStudent(parentId: string, studentEmail: string) {
    const student = await this.parentRepository.findStudentByEmail(studentEmail);
    if (!student || student.role !== 'student') throw new ApiError(404, 'Student not found');

    return this.parentRepository.createParentStudentLink(parentId, student.id);
  }

  async getChildren(parentId: string) {
    const links = await this.parentRepository.getChildren(parentId);
    
    return links.map(link => ({
      link_id: link.id,
      student_id: link.student.id,
      email: link.student.email,
      full_name: link.student.full_name,
      avatar_url: link.student.avatar_url,
      linked_at: link.linked_at
    }));
  }

  async unlinkStudent(parentId: string, studentId: string) {
    const link = await this.parentRepository.findLink(parentId, studentId);
    
    if (!link) throw new ApiError(404, 'Link not found');

    await this.parentRepository.deleteLink(link.id);
    
    return true;
  }
}
