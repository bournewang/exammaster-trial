import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLessonStore } from '../store/lessonStore';
import { useAuthStore } from '../store/authStore';
import { updateCourseProgress } from '../utils/progressApi';
import { Play, Pause, Volume2, Maximize2, ArrowLeft } from 'lucide-react';

export default function LessonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentLesson = useLessonStore((state) => state.currentLesson);
  const fetchPractice = useLessonStore((state) => state.fetchPractice);
  const courseProgress = useLessonStore((state) => state.courseProgress);
  const user = useAuthStore((state) => state.user);
  const videoRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track the last reported progress percentage to avoid spamming the API.
  const lastReportedPercentRef = useRef(0);
  // Ensure we only resume once per lesson load.
  const hasResumedRef = useRef(false);

  const lesson = currentLesson;

  // Auto-play video when component loads
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log('Autoplay failed:', error);
      });
      setIsPlaying(true);
    }
    // Reset last reported progress whenever the lesson changes
    lastReportedPercentRef.current = 0;
    hasResumedRef.current = false;
  }, [lesson?.id]);

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Lesson not found</p>
      </div>
    );
  }

  // Resume playback position based on stored progress_percent (if between 0 and 100).
  useEffect(() => {
    if (!videoRef.current || !duration || !lesson || !user) return;

    const progressRow = courseProgress?.[lesson.id];
    if (!progressRow || typeof progressRow.progress_percent !== 'number') return;

    const p = progressRow.progress_percent;
    // Only resume if partially watched
    if (p <= 0 || p >= 100) return;
    if (hasResumedRef.current) return;

    const targetTime = (p / 100) * duration;
    if (targetTime <= 0 || targetTime >= duration) return;

    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
    lastReportedPercentRef.current = p;
    hasResumedRef.current = true;
  }, [duration, lesson?.id, user?.id, courseProgress]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;

    const current = videoRef.current.currentTime;
    setCurrentTime(current);

    if (!duration || !lesson || !user) return;

    const percent = (current / duration) * 100;
    const rounded = Math.max(0, Math.min(100, Math.round(percent)));

    // Only send when progress moves forward by at least 5% (or reaches 100%).
    const last = lastReportedPercentRef.current;
    if (rounded <= last) return;
    if (rounded < 100 && rounded - last < 5) return;

    lastReportedPercentRef.current = rounded;

    updateCourseProgress({
      userId: Number(user.id),
      courseId: Number(lesson.id),
      progressPercent: rounded,
    });
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const newTime = (e.currentTarget.value / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.currentTarget.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    }
  };

  const handlePracticeClick = async () => {
    await fetchPractice(lesson.id);
    navigate(`/practice/${lesson.id}`);
  };

  const formatTime = (time) => {
    if (!time) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/lessons')}
              className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition"
            >
              <ArrowLeft size={20} />
              返回
            </button>
            <h1 className="text-2xl font-bold text-gray-800">{lesson.name}</h1>
          </div>
          <button
            onClick={handlePracticeClick}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition font-semibold"
          >
            练习
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-black rounded-lg overflow-hidden shadow-xl mb-8">
          {/* Video Player */}
          <div className="relative bg-black group/video">
            <video
              ref={videoRef}
              src={lesson.url}
              className="w-full h-auto"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => {
                setIsPlaying(false);
                // Ensure we record 100% watch progress when the video finishes.
                if (lesson && user) {
                  lastReportedPercentRef.current = 100;
                  updateCourseProgress({
                    userId: Number(user.id),
                    courseId: Number(lesson.id),
                    progressPercent: 100,
                  });
                }
              }}
            />

            {/* Center Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/video:opacity-100 hover:bg-black/20 transition"
            >
              <div className="bg-blue-500/80 hover:bg-blue-500 text-white rounded-full p-6 shadow-lg transform group-hover/video:scale-100 scale-75 transition">
                {isPlaying ? (
                  <Pause size={64} fill="currentColor" />
                ) : (
                  <Play size={64} fill="currentColor" />
                )}
              </div>
            </button>

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              {/* Progress Bar */}
              <input
                type="range"
                min="0"
                max="100"
                value={progressPercent}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-3"
              />

              {/* Control Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Play/Pause Button */}
                  <button
                    onClick={handlePlayPause}
                    className="text-white hover:text-blue-400 transition"
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>

                  {/* Volume Control */}
                  <div className="flex items-center gap-2">
                    <Volume2 className="text-white" size={20} />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  {/* Time Display */}
                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Fullscreen Button */}
                <button
                  onClick={handleFullscreen}
                  className="text-white hover:text-blue-400 transition"
                >
                  <Maximize2 size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lesson Info */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 font-semibold mb-2">時長</h3>
            <p className="text-3xl font-bold text-blue-500">{lesson.duration ? Math.floor(lesson.duration / 60) + ' 分钟' : 'N/A'}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 font-semibold mb-2">标签</h3>
            <div className="flex gap-2 flex-wrap">
              {lesson.tags && lesson.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-block bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
