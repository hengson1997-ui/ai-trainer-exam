import { useState, useEffect } from 'react';
import QuestionCard from '../components/QuestionCard';
import { getWrongQuestions, removeWrongQuestion, getProgress, saveProgress } from '../utils/storage';

export default function WrongBookPage() {
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [userAnswer, setUserAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setWrongQuestions(getWrongQuestions());
  }, []);

  const currentQuestion = wrongQuestions[currentIndex];

  const handleAnswer = (questionId, answer) => {
    const question = wrongQuestions.find(q => q.id === questionId);
    if (!question) return;

    const correct = question.answer === answer;
    setUserAnswer(answer);
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      removeWrongQuestion(questionId);
      
      const progress = getProgress();
      progress.correctAnswers += 1;
      progress.answeredQuestions.push({
        id: questionId,
        category: question.category,
        type: question.type,
        isCorrect: true,
      });
      saveProgress(progress);

      setTimeout(() => {
        setWrongQuestions(prev => prev.filter(q => q.id !== questionId));
        if (currentIndex >= wrongQuestions.length - 1) {
          setCurrentIndex(Math.max(0, wrongQuestions.length - 2));
        }
        setShowResult(false);
        setUserAnswer(null);
        setIsCorrect(null);
      }, 1500);
    }
  };

  const handleNext = () => {
    if (currentIndex < wrongQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowResult(false);
      setUserAnswer(null);
      setIsCorrect(null);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowResult(false);
      setUserAnswer(null);
      setIsCorrect(null);
    }
  };

  const handleRemove = (questionId) => {
    removeWrongQuestion(questionId);
    setWrongQuestions(prev => prev.filter(q => q.id !== questionId));
    if (currentIndex >= wrongQuestions.length - 1) {
      setCurrentIndex(Math.max(0, wrongQuestions.length - 2));
    }
  };

  const handleClearAll = () => {
    if (confirm('确定要清空所有错题吗？')) {
      wrongQuestions.forEach(q => removeWrongQuestion(q.id));
      setWrongQuestions([]);
      setCurrentIndex(0);
    }
  };

  const categories = [...new Set(wrongQuestions.map(q => q.category))];

  if (wrongQuestions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-surface rounded-xl border border-theme p-12 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-semibold text-primary mb-2">太棒了！</h2>
          <p className="text-secondary">目前没有错题，继续保持！</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-surface rounded-xl border border-theme p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary">错题本</h2>
            <p className="text-sm text-secondary">共 {wrongQuestions.length} 道错题</p>
          </div>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-error-light text-error rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
          >
            清空错题
          </button>
        </div>
      </div>

      {/* 筛选 */}
      <div className="bg-surface rounded-xl border border-theme p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-light text-primary'
                : 'bg-surface text-secondary hover:bg-primary-light'
            }`}
          >
            全部
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filter === cat
                  ? 'bg-primary-light text-primary'
                  : 'bg-surface text-secondary hover:bg-primary-light'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 进度 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-secondary">
            当前：{currentIndex + 1} / {wrongQuestions.length}
          </span>
          <span className="text-sm text-secondary">
            错误次数：{currentQuestion?.wrongCount || 0}
          </span>
        </div>
        <div className="w-full h-2 bg-primary-light rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / wrongQuestions.length) * 100}%, background: 'var(--color-primary)'` }}
          />
        </div>
      </div>

      {/* 题目卡片 */}
      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          questionIndex={currentIndex}
          totalQuestions={wrongQuestions.length}
          onAnswer={handleAnswer}
          showResult={showResult}
          userAnswer={userAnswer}
          isCorrect={isCorrect}
        />
      )}

      {/* 导航按钮 */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentIndex === 0
              ? 'bg-primary-light text-secondary opacity-50 cursor-not-allowed'
              : 'bg-surface border border-theme text-secondary hover:bg-primary-light hover:text-primary'
          }`}
        >
          ← 上一题
        </button>

        <div className="flex space-x-2">
          <button
            onClick={() => handleRemove(currentQuestion.id)}
            className="px-4 py-2 bg-primary-light text-secondary rounded-lg text-sm font-medium hover:bg-primary hover:text-white transition-colors"
          >
            移除本题
          </button>
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === wrongQuestions.length - 1}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentIndex === wrongQuestions.length - 1
              ? 'bg-primary-light text-secondary opacity-50 cursor-not-allowed'
              : 'btn-primary'
          }`}
        >
          下一题 →
        </button>
      </div>
    </div>
  );
}
