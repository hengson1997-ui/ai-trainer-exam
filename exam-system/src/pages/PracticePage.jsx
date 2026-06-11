import { useState, useEffect, useCallback, useRef } from 'react';
import QuestionCard from '../components/QuestionCard';
import { getCategories, getQuestionsByCategory, shuffleOptions } from '../utils/questions';
import { getProgress, saveProgress, saveWrongQuestion, removeWrongQuestion, getSettings, savePracticeProgress, getPracticeProgress, savePracticeAnswers, getPracticeAnswers, clearPracticeAnswers, getFavorites, addFavorite, removeFavorite, isFavorite, saveQuestionStats, getWeakCategories } from '../utils/storage';

export default function PracticePage({ initialCategory = null, initialType = null, onStatsUpdate = null }) {
  const [questions, setQuestions] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedType, setSelectedType] = useState(initialType || 'all');
  const [progress, setProgress] = useState(getProgress());
  const [settings] = useState(getSettings());
  const [expandedCategory, setExpandedCategory] = useState(initialCategory);
  
  // 新功能状态
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const timerRef = useRef(null);
  const questionStartTime = useRef(Date.now());

  const categories = getCategories();

  // 加载收藏和进度
  useEffect(() => {
    setFavorites(getFavorites());
    
    // 恢复上次练习进度（仅当没有指定初始参数时）
    if (!initialCategory && !initialType) {
      const savedProgress = getPracticeProgress();
      if (savedProgress && savedProgress.category) {
        // 验证保存的章节是否存在
        const categoryExists = categories.some(cat => cat.name === savedProgress.category);
        if (categoryExists) {
          setSelectedCategory(savedProgress.category);
          setSelectedType(savedProgress.type || 'all');
          setCurrentQuestionIndex(savedProgress.questionIndex || 0);
        }
      }
    }
  }, []);

  // 计时器
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  // 计算并更新统计信息
  useEffect(() => {
    if (onStatsUpdate && selectedCategory) {
      const answeredCount = Object.keys(results).length;
      const correctCount = Object.values(results).filter(Boolean).length;
      
      // 计算本章正确率
      const chapterQuestions = questions.filter(q => q.category === selectedCategory);
      const chapterAnswered = chapterQuestions.filter(q => results[q.id] !== undefined);
      const chapterCorrect = chapterAnswered.filter(q => results[q.id]);
      const chapterAccuracy = chapterAnswered.length > 0 
        ? Math.round((chapterCorrect.length / chapterAnswered.length) * 100) 
        : 0;
      
      // 计算总体正确率
      const overallAccuracy = progress.totalAnswered > 0 
        ? Math.round((progress.correctAnswers / progress.totalAnswered) * 100) 
        : 0;
      
      // 获取总时长（从stats中计算）
      const totalStats = JSON.parse(localStorage.getItem('practice_stats') || '{}');
      let totalTime = 0;
      Object.values(totalStats).forEach(s => {
        totalTime += s.totalTime || 0;
      });
      
      onStatsUpdate({
        currentSessionTime: timer,
        totalTime: totalTime,
        chapterAccuracy: chapterAccuracy,
        overallAccuracy: overallAccuracy,
      });
    }
  }, [timer, results, progress, questions, selectedCategory, onStatsUpdate]);

  const getTypesInCategory = useCallback((catName) => {
    const categoryQuestions = getQuestionsByCategory(catName);
    const types = [...new Set(categoryQuestions.map(q => q.type))];
    return types.map(type => ({
      name: type,
      count: categoryQuestions.filter(q => q.type === type).length,
    }));
  }, []);

  // 加载题目
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
    setTimer(0);
    setIsTimerRunning(true);
    questionStartTime.current = Date.now();
    
    // 恢复之前的答题状态
    const savedState = getPracticeAnswers(selectedCategory, selectedType);
    if (savedState && savedState.answers) {
      setAnswers(savedState.answers);
      setResults(savedState.results || {});
      // 计算已答题数量，设置可见数量
      const answeredCount = Object.keys(savedState.answers).length;
      setVisibleCount(Math.max(10, Math.ceil(answeredCount / 10) * 10 + 10));
    } else {
      setAnswers({});
      setResults({});
      setVisibleCount(10);
    }
    
    setCurrentQuestionIndex(0);
    
    // 保存练习进度
    savePracticeProgress({
      category: selectedCategory,
      type: selectedType,
      timestamp: Date.now(),
    });
  }, [selectedCategory, selectedType, settings.randomOptions]);

  // 处理答题
  const handleAnswer = useCallback((questionId, answer) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const correct = question.answer === answer;
    const timeSpent = Math.round((Date.now() - questionStartTime.current) / 1000);
    
    const newAnswers = { ...answers, [questionId]: answer };
    const newResults = { ...results, [questionId]: correct };
    
    setAnswers(newAnswers);
    setResults(newResults);
    // 计时器继续运行，不停止
    
    // 提交后自动跳转到下一题并滚动居中
    const currentIdx = questions.findIndex(q => q.id === questionId);
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentQuestionIndex(nextIdx);
      questionStartTime.current = Date.now();
      // 确保下一题可见
      if (nextIdx >= visibleCount) {
        setVisibleCount(prev => Math.max(prev, nextIdx + 2));
      }
      // 延迟滚动，确保DOM更新
      setTimeout(() => {
        const nextElement = document.getElementById(`question-${nextIdx}`);
        if (nextElement) {
          nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
    
    // 保存答题状态
    savePracticeAnswers(selectedCategory, selectedType, newAnswers, newResults);
    
    // 保存答题统计
    saveQuestionStats(questionId, timeSpent, correct);

    // 更新进度
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
      timeSpent,
    });
    setProgress(newProgress);
    saveProgress(newProgress);
    
    // 保存练习进度
    savePracticeProgress({
      category: selectedCategory,
      type: selectedType,
      timestamp: Date.now(),
    });
  }, [questions, progress, selectedCategory, selectedType, answers, results, visibleCount]);

  // 加载更多
  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 10, questions.length));
  };

  // 滚动到指定题目（居中显示）
  const scrollToQuestion = (index) => {
    setCurrentQuestionIndex(index);
    questionStartTime.current = Date.now();
    setIsTimerRunning(true);
    setTimer(0);
    
    const element = document.getElementById(`question-${index}`);
    if (element) {
      // 使用 block: 'center' 让元素在视口垂直居中
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // 收藏/取消收藏
  const toggleFavorite = (questionId) => {
    if (favorites.includes(questionId)) {
      removeFavorite(questionId);
      setFavorites(prev => prev.filter(id => id !== questionId));
    } else {
      addFavorite(questionId);
      setFavorites(prev => [...prev, questionId]);
    }
  };

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取智能推荐
  const getRecommendations = () => {
    const weakCategories = getWeakCategories();
    if (weakCategories.length > 0) {
      return weakCategories.slice(0, 3).map(w => ({
        category: w.category,
        reason: `错题较多 (${w.count}题)`,
        count: w.count,
      }));
    }
    return [{ category: categories[0]?.name, reason: '推荐开始练习', count: 0 }];
  };

  const answeredCount = Object.keys(results).length;
  const correctCount = Object.values(results).filter(Boolean).length;
  const recommendations = getRecommendations();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* 左侧：章节导航 - fixed */}
      <div className="hidden lg:block fixed left-0 top-20 w-56 h-[calc(100vh-5rem)] overflow-y-auto z-40 bg-[var(--color-bg)] border-r border-theme px-4 pt-4">
        <div className="card-glass p-4 h-full overflow-y-auto">
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

      {/* 中间：题目列表 - 留出左右固定栏空间 */}
      <div className="lg:ml-56 lg:mr-24 min-w-0">
        {!selectedCategory ? (
          <>
            {/* 智能推荐 */}
            <div className="card-glass p-6 mb-6">
              <h3 className="text-sm font-semibold text-primary mb-3">💡 智能推荐</h3>
              <div className="space-y-2">
                {recommendations.map((rec, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedCategory(rec.category);
                      setSelectedType('all');
                    }}
                    className="w-full text-left p-3 rounded-xl btn-glass hover:scale-[1.01] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary">{rec.category}</span>
                      <span className="text-xs text-secondary">{rec.reason}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 收藏夹 */}
            {favorites.length > 0 && (
              <div className="card-glass p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-primary">⭐ 收藏夹 ({favorites.length})</h3>
                  <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className="text-xs text-secondary hover:text-primary"
                  >
                    {showFavoritesOnly ? '查看全部' : '仅看收藏'}
                  </button>
                </div>
              </div>
            )}

            <div className="card-glass p-16 text-center">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-lg font-semibold text-primary mb-2">请先选择章节</h3>
              <p className="text-secondary">从左侧选择章节开始练习</p>
            </div>
          </>
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
                  {/* 计时器 */}
                  <div className="flex items-center space-x-1 text-primary">
                    <span>⏱️</span>
                    <span className="font-mono">{formatTime(timer)}</span>
                  </div>
                  <span className="text-success">✓ {correctCount}</span>
                  <span className="text-error">✗ {answeredCount - correctCount}</span>
                  <span className="text-secondary">未答 {questions.length - answeredCount}</span>
                </div>
              </div>
            </div>

            {/* 题目列表 */}
            <div className="space-y-4">
              {questions.slice(0, visibleCount).map((question, index) => {
                const isFav = favorites.includes(question.id);
                return (
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
                      isFavorite={isFav}
                      onToggleFavorite={toggleFavorite}
                    />
                  </div>
                );
              })}
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

      {/* 右侧：题号导航 + 统计 - fixed */}
      {selectedCategory && questions.length > 0 && (
        <div className="hidden lg:flex fixed right-0 top-20 w-24 z-40 bg-[var(--color-bg)] border-l border-theme flex-col" style={{height: 'calc(100vh - 5rem)'}}>
          {/* 固定顶部：平均用时 + 标题 */}
          <div className="flex-shrink-0 px-2 pt-2">
            <div className="mb-2 p-2 rounded-lg bg-primary-light">
              <div className="text-xs text-secondary text-center">平均用时</div>
              <div className="text-sm font-semibold text-primary text-center">
                {answeredCount > 0 
                  ? formatTime(Math.round(timer / Math.max(answeredCount, 1)))
                  : '0:00'}
              </div>
            </div>
            <h3 className="text-xs font-semibold text-primary mb-2 text-center">题号</h3>
          </div>

          {/* 可滚动区域：题号列表 - flex: 1 + overflow-y: auto */}
          <div className="flex-1 overflow-y-auto px-2 py-1" style={{minHeight: 0}}>
            <div className="grid grid-cols-2 gap-1.5">
              {questions.map((q, index) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCorrect = results[q.id];
                const isVisible = index < visibleCount;
                const isFav = favorites.includes(q.id);
                const isCurrent = index === currentQuestionIndex;
                
                // 题号按钮样式 - 使用用户指定的颜色
                let bgColor = '#3a3a3a'; // 未答：灰色
                if (isAnswered) {
                  bgColor = isCorrect ? '#4a7c59' : '#8c4a4a'; // 正确：绿色，错误：红色
                }
                
                // 当前题目白色边框
                const borderStyle = isCurrent ? '2px solid #ffffff' : '2px solid transparent';
                
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      if (!isVisible) {
                        setVisibleCount(prev => Math.max(prev, index + 1));
                      }
                      scrollToQuestion(index);
                    }}
                    className="w-full aspect-square rounded-lg text-xs font-medium transition-all duration-300 relative text-white"
                    style={{ backgroundColor: bgColor, border: borderStyle }}
                  >
                    {index + 1}
                    {isFav && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 固定底部：图例 - 使用与题号相同的颜色 */}
          <div className="flex-shrink-0 px-2 py-2 border-t border-theme space-y-1">
            <div className="flex items-center space-x-1 text-xs">
              <div className="w-2.5 h-2.5 rounded" style={{background: '#4a7c59'}}></div>
              <span className="text-secondary">正确</span>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <div className="w-2.5 h-2.5 rounded" style={{background: '#8c4a4a'}}></div>
              <span className="text-secondary">错误</span>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <div className="w-2.5 h-2.5 rounded" style={{background: '#3a3a3a'}}></div>
              <span className="text-secondary">未答</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
