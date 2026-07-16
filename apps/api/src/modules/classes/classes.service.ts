import { ApiError } from '../../lib/ApiError';
import { ClassesRepository } from './classes.repository';
import crypto from 'crypto';

export class ClassesService {
  constructor(private readonly classesRepository: ClassesRepository) {}
  async createClass(data: any, teacherId: string) {
    const joinCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
    return this.classesRepository.createClass({
        name: data.name,
        subject: data.subject,
        description: data.description,
        join_code: joinCode,
        teacher_id: teacherId
      });
  }

  async getTeacherClasses(teacherId: string) {
    return this.classesRepository.findTeacherClasses(teacherId);
  }

  async getClassById(classId: string) {
    const classData = await this.classesRepository.findClassById(classId);
    if (!classData) throw new ApiError(404, 'Class not found');
    return classData;
  }

  async updateClass(classId: string, teacherId: string, data: any) {
    const classData = await this.getClassById(classId);
    if (classData.teacher_id !== teacherId) throw new ApiError(403, 'Forbidden');
    
    return this.classesRepository.updateClass(classId, { ...data, updated_at: new Date() });
  }

  async deleteClass(classId: string, teacherId: string) {
    const classData = await this.getClassById(classId);
    if (classData.teacher_id !== teacherId) throw new ApiError(403, 'Forbidden');

    return this.classesRepository.updateClass(classId, { deleted_at: new Date() });
  }

  async getClassMembers(classId: string, teacherId: string, page = 1, limit = 20) {
    const classData = await this.getClassById(classId);
    if (classData.teacher_id !== teacherId) throw new ApiError(403, 'Forbidden');

    const members = await this.classesRepository.findClassMembers(classId, (page - 1) * limit, limit);
    
    const total = await this.classesRepository.countClassMembers(classId);
    return { members, meta: { page, limit, total } };
  }

  async removeMember(classId: string, teacherId: string, studentId: string) {
    const classData = await this.getClassById(classId);
    if (classData.teacher_id !== teacherId) throw new ApiError(403, 'Forbidden');

    return this.classesRepository.deactivateMember(classId, studentId);
  }

  async joinClass(studentId: string, joinCode: string) {
    const classData = await this.classesRepository.findClassByJoinCode(joinCode);
    if (!classData) throw new ApiError(404, 'Mã lớp không tồn tại hoặc đã hết hiệu lực');

    const existing = await this.classesRepository.checkMembership(classData.id, studentId);
    
    if (existing && existing.is_active) {
      throw new ApiError(409, 'Bạn đã là thành viên của lớp này');
    }

    if (existing && !existing.is_active) {
      return this.classesRepository.reactivateMember(existing.id);
    }

    return this.classesRepository.createMember(classData.id, studentId);
  }

  async getMyClasses(studentId: string) {
    return this.classesRepository.findStudentClasses(studentId);
  }
}
