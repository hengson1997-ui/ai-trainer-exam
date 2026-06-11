import { useState, useEffect, useCallback } from 'react';
import QuestionCard from '../components/QuestionCard';
import { getCategories, getQuestionsByCategory, shuffleOptions } from '../utils/questions';
import { getProgress, saveProgress, saveWrongQuestion, removeWrongQuestion, getSettings } from '../utils/storage';

export default function PracticePage({ initialCategory = null, initialType = null }) {
  const [questions, setQuestions] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedType, setSelectedType] = useState(initialType || 'all');
  const [progress, setProgress] = useState(getProgress());
  const [settings] = useState(getSettings());
  const [expandedCategory, setExpandedCategory] = useState(initialCategory);

  const categories = getCategories();

  const getTypesInCategory = useCallback((catName) => {
    const categoryQuestions = getQuestionsByCategory(catName);
    const types = [...new Set(categoryQuestions.map(q => q.type))];
    return types.map(type => ({
      name: type,
      count: categoryQuestions.filter(q => q.type === type).length,
    }));
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setQuestions([]);
      return;
    }

    let filtered = getQuestionsByCategory(selectedCategory);

    if (selectedType && selectedType !== 'all') {
      filtered = filtered.filter(q => q.type === selectedType);
    }

    if (settings.randomOptions) {
      filtered = filtered.map(q => shuffleOptions(q));
    }

    setQuestions(filtered);
    setVisibleCount(10);
    setAnswers({});
    setResults({});
  }, [selectedCategory, selectedType, settings.randomOptions]);

  const handleAnswer = useCallback((questionId, answer) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const correct = question.answer === answer;
    
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    setResults(prev => ({ ...prev, [questionId]: correct }));

    const newProgress = { ...progress };
    newProgress.totalAnswered += 1;
    if (correct) {
      newProgress.correctAnswers += 1;
      removeWrongQuestion(questionId);
    } else {
      saveWrongQuestion(question);
    }
    newProgress.answeredQuestions.push({
      id: questionId,
      category: question.category,
      type: question.type,
      isCorrect: correct,
    });
    setProgress(newProgress);
    saveProgress(newProgress);
  }, [questions, progress]);

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 10, questions.length));
  };

  const scrollToQuestion = (index) => {
    const element = document.getElementById(`question-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const answeredCount = Object.keys(results).length;
  const correctCount = Object.values(results).filter(Boolean).length;

  return (
    <div className="flex max-w-7xl mx-auto px-4 py-6 gap-6">
      {/* 左侧：章节导航 */}
      <div className="w-56 flex-shrink-0">
        <div className="card-glass p-4 sticky top-20">
          <h3 className="text-sm font-semibold text-primary mb-4">知识领域</h3>
          
          <div className="space-y-1">
            {categories.map(cat => {
              const types = getTypesInCategory(cat.name);
              const isExpanded = expandedCategory === cat.name;
              const isSelected = selectedCategory === cat.name;
              
              return (
                <div key={cat.name}>
                  <button
                    onClick={() => {
                      setExpandedCategory(isExpanded ? null : cat.name);
                      if (!isSelected) {
                        setSelectedCategory(cat.name);
                        setSelectedType('all');
                      }
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all duration-300 flex items-center justify-between ${
                      isSelected && selectedType === 'all'
                        ? 'btn-glass text-primary font-medium'
                        : 'text-secondary hover:text-primary hover:bg-primary-light'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-secondary">{cat.count}</span>
                      <svg className={`w-3 h-3 text-secondary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-subtle pl-3">
                      <button
                        onClick={() => { setSelectedCategory(cat.name); setSelectedType('all'); }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                          isSelected && selectedType === 'all'
                            ? 'bg-primary-light text-primary font-medium'
                            : 'text-secondary hover:text-primary hover:bg-primary-light'
                        }`}
                      >
                        全部题型
                      </button>
                      {types.map(type => (
                        <button
                          key={type.name}
                          onClick={() => { setSelectedCategory(cat.name); setSelectedType(type.name); }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors flex justify-between ${
                            isSelected && selectedType === type.name
                              ? 'bg-primary-light text-primary font-medium'
                              : 'text-secondary hover:text-primary hover:bg-primary-light'
                          }`}
                        >
                          <span>{type.name}</span>
                          <span className="text-secondary">{type.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-subtle">
            <div className="text-xs text-secondary space-y-1">
              <div className="flex justify-between">
                <span>已练习</span>
                <span className="font-medium text-primary">{progress.totalAnswered} 题</span>
              </div>
              <div className="flex justify-between">
                <span>正确率</span>
                <span className="font-medium text-primary">
                  {progress.totalAnswered > 0 ? Math.round((progress.correctAnswers / progress.totalAnswered) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 中间：题目列表 */}
      <div className="flex-1 min-w-0">
        {!selectedCategory ? (
          <div className="card-glass p-16 text-center">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-primary mb-2">请先选择章节</h3>
            <p className="text-secondary">从左侧选择章节开始练习</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="card-glass p-16 text-center">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-primary mb-2">暂无题目</h3>
            <p className="text-secondary">该条件下没有匹配的题目</p>
          </div>
        ) : (
          <>
            {/* 统计栏 */}
            <div className="card-glass p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <span className="text-sm text-secondary">
                    {selectedCategory} {selectedType !== 'all' ? `· ${selectedType}` : ''}
                  </span>
                  <span className="text-sm text-secondary">
                    共 {questions.length} 题
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-success">✓ {correctCount}</span>
                  <span className="text-error">✗ {answeredCount - correctCount}</span>
                  <span className="text-secondary">未答 {questions.length - answeredCount}</span>
                </div>
              </div>
            </div>

            {/* 题目列表 */}
            <div className="space-y-4">
              {questions.slice(0, visibleCount).map((question, index) => (
                <div key={question.id} id={`question-${index}`}>
                  <QuestionCard
                    question={question}
                    questionIndex={index}
                    totalQuestions={questions.length}
                    onAnswer={handleAnswer}
                    showResult={results[question.id] !== undefined}
                    userAnswer={answers[question.id]}
                    isCorrect={results[question.id]}
                    compact={true}
                  />
                </div>
              ))}
            </div>

            {/* 加载更多 */}
            {visibleCount < questions.length && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMore}
                  className="btn-glass px-6 py-2.5 text-secondary text-sm font-medium rounded-xl"
                >
                  加载更多（剩余 {questions.length - visibleCount} 题）
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 右侧：题号导航 */}
      {selectedCategory && questions.length > 0 && (
        <div className="w-20 flex-shrink-0">
          <div className="card-glass p-3 sticky top-20">
            <h3 className="text-xs font-semibold text-primary mb-3 text-center">题号</h3>
            
            <div className="grid grid-cols-2 gap-1.5">
              {questions.map((q, index) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCorrect = results[q.id];
                const isVisible = index < visibleCount;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      if (!isVisible) {
                        setVisibleCount(prev => Math.max(prev, index + 1));
                      }
                      scrollToQuestion(index);
                    }}
                    className={`w-full aspect-square rounded-lg text-xs font-medium transition-all duration-300 ${
                      isAnswered
                        ? isCorrect
                          ? 'bg-success-light text-success border border-success'
                          : 'bg-error-light text-error border border-error'
                        : isVisible
                        ? 'btn-glass text-secondary hover:text-primary'
                        : 'glass text-secondary opacity-40'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-subtle space-y-1.5">
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 rounded" style={{background: 'var(--color-success)'}}></div>
                <span className="text-secondary">正确</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 rounded" style={{background: 'var(--color-error)'}}></div>
                <span className="text-secondary">错误</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 rounded glass"></div>
                <span className="text-secondary">未答</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
