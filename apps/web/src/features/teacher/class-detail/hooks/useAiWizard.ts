import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherAiWizardApi } from '../api/teacherAiWizardApi';
import type {
  WizardDraft,
  WizardLesson,
  WizardTopic,
  WizardQuestion,
  WizardProgressEvent,
} from '../types/aiWizard.types';

export function useAiWizard(classId: string) {
  const queryClient = useQueryClient();

  // Local working state
  const [curriculumTitle, setCurriculumTitle] = useState('');
  const [curriculumDescription, setCurriculumDescription] = useState('');
  const [lessons, setLessons] = useState<WizardLesson[]>([]);
  const [topicsByLesson, setTopicsByLesson] = useState<Record<string, WizardTopic[]>>({});
  const [questionsByLesson, setQuestionsByLesson] = useState<Record<string, WizardQuestion[]>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const cleanupSseRef = useRef<(() => void) | null>(null);

  // 1. Fetch active draft
  const draftQuery = useQuery({
    queryKey: ['ai-wizard-draft', classId],
    queryFn: () => teacherAiWizardApi.getActiveDraft(classId),
    enabled: !!classId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Sync state when draft is loaded
  useEffect(() => {
    if (draftQuery.data?.payload) {
      const p = draftQuery.data.payload;
      setCurriculumTitle((prev) => prev || p.curriculum_title || '');
      setCurriculumDescription((prev) => prev || p.description || '');

      setLessons((prev) => {
        if (!p.lessons || p.lessons.length === 0) return prev;
        return p.lessons.map((fetchedLesson) => {
          const local = prev.find((l) => l.temp_id === fetchedLesson.temp_id);
          // If local state already has status 'ready', preserve ready status and counts if fetched is stale
          if (local && local.status === 'ready' && fetchedLesson.status !== 'ready') {
            return {
              ...fetchedLesson,
              status: 'ready',
              topics_count: local.topics_count,
              questions_count: local.questions_count,
            };
          }
          return fetchedLesson;
        });
      });

      setTopicsByLesson((prev) => ({
        ...p.topicsByLesson,
        ...prev,
      }));

      setQuestionsByLesson((prev) => ({
        ...p.questionsByLesson,
        ...prev,
      }));
    }
  }, [draftQuery.data]);

  // Clean up SSE on unmount
  useEffect(() => {
    return () => {
      if (cleanupSseRef.current) {
        cleanupSseRef.current();
        cleanupSseRef.current = null;
      }
    };
  }, []);

  // 2. Step 1: Upload & Extract Outline
  const step1Mutation = useMutation({
    mutationFn: (payload: { file?: File; documentText?: string }) =>
      teacherAiWizardApi.step1Curriculum(classId, payload),
    onSuccess: (data) => {
      setCurriculumTitle(data.curriculum_title);
      setCurriculumDescription(data.description);
      setLessons(data.lessons);
      setTopicsByLesson({});
      setQuestionsByLesson({});
      queryClient.invalidateQueries({ queryKey: ['ai-wizard-draft', classId] });
    },
  });

  // 3. Save / reorder lessons
  const saveLessonsMutation = useMutation({
    mutationFn: (updatedLessons: WizardLesson[]) =>
      teacherAiWizardApi.saveDraftLessons(
        classId,
        curriculumTitle,
        curriculumDescription,
        updatedLessons
      ),
    onSuccess: (data) => {
      setLessons(data.lessons);
      queryClient.invalidateQueries({ queryKey: ['ai-wizard-draft', classId] });
    },
  });

  // 4. Batch generate topics & questions with Real-time SSE
  const startBatchGeneration = useCallback(
    async (lessonTempIds?: string[]) => {
      setIsGenerating(true);
      setOverallProgress(0);

      // Set target lessons to 'processing'
      setLessons((prev) =>
        prev.map((l) =>
          !lessonTempIds || lessonTempIds.includes(l.temp_id)
            ? { ...l, status: 'processing' }
            : l
        )
      );

      // Open SSE listener
      if (cleanupSseRef.current) {
        cleanupSseRef.current();
      }

      cleanupSseRef.current = teacherAiWizardApi.createProgressStream(
        classId,
        (event: WizardProgressEvent) => {
          if (event.progress_pct !== undefined) {
            setOverallProgress(event.progress_pct);
          }

          if (event.type === 'unit_started' && event.lesson_temp_id) {
            setLessons((prev) =>
              prev.map((l) =>
                l.temp_id === event.lesson_temp_id ? { ...l, status: 'processing' } : l
              )
            );
          }

          if (event.type === 'unit_completed' && event.lesson_temp_id) {
            const unitId = event.lesson_temp_id;
            if (event.topics) {
              setTopicsByLesson((prev) => ({ ...prev, [unitId]: event.topics! }));
            }
            if (event.questions) {
              setQuestionsByLesson((prev) => ({ ...prev, [unitId]: event.questions! }));
            }
            setLessons((prev) =>
              prev.map((l) =>
                l.temp_id === unitId
                  ? {
                      ...l,
                      status: 'ready',
                      topics_count: event.topics?.length ?? l.topics_count,
                      questions_count: event.questions?.length ?? l.questions_count,
                    }
                  : l
              )
            );
          }

          if (event.type === 'unit_error' && event.lesson_temp_id) {
            setLessons((prev) =>
              prev.map((l) =>
                l.temp_id === event.lesson_temp_id ? { ...l, status: 'error' } : l
              )
            );
          }

          if (event.type === 'all_completed') {
            setIsGenerating(false);
            setOverallProgress(100);
            if (cleanupSseRef.current) {
              cleanupSseRef.current();
              cleanupSseRef.current = null;
            }
          }
        },
        () => {
          // Fallback if SSE drops
          setIsGenerating(false);
        }
      );

      try {
        const result = await teacherAiWizardApi.step2GenerateContent(classId, lessonTempIds);
        setLessons(result.lessons);
        setTopicsByLesson(result.topicsByLesson);
        setQuestionsByLesson(result.questionsByLesson);
        setIsGenerating(false);
        setOverallProgress(100);
        queryClient.invalidateQueries({ queryKey: ['ai-wizard-draft', classId] });
      } catch (err) {
        setIsGenerating(false);
        throw err;
      }
    },
    [classId, queryClient]
  );

  // 5. Update detail modal (Topics + Questions of 1 lesson)
  const updateDetailMutation = useMutation({
    mutationFn: ({
      lessonTempId,
      topics,
      questions,
    }: {
      lessonTempId: string;
      topics: WizardTopic[];
      questions: WizardQuestion[];
    }) => teacherAiWizardApi.updateLessonDetail(classId, lessonTempId, topics, questions),
    onSuccess: (_, variables) => {
      setTopicsByLesson((prev) => ({ ...prev, [variables.lessonTempId]: variables.topics }));
      setQuestionsByLesson((prev) => ({ ...prev, [variables.lessonTempId]: variables.questions }));
      setLessons((prev) =>
        prev.map((l) =>
          l.temp_id === variables.lessonTempId
            ? {
                ...l,
                status: 'ready',
                topics_count: variables.topics.length,
                questions_count: variables.questions.length,
              }
            : l
        )
      );
      queryClient.invalidateQueries({ queryKey: ['ai-wizard-draft', classId] });
    },
  });

  // 6. Regenerate single question
  const regenerateQuestionMutation = useMutation({
    mutationFn: ({
      lessonTempId,
      questionTempId,
      instruction,
    }: {
      lessonTempId: string;
      questionTempId: string;
      instruction?: string;
    }) =>
      teacherAiWizardApi.regenerateQuestion(
        classId,
        lessonTempId,
        questionTempId,
        instruction
      ),
    onSuccess: (newQuestion, variables) => {
      setQuestionsByLesson((prev) => {
        const currentList = prev[variables.lessonTempId] || [];
        return {
          ...prev,
          [variables.lessonTempId]: currentList.map((q) =>
            q.temp_id === variables.questionTempId ? newQuestion : q
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['ai-wizard-draft', classId] });
    },
  });

  // 7. Commit to DB
  const commitMutation = useMutation({
    mutationFn: () => teacherAiWizardApi.commitWizard(classId),
    onSuccess: () => {
      setLessons([]);
      setTopicsByLesson({});
      setQuestionsByLesson({});
      queryClient.invalidateQueries({ queryKey: ['ai-wizard-draft', classId] });
      queryClient.invalidateQueries({ queryKey: ['curriculums', classId] });
      queryClient.invalidateQueries({ queryKey: ['assignments', classId] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'class-detail', classId] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });

  // 8. Delete draft
  const deleteDraftMutation = useMutation({
    mutationFn: () => teacherAiWizardApi.deleteDraft(classId),
    onSuccess: () => {
      setLessons([]);
      setTopicsByLesson({});
      setQuestionsByLesson({});
      setCurriculumTitle('');
      setCurriculumDescription('');
      queryClient.invalidateQueries({ queryKey: ['ai-wizard-draft', classId] });
    },
  });

  return {
    activeDraft: draftQuery.data as WizardDraft | null,
    isLoadingDraft: draftQuery.isLoading,
    curriculumTitle,
    setCurriculumTitle,
    curriculumDescription,
    setCurriculumDescription,
    lessons,
    setLessons,
    topicsByLesson,
    questionsByLesson,
    isGenerating,
    overallProgress,
    step1Mutation,
    saveLessonsMutation,
    startBatchGeneration,
    updateDetailMutation,
    regenerateQuestionMutation,
    commitMutation,
    deleteDraftMutation,
  };
}
