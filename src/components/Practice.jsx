import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLessonStore } from '../store/lessonStore';
import { useAuthStore } from '../store/authStore';
import { updateCourseProgress } from '../utils/progressApi';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export default function Practice() {
  const { practiceId } = useParams();
  const navigate = useNavigate();
  const currentPractice = useLessonStore((state) => state.currentPractice);
  const error = useLessonStore((state) => state.error);
  const user = useAuthStore((state) => state.user);
  const userAnswers = useLessonStore((state) => state.userAnswers);
  const setUserAnswer = useLessonStore((state) => state.setUserAnswer);
  const submitPractice = useLessonStore((state) => state.submitPractice);
  const practiceHistory = useLessonStore((state) => state.practiceHistory);

  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [allAnswered, setAllAnswered] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Check if all paragraphs have been answered
    if (currentPractice && currentPractice.paragraphs) {
      const allAnswered = currentPractice.paragraphs.every(paragraph => {
        return paragraph.questions.every(q => userAnswers[q.id] !== undefined);
      });
      setAllAnswered(allAnswered);
    }
  }, [userAnswers, currentPractice]);

  if (!currentPractice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-4">{error || '练习未找到'}</p>
            <button
              onClick={() => navigate('/lessons')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
            >
              返回课程
            </button>
        </div>
      </div>
    );
  }

  const paragraphs = currentPractice.paragraphs || [];
  const currentParagraph = paragraphs[currentParagraphIndex];

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    setTouchEnd(e.changedTouches[0].clientX);
    if (touchStart && e.changedTouches[0].clientX) {
      handleSwipe(touchStart, e.changedTouches[0].clientX);
    }
  };

  const handleSwipe = (start, end) => {
    const distance = start - end;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentParagraphIndex < paragraphs.length - 1) {
      setCurrentParagraphIndex(currentParagraphIndex + 1);
    } else if (isRightSwipe && currentParagraphIndex > 0) {
      setCurrentParagraphIndex(currentParagraphIndex - 1);
    }
  };

  const handlePrevious = () => {
    if (currentParagraphIndex > 0) {
      setCurrentParagraphIndex(currentParagraphIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentParagraphIndex < paragraphs.length - 1) {
      setCurrentParagraphIndex(currentParagraphIndex + 1);
    }
  };

  const handleSubmit = () => {
    if (!currentParagraph) return;

    const correctCount = currentParagraph.questions.reduce((count, question) => {
      return userAnswers[question.id] === question.correctAnswer ? count + 1 : count;
    }, 0);

    const totalCount = currentParagraph.questions.length;
    const rate = Math.round((correctCount / totalCount) * 100);

    submitPractice(currentParagraph.id);
    setSubmitted(true);

    // Fire-and-forget call to update aggregated practice stats for this course.
    if (user && practiceId) {
      updateCourseProgress({
        userId: Number(user.id),
        courseId: Number(practiceId),
        totalAnswered: totalCount,
        totalCorrect: correctCount,
      });
    }
    
    setResultData({
      correctCount,
      totalCount,
      rate,
      paragraphTitle: currentParagraph.title,
    });
    setShowResultDialog(true);
  };

  const handleCloseDialog = () => {
    setShowResultDialog(false);
    setResultData(null);
  };

  const handleReAnswer = () => {
    setSubmitted(false);
    useLessonStore.setState({ userAnswers: {} });
  };

  if (!currentParagraph) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No paragraphs available</p>
      </div>
    );
  }

  const isAnswered = currentParagraph.questions.every(q => userAnswers[q.id] !== undefined);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/lessons')}
              className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition"
            >
              <ArrowLeft size={20} />
              返回
            </button>
            <h1 className="text-2xl font-bold text-gray-800">{currentPractice.title}</h1>
          </div>
          <div className="text-gray-600 font-semibold">
            {currentParagraphIndex + 1} / {paragraphs.length}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentParagraphIndex + 1) / paragraphs.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Paragraph Container */}
        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="bg-white rounded-lg shadow-lg p-8 mb-8"
        >
          {/* Passage */}
          <div className="mb-8">
            
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
              <ReactMarkdown
                rehypePlugins={[[rehypeRaw]]}
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-2xl font-bold my-3" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-xl font-bold my-2" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-lg font-bold my-2" {...props} />,
                  p: ({ node, ...props }) => <p className="my-2" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc list-inside my-2" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal list-inside my-2" {...props} />,
                  li: ({ node, ...props }) => <li className="my-1" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                  em: ({ node, ...props }) => <em className="italic" {...props} />,
                }}
              >
                {currentParagraph.passage}
              </ReactMarkdown>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">题目</h3>
            {currentParagraph.questions.map((question, index) => (
              <div key={question.id} className="border-l-4 border-blue-500 pl-4">
                <p className="font-semibold text-gray-800 mb-3"><span className="text-blue-600 font-bold">{index + 1}. </span> {question.text}</p>
                <div className="space-y-2">
                  {question.options.map((option, index) => {
                    const isSelected = userAnswers[question.id] === index;
                    const isCorrect = index === question.correctAnswer;
                    const userSelectedCorrect = submitted && isSelected && isCorrect;
                    const userSelectedWrong = submitted && isSelected && !isCorrect;
                    const revealedCorrect = submitted && isCorrect && !isSelected;
                    const optionId = String.fromCharCode(65 + index); // Convert 0,1,2,3 to A,B,C,D

                    return (
                      <label
                        key={index}
                        className={`flex items-center p-3 rounded-lg cursor-pointer transition ${
                          userSelectedCorrect
                            ? 'bg-green-100'
                            : userSelectedWrong
                            ? 'bg-red-100'
                            : isSelected
                            ? 'bg-blue-100 border-2 border-blue-500'
                            : 'bg-gray-50 border-2 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          checked={isSelected}
                          onChange={() => setUserAnswer(question.id, index)}
                          className="w-4 h-4 text-blue-500 cursor-pointer"
                          disabled={submitted}
                        />
                        <span className="ml-3 text-gray-700"><span className="font-bold">{option.id}. </span>{option.text}</span>
                        {userSelectedCorrect && (
                          <CheckCircle className="ml-auto text-green-500" size={20} />
                        )}
                        {userSelectedWrong && (
                          <XCircle className="ml-auto text-red-500" size={20} />
                        )}
                        {revealedCorrect && (
                          <span className="ml-auto text-green-600 font-bold text-sm">正确答案</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4">
          {paragraphs.length > 1 ? (
            <>
              <button
                onClick={handlePrevious}
                disabled={currentParagraphIndex === 0 || submitted}
                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                <ChevronLeft size={20} />
                上一题
              </button>

              <div className="flex-1 flex gap-2 justify-center">
                {submitted && (
                  <button
                    onClick={handleReAnswer}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    <RotateCcw size={20} />
                    重新答题
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!isAnswered || submitted}
                  className={`font-bold py-3 px-8 rounded-lg transition ${
                    !submitted && isAnswered
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  提交答案
                </button>
              </div>

              <button
                onClick={handleNext}
                disabled={currentParagraphIndex === paragraphs.length - 1 || submitted}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                下一题
                <ChevronRight size={20} />
              </button>
            </>
          ) : (
            <div className="w-full flex gap-2">
              {submitted && (
                  <button
                    onClick={handleReAnswer}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition flex-1"
                  >
                    <RotateCcw size={20} />
                    重新答题
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!isAnswered || submitted}
                  className={`flex-1 font-bold py-3 px-8 rounded-lg transition ${
                    !submitted && isAnswered
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  提交答案
                </button>
            </div>
          )}
        </div>

        {/* Swipe Hint */}
        {paragraphs.length > 1 && (
          <div className="text-center mt-8 text-gray-600 text-sm">
            💡 提示：您可以个左右滑动以在段落之间导航
          </div>
        )}
      </main>

      {/* Result Dialog */}
      {showResultDialog && resultData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
            <div
              className={`mb-4 inline-block p-3 rounded-full ${
                resultData.rate >= 80 ? 'bg-green-100' : 'bg-yellow-100'
              }`}
            >
              {resultData.rate >= 80 ? (
                <CheckCircle className="text-green-500" size={48} />
              ) : (
                <XCircle className="text-yellow-500" size={48} />
              )}
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {resultData.rate >= 80 ? '做得很好! 🎉' : '继续努力! 💪'}
            </h2>

            <p className="text-gray-600 mb-6">{resultData.paragraphTitle}</p>

            {/* Score */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-4xl font-bold text-blue-500 mb-2">{resultData.rate}%</p>
              <p className="text-gray-600">
                {resultData.correctCount} out of {resultData.totalCount} correct
              </p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 p-3 rounded">
              <p className="text-sm text-gray-600">正确</p>
                <p className="text-2xl font-bold text-green-500">{resultData.correctCount}</p>
              </div>
              <div className="bg-red-50 p-3 rounded">
              <p className="text-sm text-gray-600">错误</p>
                <p className="text-2xl font-bold text-red-500">
                  {resultData.totalCount - resultData.correctCount}
                </p>
              </div>
            </div>

            <button
              onClick={handleCloseDialog}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition"
            >
              继续
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
