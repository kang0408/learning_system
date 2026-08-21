import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '../../lib/prisma';
import { WizardLesson, WizardTopic, WizardQuestion } from './ai-wizard.schema';

export interface WizardDraftPayload {
  curriculum_title: string;
  description?: string;
  lessons: WizardLesson[];
  topicsByLesson: Record<string, WizardTopic[]>;
  questionsByLesson: Record<string, WizardQuestion[]>;
  textChunks?: Record<string, string>;
}

export class AiWizardRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  /**
   * Find active draft for a teacher and class
   */
  async findActiveDraft(teacherId: string, classId: string) {
    return this.db.aiWizardDraft.findUnique({
      where: {
        teacher_id_class_id: {
          teacher_id: teacherId,
          class_id: classId,
        },
      },
    });
  }

  /**
   * Create or update draft
   */
  async saveOrUpdateDraft(
    teacherId: string,
    classId: string,
    step: string,
    documentName: string | null,
    payload: WizardDraftPayload
  ) {
    return this.db.aiWizardDraft.upsert({
      where: {
        teacher_id_class_id: {
          teacher_id: teacherId,
          class_id: classId,
        },
      },
      create: {
        teacher_id: teacherId,
        class_id: classId,
        step,
        document_name: documentName,
        payload: payload as any,
      },
      update: {
        step,
        document_name: documentName !== undefined ? documentName : undefined,
        payload: payload as any,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Delete draft (e.g. when teacher cancels or commits)
   */
  async deleteDraft(teacherId: string, classId: string) {
    return this.db.aiWizardDraft.deleteMany({
      where: {
        teacher_id: teacherId,
        class_id: classId,
      },
    });
  }

  /**
   * Atomic Prisma Transaction to commit all generated curriculum, topics, questions and assignments
   */
  async commitWizardToDatabase(
    teacherId: string,
    classId: string,
    payload: WizardDraftPayload
  ) {
    return this.db.$transaction(async (tx) => {
      let curriculumsCount = 0;
      let topicsCount = 0;
      let questionsCount = 0;
      let assignmentsCount = 0;

      const lessons = payload.lessons || [];
      const topicsByLesson = payload.topicsByLesson || {};
      const questionsByLesson = payload.questionsByLesson || {};

      for (const lesson of lessons) {
        // 1. Create ClassCurriculum
        const curriculum = await tx.classCurriculum.create({
          data: {
            class_id: classId,
            title: lesson.title,
            content_html: `<p>${lesson.summary || lesson.title}</p>`,
            order_index: lesson.order_index,
          },
        });
        curriculumsCount++;

        // 2. Create Topics for this lesson
        const lessonTopics = topicsByLesson[lesson.temp_id] || [];
        const topicMap: Record<string, string> = {};

        for (const top of lessonTopics) {
          const code = 'TP' + Math.random().toString(36).substring(2, 6).toUpperCase();
          const createdTopic = await tx.topic.create({
            data: {
              name: top.name,
              code: code,
              description: top.description || null,
              created_by: teacherId,
            },
          });
          topicsCount++;
          topicMap[top.temp_id] = createdTopic.id;
        }

        const fallbackTopicId = Object.values(topicMap)[0] || null;
        const lessonQuestions = questionsByLesson[lesson.temp_id] || [];

        // 3. Only create Assignment & questions if there are questions generated
        if (lessonQuestions.length > 0) {
          const assignment = await tx.assignment.create({
            data: {
              class_id: classId,
              created_by: teacherId,
              title: `Bài tập: ${lesson.title}`,
              description: `Bài tập củng cố kiến thức cho ${lesson.title}`,
              mode: 'adaptive',
              is_published: true,
              is_all_students: true,
            },
          });
          assignmentsCount++;

          // Link CurriculumAssignment
          await tx.curriculumAssignment.create({
            data: {
              curriculum_id: curriculum.id,
              assignment_id: assignment.id,
              order_index: 0,
            },
          });

          // 4. Create Questions, Options and Link to Assignment
          for (let qIdx = 0; qIdx < lessonQuestions.length; qIdx++) {
            const q = lessonQuestions[qIdx];
            const topicId = topicMap[q.topic_temp_id] || fallbackTopicId;

            const explanationWithQuote = [
              q.evidence_quote ? `[Dẫn chứng: ${q.evidence_quote}]` : '',
              q.explanation || '',
            ]
              .filter(Boolean)
              .join('\n');

            let normalizedMetadata = undefined;
            if (q.metadata && Object.keys(q.metadata).length > 0) {
              if (Array.isArray(q.metadata.pairs)) {
                normalizedMetadata = {
                  ...q.metadata,
                  pairs: q.metadata.pairs.map((p: any) => ({
                    leftId: p.leftId || randomUUID(),
                    leftText: p.leftText || '',
                    rightId: p.rightId || randomUUID(),
                    rightText: p.rightText || '',
                  })),
                };
              } else {
                normalizedMetadata = q.metadata;
              }
            }

            const createdQuestion = await tx.question.create({
              data: {
                created_by: teacherId,
                topic_id: topicId,
                content: q.content,
                question_type: q.question_type as any,
                difficulty: q.difficulty,
                explanation: explanationWithQuote || null,
                metadata: normalizedMetadata,
                is_public: false,
              },
            });
            questionsCount++;

            // Create answer options
            if (q.answer_options && q.answer_options.length > 0) {
              await tx.answerOption.createMany({
                data: q.answer_options.map((opt, optIdx) => ({
                  question_id: createdQuestion.id,
                  content: opt.content,
                  is_correct: opt.is_correct,
                  order_index: opt.order_index ?? optIdx,
                })),
              });
            }

            // Link AssignmentQuestion
            await tx.assignmentQuestion.create({
              data: {
                assignment_id: assignment.id,
                question_id: createdQuestion.id,
                order_index: qIdx,
              },
            });
          }
        }
      }

      // 6. Clean up draft
      await tx.aiWizardDraft.deleteMany({
        where: {
          teacher_id: teacherId,
          class_id: classId,
        },
      });

      return {
        curriculums_created: curriculumsCount,
        topics_created: topicsCount,
        questions_created: questionsCount,
        assignments_created: assignmentsCount,
      };
    });
  }
}
