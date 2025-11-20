import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLessonStore } from '../store/lessonStore';
import { useAuthStore } from '../store/authStore';
import { Play, BookOpen, LogOut, Loader, BookMarked, CheckCircle, Circle } from 'lucide-react';

export default function LessonList() {
  const navigate = useNavigate();
  const lessons = useLessonStore((state) => state.lessons);
  const courseMeta = useLessonStore((state) => state.courseMeta);
  const loading = useLessonStore((state) => state.loading);
  const fetchLessons = useLessonStore((state) => state.fetchLessons);
  const setCurrentLesson = useLessonStore((state) => state.setCurrentLesson);
  const fetchPractice = useLessonStore((state) => state.fetchPractice);
  const courseProgress = useLessonStore((state) => state.courseProgress);
  const fetchCourseProgress = useLessonStore((state) => state.fetchCourseProgress);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    fetchLessons();
  }, []);

  // After we know the user, load all course progress for that user.
  useEffect(() => {
    if (user?.id) {
      fetchCourseProgress(Number(user.id));
    }
  }, [user?.id, fetchCourseProgress]);

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}小时${minutes}分${remainingSeconds}秒`;
    }
    return `${minutes}分${remainingSeconds}秒`;
  };

  const handlePlayLesson = (lesson) => {
    setCurrentLesson(lesson.id);
    navigate(`/lesson/${lesson.id}`);
  };

  const handlePracticeClick = async (lessonId) => {
    await fetchPractice(lessonId);
    navigate(`/practice/${lessonId}`);
  };

  const handleLogout = () => {
    logout();
    // After logout, send the user back to the code verification page
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Exam Master Logo" className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">考试大师，专注中高考快速提分</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 text-sm">欢迎, {user?.name}!</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition text-sm"
            >
              <LogOut size={16} />
              退出
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{courseMeta?.title}</h2>
          <p className="text-gray-600">点击播放以开始课程或点击练习以进入练习模式</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader className="animate-spin text-blue-500" size={40} />
          </div>
        )}

        {/* Lessons List */}
        {!loading && lessons.length > 0 && (
          <div className="space-y-2">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => handlePlayLesson(lesson)}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-4 flex items-center justify-between group cursor-pointer"
              >
                {/* Left Side - Title and Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">{lesson.id} - {lesson.name}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm text-gray-500">{formatDuration(lesson.duration)}</span>
                    {lesson.tags && lesson.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {lesson.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {lesson.tags.length > 2 && (
                          <span className="text-xs text-gray-500">+{lesson.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side - Status + Buttons */}
                <div className="ml-4 flex-shrink-0 flex items-center gap-3">
                  {/* Progress Status */}
                  <div className="flex items-center gap-1 text-xs">
                    {(() => {
                      const progress = courseProgress?.[lesson.id];
                      let StatusIcon = Circle;
                      let statusLabel = '未开始';
                      let statusClass = 'text-gray-400';

                      if (progress && typeof progress.progress_percent === 'number') {
                        const p = progress.progress_percent;
                        if (p >= 100) {
                          StatusIcon = CheckCircle;
                          statusLabel = '已完成';
                          statusClass = 'text-green-500';
                        } else if (p > 0) {
                          StatusIcon = BookMarked;
                          statusLabel = '学习中';
                          statusClass = 'text-blue-500';
                        }
                      }

                      return (
                        <span className="inline-flex items-center gap-1">
                          <StatusIcon size={14} className={statusClass} />
                          <span className={statusClass}>{statusLabel}</span>
                        </span>
                      );
                    })()}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePracticeClick(lesson.id);
                    }}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition transform active:scale-95 font-semibold text-sm"
                    title="Practice mode"
                  >
                    练习
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayLesson(lesson);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition transform group-hover:scale-110 active:scale-95"
                    title="Play lesson"
                  >
                    <Play size={20} fill="currentColor" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && lessons.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">没有可用的课程</p>
          </div>
        )}
      </main>
    </div>
  );
}
