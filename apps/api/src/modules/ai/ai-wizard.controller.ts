import { Request, Response } from 'express';
import { BaseController } from '../../controllers/BaseController';
import { AiWizardService } from './ai-wizard.service';
import { AiWizardRepository, WizardDraftPayload } from './ai-wizard.repository';
import { parseDocumentBuffer } from '../../utils/documentParser';
import { wizardEvents, WizardProgressEvent } from './ai-wizard.events';
import {
  step1CurriculumSchema,
  saveDraftLessonsSchema,
  step2GenerateContentSchema,
  updateLessonDetailSchema,
  regenerateQuestionSchema,
  commitWizardSchema,
} from './ai-wizard.schema';

export class AiWizardController extends BaseController {
  constructor(
    private readonly aiWizardService: AiWizardService,
    private readonly aiWizardRepo: AiWizardRepository
  ) {
    super();
    this.getActiveDraft = this.getActiveDraft.bind(this);
    this.step1Curriculum = this.step1Curriculum.bind(this);
    this.saveDraftLessons = this.saveDraftLessons.bind(this);
    this.streamProgress = this.streamProgress.bind(this);
    this.step2GenerateContent = this.step2GenerateContent.bind(this);
    this.updateLessonDetail = this.updateLessonDetail.bind(this);
    this.regenerateQuestion = this.regenerateQuestion.bind(this);
    this.commitWizard = this.commitWizard.bind(this);
    this.deleteDraft = this.deleteDraft.bind(this);
  }

  private getUserId(req: any): string {
    return req.user?.userId || req.user?.id;
  }

  private handleClientError(res: Response, error: string, statusCode: number = 400) {
    return res.status(statusCode).json({
      success: false,
      error,
    });
  }

  /**
   * Get active draft to auto-resume on reload/reconnect
   */
  async getActiveDraft(req: any, res: Response) {
    const classId = req.query.class_id as string;
    if (!classId) return this.handleClientError(res, 'Thiếu class_id', 400);

    const draft = await this.aiWizardRepo.findActiveDraft(this.getUserId(req), classId);
    return this.handleSuccess(res, { draft });
  }

  /**
   * Step 1: Upload document or text -> Extract curriculum outline and save draft
   */
  async step1Curriculum(req: any, res: Response) {
    const parseResult = step1CurriculumSchema.safeParse(req.body);
    if (!parseResult.success) {
      return this.handleClientError(res, parseResult.error.message, 400);
    }

    const { class_id } = parseResult.data;
    let documentText = parseResult.data.document_text || '';
    let documentName = 'Tài liệu nhập tay';

    let outline: any;

    if (req.file) {
      documentName = req.file.originalname;
      const parsedDoc = await parseDocumentBuffer(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );
      documentText = parsedDoc.text;

      if (documentText && documentText.trim().length >= 50) {
        outline = await this.aiWizardService.extractCurriculumOutline(documentText);
      } else {
        // Multimodal fallback for image-scanned PDFs without selectable text layer
        outline = await this.aiWizardService.extractCurriculumOutline({
          fileBuffer: req.file.buffer,
          mimeType: req.file.mimetype,
          filename: req.file.originalname,
          text: documentText,
        });
      }
    } else {
      if (!documentText.trim()) {
        return this.handleClientError(res, 'Tài liệu không có nội dung văn bản để phân tích', 400);
      }
      outline = await this.aiWizardService.extractCurriculumOutline(documentText);
    }

    const draftPayload: WizardDraftPayload = {
      curriculum_title: outline.curriculum_title,
      description: outline.description,
      lessons: outline.lessons,
      topicsByLesson: {},
      questionsByLesson: {},
      textChunks: { full: documentText },
    };

    const draft = await this.aiWizardRepo.saveOrUpdateDraft(
      this.getUserId(req),
      class_id,
      'curriculum_ready',
      documentName,
      draftPayload
    );

    return this.handleSuccess(res, {
      draft_id: draft.id,
      curriculum_title: outline.curriculum_title,
      description: outline.description,
      lessons: outline.lessons,
    }, 201);
  }

  /**
   * Save / reorder draft lessons (Cards Drag & Drop and CRUD)
   */
  async saveDraftLessons(req: any, res: Response) {
    const parseResult = saveDraftLessonsSchema.safeParse(req.body);
    if (!parseResult.success) {
      return this.handleClientError(res, parseResult.error.message, 400);
    }

    const { class_id, curriculum_title, description, lessons } = parseResult.data;
    const existingDraft = await this.aiWizardRepo.findActiveDraft(this.getUserId(req), class_id);
    const existingPayload = (existingDraft?.payload as any) || {};

    const mergedLessons = (lessons as any[]).map((l) => {
      const existingLesson = existingPayload.lessons?.find((el: any) => el.temp_id === l.temp_id);
      return {
        ...l,
        status: l.status || existingLesson?.status || 'pending',
        topics_count: l.topics_count ?? existingLesson?.topics_count ?? 0,
        questions_count: l.questions_count ?? existingLesson?.questions_count ?? 0,
      };
    });

    const updatedPayload: WizardDraftPayload = {
      ...existingPayload,
      curriculum_title,
      description: description || existingPayload.description,
      lessons: mergedLessons,
    };

    const draft = await this.aiWizardRepo.saveOrUpdateDraft(
      this.getUserId(req),
      class_id,
      existingDraft?.step || 'curriculum_ready',
      existingDraft?.document_name || null,
      updatedPayload
    );

    return this.handleSuccess(res, { draft_id: draft.id, lessons: mergedLessons });
  }

  /**
   * Server-Sent Events (SSE) for Real-Time Progress Streaming
   */
  async streamProgress(req: any, res: Response) {
    const classId = req.query.class_id as string;
    if (!classId) return this.handleClientError(res, 'Thiếu class_id', 400);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', class_id: classId })}\n\n`);

    const onProgress = (event: WizardProgressEvent) => {
      if (event.class_id === classId) {
        res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      }
    };

    wizardEvents.on('progress', onProgress);

    req.on('close', () => {
      wizardEvents.off('progress', onProgress);
      res.end();
    });
  }

  /**
   * Step 2: Parallel Batch Generation of Topics and Questions
   */
  async step2GenerateContent(req: any, res: Response) {
    const parseResult = step2GenerateContentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return this.handleClientError(res, parseResult.error.message, 400);
    }

    const { class_id, lesson_temp_ids } = parseResult.data;
    const existingDraft = await this.aiWizardRepo.findActiveDraft(this.getUserId(req), class_id);
    if (!existingDraft) {
      return this.handleClientError(res, 'Không tìm thấy bản nháp hợp lệ cho lớp học này', 404);
    }

    const payload = existingDraft.payload as unknown as WizardDraftPayload;
    const lessonsToGenerate = lesson_temp_ids && lesson_temp_ids.length > 0
      ? payload.lessons.filter((l) => lesson_temp_ids.includes(l.temp_id))
      : payload.lessons;

    // Run batch with progress emitter & incremental draft saving
    const batchResult = await this.aiWizardService.generateBatchUnitsContent(
      lessonsToGenerate,
      payload.textChunks || {},
      async (progressEvent) => {
        wizardEvents.emit('progress', {
          ...progressEvent,
          class_id,
        });

        if (progressEvent.type === 'unit_completed' && progressEvent.lesson_temp_id) {
          try {
            const currentDraft = await this.aiWizardRepo.findActiveDraft(this.getUserId(req), class_id);
            const currentPayload = (currentDraft?.payload as unknown as WizardDraftPayload) || payload;

            const unitId = progressEvent.lesson_temp_id;
            const updatedTopics = {
              ...(currentPayload.topicsByLesson || {}),
              [unitId]: progressEvent.topics || [],
            };
            const updatedQuestions = {
              ...(currentPayload.questionsByLesson || {}),
              [unitId]: progressEvent.questions || [],
            };
            const updatedLessons = (currentPayload.lessons || []).map((l) => {
              if (l.temp_id === unitId) {
                return {
                  ...l,
                  status: 'ready' as const,
                  topics_count: progressEvent.topics?.length ?? l.topics_count,
                  questions_count: progressEvent.questions?.length ?? l.questions_count,
                };
              }
              return l;
            });

            await this.aiWizardRepo.saveOrUpdateDraft(
              this.getUserId(req),
              class_id,
              'ready_for_review',
              currentDraft?.document_name || existingDraft.document_name,
              {
                ...currentPayload,
                lessons: updatedLessons,
                topicsByLesson: updatedTopics,
                questionsByLesson: updatedQuestions,
              }
            );
          } catch (saveErr) {
            console.error('Failed to incrementally save wizard draft unit', saveErr);
          }
        }
      }
    );

    // Merge final batch result into draft payload
    const updatedTopicsByLesson = { ...(payload.topicsByLesson || {}), ...batchResult.topicsByLesson };
    const updatedQuestionsByLesson = { ...(payload.questionsByLesson || {}), ...batchResult.questionsByLesson };

    // Update lesson items status
    const updatedLessons = payload.lessons.map((l) => {
      const generated = batchResult.lessons.find((bl) => bl.temp_id === l.temp_id);
      return generated || l;
    });

    const updatedPayload: WizardDraftPayload = {
      ...payload,
      lessons: updatedLessons,
      topicsByLesson: updatedTopicsByLesson,
      questionsByLesson: updatedQuestionsByLesson,
    };

    await this.aiWizardRepo.saveOrUpdateDraft(
      this.getUserId(req),
      class_id,
      'ready_for_review',
      existingDraft.document_name,
      updatedPayload
    );

    return this.handleSuccess(res, {
      lessons: updatedLessons,
      topicsByLesson: updatedTopicsByLesson,
      questionsByLesson: updatedQuestionsByLesson,
    });
  }

  /**
   * Update modal detail (Topics + Questions of a specific lesson)
   */
  async updateLessonDetail(req: any, res: Response) {
    const parseResult = updateLessonDetailSchema.safeParse(req.body);
    if (!parseResult.success) {
      return this.handleClientError(res, parseResult.error.message, 400);
    }

    const { class_id, lesson_temp_id, topics, questions } = parseResult.data;
    const existingDraft = await this.aiWizardRepo.findActiveDraft(this.getUserId(req), class_id);
    if (!existingDraft) {
      return this.handleClientError(res, 'Không tìm thấy bản nháp hợp lệ', 404);
    }

    const payload = existingDraft.payload as unknown as WizardDraftPayload;
    const updatedTopicsByLesson = { ...(payload.topicsByLesson || {}), [lesson_temp_id]: topics as any };
    const updatedQuestionsByLesson = { ...(payload.questionsByLesson || {}), [lesson_temp_id]: questions as any };

    const updatedLessons = payload.lessons.map((l) => {
      if (l.temp_id === lesson_temp_id) {
        return {
          ...l,
          status: 'ready' as const,
          topics_count: topics.length,
          questions_count: questions.length,
        };
      }
      return l;
    });

    const updatedPayload: WizardDraftPayload = {
      ...payload,
      lessons: updatedLessons,
      topicsByLesson: updatedTopicsByLesson,
      questionsByLesson: updatedQuestionsByLesson,
    };

    await this.aiWizardRepo.saveOrUpdateDraft(
      this.getUserId(req),
      class_id,
      'ready_for_review',
      existingDraft.document_name,
      updatedPayload
    );

    return this.handleSuccess(res, { success: true, lesson_temp_id, topics, questions });
  }

  /**
   * Regenerate a single question in Modal
   */
  async regenerateQuestion(req: any, res: Response) {
    const parseResult = regenerateQuestionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return this.handleClientError(res, parseResult.error.message, 400);
    }

    const { class_id, lesson_temp_id, question_temp_id, instruction } = parseResult.data;
    const existingDraft = await this.aiWizardRepo.findActiveDraft(this.getUserId(req), class_id);
    if (!existingDraft) {
      return this.handleClientError(res, 'Không tìm thấy bản nháp', 404);
    }

    const payload = existingDraft.payload as unknown as WizardDraftPayload;
    const lessonQuestions = payload.questionsByLesson?.[lesson_temp_id] || [];
    const questionToRegen = lessonQuestions.find((q) => q.temp_id === question_temp_id);

    if (!questionToRegen) {
      return this.handleClientError(res, 'Không tìm thấy câu hỏi để sinh lại', 404);
    }

    const unitText = payload.textChunks?.[lesson_temp_id] || payload.textChunks?.full || '';
    const newQuestion = await this.aiWizardService.regenerateSingleQuestion(
      questionToRegen,
      unitText,
      instruction
    );

    const updatedLessonQuestions = lessonQuestions.map((q) =>
      q.temp_id === question_temp_id ? newQuestion : q
    );

    const updatedQuestionsByLesson = {
      ...payload.questionsByLesson,
      [lesson_temp_id]: updatedLessonQuestions,
    };

    const updatedPayload: WizardDraftPayload = {
      ...payload,
      questionsByLesson: updatedQuestionsByLesson,
    };

    await this.aiWizardRepo.saveOrUpdateDraft(
      this.getUserId(req),
      class_id,
      'ready_for_review',
      existingDraft.document_name,
      updatedPayload
    );

    return this.handleSuccess(res, { question: newQuestion });
  }

  /**
   * Commit all data to database transaction and clear draft
   */
  async commitWizard(req: any, res: Response) {
    const parseResult = commitWizardSchema.safeParse(req.body);
    if (!parseResult.success) {
      return this.handleClientError(res, parseResult.error.message, 400);
    }

    const { class_id } = parseResult.data;
    const existingDraft = await this.aiWizardRepo.findActiveDraft(this.getUserId(req), class_id);
    if (!existingDraft) {
      return this.handleClientError(res, 'Không tìm thấy bản nháp để lưu', 404);
    }

    const payload = existingDraft.payload as unknown as WizardDraftPayload;
    const result = await this.aiWizardRepo.commitWizardToDatabase(
      this.getUserId(req),
      class_id,
      payload
    );

    return this.handleSuccess(res, {
      ...result,
      message: 'Đã lưu thành công toàn bộ Lộ trình và Bài tập vào lớp học!',
    });
  }

  /**
   * Discard active draft
   */
  async deleteDraft(req: any, res: Response) {
    const classId = (req.query.class_id || req.body?.class_id) as string;
    if (!classId) return this.handleClientError(res, 'Thiếu class_id', 400);

    await this.aiWizardRepo.deleteDraft(this.getUserId(req), classId);
    return this.handleSuccess(res, { message: 'Đã hủy bản nháp thành công' });
  }
}
