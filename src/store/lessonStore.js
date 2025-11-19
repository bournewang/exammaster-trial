import { create } from 'zustand';
import { fetchCourseProgressForUser } from '../utils/progressApi';

export const useLessonStore = create((set) => ({
  lessons: [],
  currentLesson: null,
  currentPractice: null,
  practiceData: null,
  userAnswers: {},
  practiceHistory: {},
  courseProgress: {}, // keyed by courseId (string) -> progress row
  loading: false,
  error: null,

  fetchLessons: async () => {
    return new Promise((resolve, reject) => {
      set({ loading: true, error: null });
      (async () => {
        try {
          const response = await fetch('/courses.json');
          if (!response.ok) throw new Error('Failed to fetch courses');
          const courses = await response.json();
          set({ lessons: courses, loading: false });
          resolve(courses);
        } catch (error) {
          set({ error: error.message, loading: false });
          reject(error);
        }
      })();
    });
  },

  setCurrentLesson: (lessonId) => {
    set((state) => ({
      currentLesson: state.lessons.find(l => l.id === lessonId),
    }));
  },

  setCurrentPractice: (practiceId) => {
    set((state) => {
      if (!state.currentLesson) return state;
      const practice = state.currentLesson.practices.find(p => p.id === practiceId);
      return { currentPractice: practice };
    });
  },

  setUserAnswer: (questionId, answerIndex) => {
    set((state) => ({
      userAnswers: {
        ...state.userAnswers,
        [questionId]: answerIndex,
      },
    }));
  },

  submitPractice: (paragraphId) => {
    set((state) => {
      const practice = state.currentPractice;
      if (!practice) return state;
      
      const paragraph = practice.paragraphs.find(p => p.id === paragraphId);
      if (!paragraph) return state;

      let correctCount = 0;
      paragraph.questions.forEach(question => {
        if (state.userAnswers[question.id] === question.correctAnswer) {
          correctCount++;
        }
      });

      const rate = Math.round((correctCount / paragraph.questions.length) * 100);

      return {
        practiceHistory: {
          ...state.practiceHistory,
          [paragraphId]: {
            rate,
            timestamp: new Date().toISOString(),
          },
        },
      };
    });
  },

  resetAnswers: () => {
    set({ userAnswers: {} });
  },

  fetchPractice: async (chapterId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/practice/${chapterId}.json`);
      if (!response.ok) {
        throw new Error(`Practice file for chapter ${chapterId} not found`);
      }
      const practiceJson = await response.json();
      
      // Transform the practice JSON to match the expected format
      const transformedPractice = {
        id: `practice-${chapterId}`,
        title: practiceJson.practices[0]?.title || 'Practice',
        paragraphs: practiceJson.practices.map(practice => ({
          id: practice.practiceId,
          title: practice.title,
          passage: practice.passage || '',
          questions: practice.questions.map(q => ({
            id: q.id,
            text: q.text,
            options: q.options,
            correctAnswer: q.options.findIndex(opt => opt.id === q.correctAnswerId),
          })),
        })),
      };

      set({ 
        practiceData: transformedPractice, 
        currentPractice: transformedPractice,
        userAnswers: {},
        loading: false,
        error: null
      });
    } catch (error) {
      set({ 
        currentPractice: null,
        practiceData: null,
        userAnswers: {},
        error: error.message, 
        loading: false 
      });
    }
  },

  // Fetch all course progress rows for the given user and store them by course_id.
  fetchCourseProgress: async (userId) => {
    if (!userId) return;
    try {
      const items = await fetchCourseProgressForUser(userId);
      const map = {};
      items.forEach((item) => {
        if (item && item.course_id != null) {
          map[String(item.course_id)] = item;
        }
      });
      set({ courseProgress: map });
    } catch (error) {
      // Non-fatal: we just log the error and keep the UI working.
      // eslint-disable-next-line no-console
      console.warn('Failed to fetch course progress', error);
    }
  },
}));
