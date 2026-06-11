import { useState, useEffect, useMemo } from 'react';
import QuestionCard from '../components/QuestionCard';
import { getWrongQuestions, removeWrongQuestion, clearWrongQuestions, getProgress, saveProgress } from '../utils/storage';
import { getCategories, checkAnswer } from '../utils/questions';

export default function WrongBookPage() {
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [userAnswer, setUserAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [mode, setMode] = useState('list'); // list / practice / review
  
  // 筛选
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('time'); // time / count / category
  const [searchQuery, setSearchQuery] = useState('');
  
  // 批量操作
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  const categories = getCategories();

  // 加载错题
  useEffect(() => {
    setWrongQuestions(getWrongQuestions());
  }, []);

  // 筛选和排序
  const filteredQuestions = useMemo(() => {
    let result = [...wrongQuestions];

    // 搜索
    if (searchQuery) {
      result = result.filter(q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.category.includes(searchQuery)
      );
    }

    // 按章节筛选
    if (filterCategory !== 'all') {
      result = result.filter(q => q.category === filterCategory);
    }

    // 按题型筛选
    if (filterType !== 'all') {
      result = result.filter(q => q.type === filterType);
    }

    // 排序
    switch (sortBy) {
      case 'count':
        result.sort((a, b) => (b.wrongCount || 1) - (a.wrongCount || 1));
        break;
      case 'category':
        result.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'time':
      default:
        result.sort((a, b) => new Date(b.lastWrongTime) - new Date(a.lastWrongTime));
    }

    return result;
  }, [wrongQuestions, filterCategory, filterType, sortBy, searchQuery]);

  const currentQuestion = filteredQuestions[currentIndex];

  // 统计数据
  const stats = useMemo(() => {
    const total = wrongQuestions.length;
    const byCategory = {};
    const byType = {};
    let maxWrongCount = 0;

    wrongQuestions.forEach(q => {
      // 按章节
      if (!byCategory[q.category]) byCategory[q.category] = 0;
      byCategory[q.category]++;

      // 按题型
      if (!byType[q.type]) byType[q.type] = 0;
      byType[q.type]++;

      // 最大错误次数
      if ((q.wrongCount || 1) > maxWrongCount) {
        maxWrongCount = q.wrongCount || 1;
      }
    });

    return { total, byCategory, byType, maxWrongCount };
  }, [wrongQuestions]);

  // 处理答题
  const handleAnswer = (questionId, answer) => {
    const question = filteredQuestions.find(q => q.id === questionId);
    if (!question) return;

    const correct = checkAnswer(question, answer);
    setUserAnswer(answer);
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      // 从错题本移除
      removeWrongQuestion(questionId);
      setTimeout(() => {
        setWrongQuestions(prev => prev.filter(q => q.id !== questionId));
        if (currentIndex >= filteredQuestions.length - 1) {
          setCurrentIndex(Math.max(0, currentIndex - 1));
        }
        setShowResult(false);
        setUserAnswer(null);
        setIsCorrect(null);
      }, 1500);
    }
  };

  // 切换题目
  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
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

  // 选择操作
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredQuestions.map(q => q.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // 批量删除
  const batchDelete = () => {
    if (confirm(`确定删除 ${selectedIds.size} 道错题吗？`)) {
      selectedIds.forEach(id => removeWrongQuestion(id));
      setWrongQuestions(prev => prev.filter(q => !selectedIds.has(q.id)));
      setSelectedIds(new Set());
      setIsSelectMode(false);
      setCurrentIndex(0);
    }
  };

  // 单个删除
  const deleteQuestion = (id) => {
    if (confirm('确定删除这道错题吗？')) {
      removeWrongQuestion(id);
      setWrongQuestions(prev => prev.filter(q => q.id !== id));
      if (currentIndex >= filteredQuestions.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    }
  };

  // 清空所有错题
  const clearAll = () => {
    if (confirm('确定清空所有错题吗？此操作不可恢复！')) {
      clearWrongQuestions();
      setWrongQuestions([]);
      setCurrentIndex(0);
    }
  };

  // 导出错题
  const exportWrongQuestions = () => {
    const content = filteredQuestions.map((q, idx) => {
      let text = `${idx + 1}. ${q.question}\n`;
      if (q.options && q.options.length > 0) {
        text += q.options.join('\n') + '\n';
      }
      text += `正确答案：${q.answer}\n`;
      if (q.explanation) text += `解析：${q.explanation}\n`;
      text += `章节：${q.category} | 题型：${q.type} | 错误次数：${q.wrongCount || 1}\n`;
      return text;
    }).join('\n---\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `错题本_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============ 列表视图 ============
  if (mode === 'list') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 标题和操作栏 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-primary">错题本</h1>
            <p className="text-sm text-secondary mt-1">共 {wrongQuestions.length} 道错题</p>
          </div>
          <div className="flex items-center space-x-3">
            {wrongQuestions.length > 0 && (
              <>
                <button
                  onClick={() => {
                    setMode('practice');
                    setCurrentIndex(0);
                    setShowResult(false);
                  }}
                  className="btn-primary px-4 py-2 rounded-xl text-sm"
                >
                  开始练习
                </button>
                <button
                  onClick={() => setIsSelectMode(!isSelectMode)}
                  className="btn-glass px-4 py-2 rounded-xl text-sm text-secondary"
                >
                  {isSelectMode ? '取消选择' : '批量操作'}
                </button>
                <button
                  onClick={exportWrongQuestions}
                  className="btn-glass px-4 py-2 rounded-xl text-sm text-secondary"
                >
                  导出
                </button>
              </>
            )}
          </div>
        </div>

        {/* 统计卡片 */}
        {wrongQuestions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card-glass p-4">
              <div className="text-sm text-secondary">总错题</div>
              <div className="text-2xl font-semibold text-primary">{stats.total}</div>
            </div>
            <div className="card-glass p-4">
              <div className="text-sm text-secondary">判断题</div>
              <div className="text-2xl font-semibold text-blue">{stats.byType['判断题'] || 0}</div>
            </div>
            <div className="card-glass p-4">
              <div className="text-sm text-secondary">单选题</div>
              <div className="text-2xl font-semibold text-success">{stats.byType['单选题'] || 0}</div>
            </div>
            <div className="card-glass p-4">
              <div className="text-sm text-secondary">多选题</div>
              <div className="text-2xl font-semibold text-purple">{stats.byType['多选题'] || 0}</div>
            </div>
          </div>
        )}

        {/* 筛选和搜索 */}
        {wrongQuestions.length > 0 && (
          <div className="card-glass p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* 搜索 */}
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="搜索题目..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-glass w-full"
                />
              </div>

              {/* 章节筛选 */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input-glass"
              >
                <option value="all">全部章节</option>
                {categories.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>

              {/* 题型筛选 */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-glass"
              >
                <option value="all">全部题型</option>
                <option value="判断题">判断题</option>
                <option value="单选题">单选题</option>
                <option value="多选题">多选题</option>
              </select>

              {/* 排序 */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-glass"
              >
                <option value="time">按时间排序</option>
                <option value="count">按错误次数</option>
                <option value="category">按章节排序</option>
              </select>
            </div>
          </div>
        )}

        {/* 批量操作栏 */}
        {isSelectMode && (
          <div className="card-glass p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={selectAll} className="text-sm text-primary hover:underline">全选</button>
              <button onClick={deselectAll} className="text-sm text-secondary hover:underline">取消全选</button>
              <span className="text-sm text-secondary">已选择 {selectedIds.size} 项</span>
            </div>
            <button
              onClick={batchDelete}
              disabled={selectedIds.size === 0}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${
                selectedIds.size > 0
                  ? 'bg-error-light text-error'
                  : 'bg-primary-light text-secondary opacity-50 cursor-not-allowed'
              }`}
            >
              删除选中
            </button>
          </div>
        )}

        {/* 错题列表 */}
        {filteredQuestions.length === 0 ? (
          <div className="card-glass p-16 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold text-primary mb-2">太棒了！</h3>
            <p className="text-secondary">
              {searchQuery || filterCategory !== 'all' || filterType !== 'all'
                ? '没有匹配的错题'
                : '目前没有错题，继续保持！'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuestions.map((q, idx) => (
              <div
                key={q.id}
                className={`card-glass p-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${
                  isSelectMode && selectedIds.has(q.id) ? 'ring-2 ring-primary shadow-lg' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* 选择框 */}
                  {isSelectMode && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(q.id)}
                      onChange={() => toggleSelect(q.id)}
                      className="mt-1 w-4 h-4 accent-primary"
                    />
                  )}

                  {/* 题目内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="tag-glass text-xs text-blue">{q.type}</span>
                      <span className="tag-glass text-xs text-secondary">{q.category}</span>
                      <span className="tag-glass text-xs text-error">错误 {q.wrongCount || 1} 次</span>
                    </div>
                    <p className="text-sm text-primary line-clamp-2">{q.question}</p>
                    <p className="text-xs text-secondary mt-2">
                      正确答案：{q.answer} · {new Date(q.lastWrongTime).toLocaleDateString('zh-CN')}
                    </p>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setCurrentIndex(idx);
                        setMode('review');
                        setShowResult(false);
                      }}
                      className="btn-glass px-3 py-1.5 rounded-lg text-xs text-primary hover:scale-105 transition-transform"
                    >
                      详情
                    </button>
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      className="btn-glass px-3 py-1.5 rounded-lg text-xs text-error hover:scale-105 transition-transform"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 清空按钮 */}
        {wrongQuestions.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={clearAll}
              className="text-sm text-secondary hover:text-error transition-colors"
            >
              清空所有错题
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============ 练习/复习视图 ============
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setMode('list')}
          className="btn-glass px-4 py-2 rounded-xl text-sm text-secondary"
        >
          ← 返回列表
        </button>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-secondary">
            {currentIndex + 1} / {filteredQuestions.length}
          </span>
          <button
            onClick={() => {
              setShowResult(false);
              setUserAnswer(null);
              setIsCorrect(null);
              handleNext();
            }}
            className="btn-glass px-4 py-2 rounded-xl text-sm text-secondary"
          >
            跳过
          </button>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-6">
        <div className="progress-glass">
          <div
            className="progress-glass-fill"
            style={{ width: `${((currentIndex + 1) / filteredQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 题目卡片 */}
      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          questionIndex={currentIndex}
          totalQuestions={filteredQuestions.length}
          onAnswer={handleAnswer}
          showResult={showResult}
          userAnswer={userAnswer}
          isCorrect={isCorrect}
        />
      )}

      {/* 错题信息 */}
      {currentQuestion && (
        <div className="card-glass p-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-secondary">错误次数：<span className="text-error font-medium">{currentQuestion.wrongCount || 1}</span></span>
              <span className="text-secondary">最近错误：<span className="text-primary">{new Date(currentQuestion.lastWrongTime).toLocaleDateString('zh-CN')}</span></span>
            </div>
          </div>
        </div>
      )}

      {/* 导航按钮 */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            currentIndex === 0
              ? 'glass text-secondary opacity-50 cursor-not-allowed'
              : 'btn-glass text-secondary'
          }`}
        >
          ← 上一题
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === filteredQuestions.length - 1}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            currentIndex === filteredQuestions.length - 1
              ? 'glass text-secondary opacity-50 cursor-not-allowed'
              : 'btn-primary'
          }`}
        >
          下一题 →
        </button>
      </div>
    </div>
  );
}
