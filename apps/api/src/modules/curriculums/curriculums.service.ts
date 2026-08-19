import { CurriculumsRepository } from './curriculums.repository';
import { ApiError } from '../../lib/ApiError';
import { CreateCurriculumInput, UpdateCurriculumInput, ReorderCurriculumsInput } from './curriculums.schema';

export function normalizeVideoMetadata(url?: string | null, customType?: string | null): {
  normalizedUrl: string | null;
  videoType: string | null;
} {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return { normalizedUrl: null, videoType: null };
  }

  const trimmed = url.trim();

  // 1. Google Drive: https://drive.google.com/file/d/{id}/view...
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return {
      normalizedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      videoType: customType || 'drive'
    };
  }

  // 2. YouTube: https://www.youtube.com/watch?v={id} hoặc https://youtu.be/{id}
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      normalizedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      videoType: customType || 'youtube'
    };
  }

  // 3. Vimeo: https://vimeo.com/{id}
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      normalizedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      videoType: customType || 'vimeo'
    };
  }

  return {
    normalizedUrl: trimmed,
    videoType: customType || 'direct'
  };
}

export function sanitizeHtmlContent(html: string): string {
  if (!html) return '';
  // Basic security sanitization to remove script tags and malicious javascript: URIs & event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:[^"']*/gi, '');
}

export class CurriculumsService {
  constructor(private readonly curriculumsRepository: CurriculumsRepository) {}

  private async verifyTeacherClassAccess(classId: string, teacherId: string) {
    const classData = await this.curriculumsRepository.findClassById(classId);
    if (!classData) {
      throw new ApiError(404, 'Class not found');
    }
    if (classData.teacher_id !== teacherId) {
      throw new ApiError(403, 'Forbidden: Class does not belong to you');
    }
    return classData;
  }

  private async verifyStudentClassAccess(classId: string, studentId: string) {
    const classData = await this.curriculumsRepository.findClassById(classId);
    if (!classData || !classData.is_active) {
      throw new ApiError(404, 'Class not found or inactive');
    }
    const membership = await this.curriculumsRepository.checkStudentMembership(classId, studentId);
    if (!membership || !membership.is_active) {
      throw new ApiError(403, 'Forbidden: You are not an active member of this class');
    }
    return classData;
  }

  async createCurriculum(classId: string, teacherId: string, data: CreateCurriculumInput) {
    await this.verifyTeacherClassAccess(classId, teacherId);

    const maxOrder = await this.curriculumsRepository.findMaxOrderIndex(classId);
    const nextOrder = maxOrder + 1;

    const { normalizedUrl, videoType } = normalizeVideoMetadata(data.video_url, data.video_type);
    const cleanContent = sanitizeHtmlContent(data.content_html);

    return this.curriculumsRepository.createCurriculum({
      class_id: classId,
      title: data.title,
      content_html: cleanContent,
      video_url: normalizedUrl,
      video_type: videoType,
      order_index: nextOrder,
      is_published: data.is_published ?? true,
      materials: data.materials,
      assignment_ids: data.assignment_ids
    });
  }

  async getCurriculumsByClass(classId: string, user: { userId: string; role: string }) {
    if (user.role === 'teacher') {
      await this.verifyTeacherClassAccess(classId, user.userId);
      return this.curriculumsRepository.findCurriculumsByClassId(classId, true);
    } else {
      await this.verifyStudentClassAccess(classId, user.userId);
      return this.curriculumsRepository.findCurriculumsByClassId(classId, false);
    }
  }

  async getCurriculumById(curriculumId: string, user: { userId: string; role: string }) {
    const curriculum = await this.curriculumsRepository.findCurriculumById(curriculumId);
    if (!curriculum) {
      throw new ApiError(404, 'Curriculum item not found');
    }

    if (user.role === 'teacher') {
      await this.verifyTeacherClassAccess(curriculum.class_id, user.userId);
    } else {
      await this.verifyStudentClassAccess(curriculum.class_id, user.userId);
      if (!curriculum.is_published) {
        throw new ApiError(404, 'Curriculum item is not published');
      }
    }

    return curriculum;
  }

  async updateCurriculum(curriculumId: string, teacherId: string, data: UpdateCurriculumInput) {
    const existing = await this.curriculumsRepository.findCurriculumById(curriculumId);
    if (!existing) {
      throw new ApiError(404, 'Curriculum item not found');
    }

    await this.verifyTeacherClassAccess(existing.class_id, teacherId);

    const updatePayload: any = {};
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.content_html !== undefined) updatePayload.content_html = sanitizeHtmlContent(data.content_html);
    if (data.is_published !== undefined) updatePayload.is_published = data.is_published;
    if (data.materials !== undefined) updatePayload.materials = data.materials;
    if (data.assignment_ids !== undefined) updatePayload.assignment_ids = data.assignment_ids;

    if (data.video_url !== undefined) {
      const { normalizedUrl, videoType } = normalizeVideoMetadata(data.video_url, data.video_type);
      updatePayload.video_url = normalizedUrl;
      updatePayload.video_type = videoType;
    } else if (data.video_type !== undefined) {
      updatePayload.video_type = data.video_type;
    }

    return this.curriculumsRepository.updateCurriculum(curriculumId, updatePayload);
  }

  async deleteCurriculum(curriculumId: string, teacherId: string) {
    const existing = await this.curriculumsRepository.findCurriculumById(curriculumId);
    if (!existing) {
      throw new ApiError(404, 'Curriculum item not found');
    }

    await this.verifyTeacherClassAccess(existing.class_id, teacherId);

    await this.curriculumsRepository.deleteCurriculum(curriculumId);
    return { id: curriculumId, deleted: true };
  }

  async reorderCurriculums(classId: string, teacherId: string, data: ReorderCurriculumsInput) {
    await this.verifyTeacherClassAccess(classId, teacherId);

    await this.curriculumsRepository.reorderCurriculums(classId, data.orders);
    return this.curriculumsRepository.findCurriculumsByClassId(classId, true);
  }
}
