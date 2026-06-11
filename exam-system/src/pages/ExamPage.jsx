import { useState, useEffect, useCallback } from 'react';
import QuestionCard from '../components/QuestionCard';
import ProgressBar from '../components/ProgressBar';
import Timer from '../components/Timer';
import { getQuestionsByType, shuffleOptions, getStatistics, getCategories } from '../utils/questions';
import { getProgress, saveProgress, saveWrongQuestion, removeWrongQuestion } from '../utils/storage';

// 默认考试配置
const DEFAULT_CONFIG = {
  判断题: { count: 40, score: 0.5 },
  单选题: { count: 140, score: 0.5 },
  多选题: { count: 10, score: 1 },
  duration: 90,
};

// 获取可用题目数量
function getAvailableCount(type) {
  return getQuestionsByType(type).length;
}

// 从题库中随机选取指定数量的题目
function getRandomQuestionsFromPool(pool, count) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export default function ExamPage({ onNavigate }) {
  // 考试状态：config(配置) / exam(考试中) / result(结果)
  const [status, setStatus] = useState('config');
  
  // 配置相关
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  
  // 考试相关
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedIds, setMarkedIds] = useState(new Set());
  const [showResult, setShowResult] = useState(false);
  
  // 结果相关
  const [results, setResults] = useState(null);
  const [showWrongOnly, setShowWrongOnly] = useState(false);

  const currentQuestion = questions[currentIndex];

  // 计算总题数和总分
  const totalQuestions = config.判断题.count + config.单选题.count + config.多选题.count;
  const totalScore = config.判断题.count * config.判断题.score + 
                     config.单选题.count * config.单选题.score + 
                     config.多选题.count * config.多选题.score;

  // 更新配置
  const updateConfig = (type, value) => {
    const available = getAvailableCount(type);
    const count = Math.max(0, Math.min(value, available));
    setConfig(prev => ({
      ...prev,
      [type]: { ...prev[type], count }
    }));
  };

  // 开始考试
  const startExam = () => {
    const judgeQuestions = getQuestionsByType('判断题');
    const singleQuestions = getQuestionsByType('单选题');
    const multiQuestions = getQuestionsByType('多选题');

    const examQuestions = [
      ...getRandomQuestionsFromPool(judgeQuestions, config.判断题.count),
      ...getRandomQuestionsFromPool(singleQuestions, config.单选题.count),
      ...getRandomQuestionsFromPool(multiQuestions, config.多选题.count),
    ].map(q => shuffleOptions(q));

    setQuestions(examQuestions);
    setCurrentIndex(0);
    setAnswers({});
    setMarkedIds(new Set());
    setShowResult(false);
    setResults(null);
    setStatus('exam');
  };

  // 回答问题
  const handleAnswer = useCallback((questionId, answer) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const correct = question.answer === answer;
    setShowResult(true);

    if (correct) {
      removeWrongQuestion(questionId);
    } else {
      saveWrongQuestion(question);
    }
  }, [questions]);

  // 下一题
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowResult(false);
    }
  };

  // 上一题
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowResult(false);
    }
  };

  // 标记题目
  const toggleMark = (questionId) => {
    setMarkedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // 计时结束
  const handleTimeUp = () => {
    finishExam();
  };

  // 保存答案
  const saveAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // 交卷
  const finishExam = () => {
    const answeredQuestions = questions.map(q => ({
      ...q,
      isCorrect: answers[q.id] === q.answer,
    }));

    // 按题型计算得分
    let totalScore = 0;
    let maxScore = 0;
    const byType = {};

    answeredQuestions.forEach(q => {
      const typeConfig = config[q.type];
      if (!typeConfig) return;

      if (!byType[q.type]) {
        byType[q.type] = { total: 0, correct: 0, score: 0, maxScore: 0 };
      }
      byType[q.type].total += 1;
      byType[q.type].maxScore += typeConfig.score;
      maxScore += typeConfig.score;

      if (q.isCorrect) {
        byType[q.type].correct += 1;
        byType[q.type].score += typeConfig.score;
        totalScore += typeConfig.score;
      }
    });

    // 按章节统计
    const byCategory = {};
    answeredQuestions.forEach(q => {
      if (!byCategory[q.category]) {
        byCategory[q.category] = { total: 0, correct: 0 };
      }
      byCategory[q.category].total += 1;
      if (q.isCorrect) {
        byCategory[q.category].correct += 1;
      }
    });

    const stats = getStatistics(answeredQuestions);
    setResults({
      ...stats,
      totalScore: Math.round(totalScore * 10) / 10,
      maxScore,
      byType,
      byCategory,
      answeredQuestions,
      markedIds: [...markedIds],
    });

    // 保存成绩到历史
    saveExamHistory({
      date: new Date().toISOString(),
      score: Math.round(totalScore * 10) / 10,
      maxScore,
      total: questions.length,
      correct: stats.correct,
      accuracy: stats.accuracy,
    });

    setStatus('result');

    // 保存进度
    const progress = getProgress();
    progress.totalAnswered += stats.total;
    progress.correctAnswers += stats.correct;
    progress.answeredQuestions = [
      ...progress.answeredQuestions,
      ...answeredQuestions.map(q => ({
        id: q.id,
        category: q.category,
        type: q.type,
        isCorrect: q.isCorrect,
      })),
    ];
    saveProgress(progress);
  };

  // 保存考试历史
  const saveExamHistory = (record) => {
    const history = JSON.parse(localStorage.getItem('exam_history') || '[]');
    history.push(record);
    // 只保留最近20次
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
    localStorage.setItem('exam_history', JSON.stringify(history));
  };

  // 获取考试历史
  const getExamHistory = () => {
    return JSON.parse(localStorage.getItem('exam_history') || '[]');
  };

  // 获取查看的题目列表
  const getDisplayQuestions = () => {
    if (showWrongOnly && results) {
      return results.answeredQuestions.filter(q => !q.isCorrect);
    }
    return questions;
  };

  // ============ 配置页面 ============
  if (status === 'config') {
    const history = getExamHistory();
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">模拟考试</h1>

        {/* 快捷预设 + 考试规则 */}
        <div className="card-glass p-6 mb-6">
          <h2 className="text-lg font-semibold text-primary mb-4">快速开始</h2>
          
          {/* 快捷预设按钮 */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setConfig({ 判断题: { count: 40, score: 0.5 }, 单选题: { count: 140, score: 0.5 }, 多选题: { count: 10, score: 1 }, duration: 90 })}
              className="btn-glass px-4 py-3 text-left rounded-xl"
            >
              <div className="font-medium text-primary">📋 正式考试</div>
              <div className="text-xs text-secondary mt-1">190题 · 90分钟 · 100分</div>
            </button>
            <button
              onClick={() => setConfig({ 判断题: { count: 10, score: 0.5 }, 单选题: { count: 20, score: 0.5 }, 多选题: { count: 5, score: 1 }, duration: 30 })}
              className="btn-glass px-4 py-3 text-left rounded-xl"
            >
              <div className="font-medium text-primary">⚡ 快速练习</div>
              <div className="text-xs text-secondary mt-1">35题 · 30分钟</div>
            </button>
            <button
              onClick={() => setConfig({ 判断题: { count: 5, score: 0.5 }, 单选题: { count: 10, score: 0.5 }, 多选题: { count: 2, score: 1 }, duration: 15 })}
              className="btn-glass px-4 py-3 text-left rounded-xl"
            >
              <div className="font-medium text-primary">🎯 碎片练习</div>
              <div className="text-xs text-secondary mt-1">17题 · 15分钟</div>
            </button>
          </div>

          {/* 考试规则 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-blue-light text-center">
              <div className="text-xs text-secondary mb-1">判断题</div>
              <div className="font-medium text-blue">{getAvailableCount('判断题')} 题</div>
              <div className="text-xs text-secondary">每题 0.5 分</div>
            </div>
            <div className="p-3 rounded-xl bg-success-light text-center">
              <div className="text-xs text-secondary mb-1">单选题</div>
              <div className="font-medium text-success">{getAvailableCount('单选题')} 题</div>
              <div className="text-xs text-secondary">每题 0.5 分</div>
            </div>
            <div className="p-3 rounded-xl bg-purple-light text-center">
              <div className="text-xs text-secondary mb-1">多选题</div>
              <div className="font-medium text-purple">{getAvailableCount('多选题')} 题</div>
              <div className="text-xs text-secondary">每题 1 分</div>
            </div>
          </div>
        </div>

        {/* 考试配置 */}
        <div className="card-glass p-6 mb-6">
          <h2 className="text-lg font-semibold text-primary mb-4">自定义配置</h2>
          
          <div className="space-y-3">
            {/* 判断题数量 */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-secondary">判断题数量</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateConfig('判断题', config.判断题.count - 1)}
                  className="btn-glass w-8 h-8 rounded-lg text-secondary"
                >
                  -
                </button>
                <input
                  type="number"
                  value={config.判断题.count}
                  onChange={(e) => updateConfig('判断题', parseInt(e.target.value) || 0)}
                  className="input-glass w-16 text-center text-sm"
                />
                <button
                  onClick={() => updateConfig('判断题', config.判断题.count + 1)}
                  className="btn-glass w-8 h-8 rounded-lg text-secondary"
                >
                  +
                </button>
              </div>
            </div>

            {/* 单选题数量 */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-secondary">单选题数量</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateConfig('单选题', config.单选题.count - 10)}
                  className="btn-glass w-8 h-8 rounded-lg text-secondary"
                >
                  -
                </button>
                <input
                  type="number"
                  value={config.单选题.count}
                  onChange={(e) => updateConfig('单选题', parseInt(e.target.value) || 0)}
                  className="input-glass w-16 text-center text-sm"
                />
                <button
                  onClick={() => updateConfig('单选题', config.单选题.count + 10)}
                  className="btn-glass w-8 h-8 rounded-lg text-secondary"
                >
                  +
                </button>
              </div>
            </div>

            {/* 多选题数量 */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-secondary">多选题数量</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateConfig('多选题', config.多选题.count - 1)}
                  className="btn-glass w-8 h-8 rounded-lg text-secondary"
                >
                  -
                </button>
                <input
                  type="number"
                  value={config.多选题.count}
                  onChange={(e) => updateConfig('多选题', parseInt(e.target.value) || 0)}
                  className="input-glass w-16 text-center text-sm"
                />
                <button
                  onClick={() => updateConfig('多选题', config.多选题.count + 1)}
                  className="btn-glass w-8 h-8 rounded-lg text-secondary"
                >
                  +
                </button>
              </div>
            </div>

            {/* 考试时长 */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-secondary">考试时长（分钟）</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setConfig(prev => ({ ...prev, duration: Math.max(10, prev.duration - 10) }))}
                  className="btn-glass w-8 h-8 rounded-lg text-secondary"
                >
                  -
                </button>
                <input
                  type="number"
                  value={config.duration}
                  onChange={(e) => setConfig(prev => ({ ...prev, duration: Math.max(10, parseInt(e.target.value) || 10) }))}
                  className="input-glass w-16 text-center text-sm"
                />
                <button
                  onClick={() => setConfig(prev => ({ ...prev, duration: prev.duration + 10 }))}
                  className="btn-glass w-8 h-8 rounded-lg text-secondary"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 汇总信息 */}
          <div className="mt-4 p-3 rounded-xl bg-primary-light">
            <div className="flex justify-between text-sm">
              <span className="text-secondary">总题数</span>
              <span className="font-medium text-primary">{totalQuestions} 题</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-secondary">满分</span>
              <span className="font-medium text-primary">{totalScore} 分</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-secondary">考试时长</span>
              <span className="font-medium text-primary">{config.duration} 分钟</span>
            </div>
          </div>
        </div>

        {/* 历史成绩 */}
        {history.length > 0 && (
          <div className="card-glass p-6 mb-6">
            <h2 className="text-lg font-semibold text-primary mb-4">历史成绩</h2>
            <div className="space-y-2">
              {history.slice(-5).reverse().map((record, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-primary-light">
                  <span className="text-sm text-secondary">
                    {new Date(record.date).toLocaleDateString('zh-CN')}
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {record.score} / {record.maxScore}
                  </span>
                  <span className={`tag-glass ${record.score >= 60 ? 'text-success' : 'text-error'}`}>
                    {record.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 开始按钮 */}
        <button
          onClick={startExam}
          disabled={totalQuestions === 0}
          className={`w-full py-4 rounded-2xl text-lg font-semibold transition-all duration-300 ${
            totalQuestions > 0
              ? 'btn-primary'
              : 'glass text-secondary opacity-50 cursor-not-allowed'
          }`}
        >
          开始考试
        </button>
      </div>
    );
  }

  // ============ 结果页面 ============
  if (status === 'result' && results) {
    const passed = results.totalScore >= 60;
    const displayQuestions = getDisplayQuestions();
    
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 成绩卡片 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
            考试结束
          </h2>

          {/* 分数 */}
          <div className="text-center mb-8">
            <div className={`text-6xl font-bold mb-2 ${passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {results.totalScore}
              <span className="text-3xl text-gray-400"> / {results.maxScore}</span>
            </div>
            <div className={`text-lg font-medium ${passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {passed ? '✓ 及格' : '✗ 不及格'}（及格线：60分）
            </div>
          </div>

          {/* 各题型得分 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {Object.entries(results.byType).map(([type, data]) => (
              <div key={type} className="text-center p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{type}</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {Math.round(data.score * 10) / 10} <span className="text-sm text-gray-400">/ {data.maxScore}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  正确 {data.correct}/{data.total}
                </div>
              </div>
            ))}
          </div>

          {/* 总体统计 */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-violet-50 dark:bg-violet-900/30 rounded-lg">
              <div className="text-xl font-bold text-violet-600 dark:text-violet-400">{results.total}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">总题数</div>
            </div>
            <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{results.correct}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">正确</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <div className="text-xl font-bold text-red-600 dark:text-red-400">{results.wrong}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">错误</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
              <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{results.markedIds.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">标记</div>
            </div>
          </div>

          {/* 各章节正确率 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">各章节正确率</h3>
            <div className="space-y-2">
              {Object.entries(results.byCategory).map(([cat, stats]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{cat}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          Math.round((stats.correct / stats.total) * 100) >= 80 ? 'bg-emerald-500' :
                          Math.round((stats.correct / stats.total) * 100) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.round((stats.correct / stats.total) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-10 text-right">
                      {Math.round((stats.correct / stats.total) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowWrongOnly(true);
                setStatus('review');
                setCurrentIndex(0);
                setShowResult(false);
              }}
              className="flex-1 py-2.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50"
            >
              复习错题 ({results.wrong})
            </button>
            <button
              onClick={() => {
                setShowWrongOnly(false);
                setStatus('review');
                setCurrentIndex(0);
                setShowResult(false);
              }}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600"
            >
              查看全部
            </button>
          </div>
        </div>

        {/* 重新考试 */}
        <div className="flex space-x-3">
          <button
            onClick={() => setStatus('config')}
            className="flex-1 py-3 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700"
          >
            重新考试
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="flex-1 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // ============ 答题页面 ============
  if (status === 'exam' || status === 'review') {
    const displayQuestions = getDisplayQuestions();
    const question = status === 'review' ? displayQuestions[currentIndex] : currentQuestion;
    const isReview = status === 'review';

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isReview ? '错题回顾' : '模拟考试'}
              </h2>
              {!isReview && (
                <Timer duration={config.duration} onTimeUp={handleTimeUp} />
              )}
            </div>
            <div className="flex items-center space-x-3">
              {isReview ? (
                <button
                  onClick={() => setStatus('result')}
                  className="px-4 py-2 bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300 rounded-lg text-sm font-medium"
                >
                  返回成绩
                </button>
              ) : (
                <button
                  onClick={finishExam}
                  className="px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/50"
                >
                  交卷
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentIndex + 1} / {displayQuestions.length}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              已答 {Object.keys(answers).length} 题
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / displayQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 答题卡 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-wrap gap-1.5">
            {displayQuestions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isMarked = markedIds.has(q.id);
              const isCorrect = q.isCorrect;
              
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowResult(isReview && isAnswered);
                  }}
                  className={`w-8 h-8 rounded text-xs font-medium relative transition-colors ${
                    idx === currentIndex
                      ? 'bg-violet-600 text-white'
                      : isReview
                      ? isCorrect
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'
                  }`}
                >
                  {idx + 1}
                  {isMarked && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 答题区域 */}
        {question && (
          <QuestionCard
            question={question}
            questionIndex={currentIndex}
            totalQuestions={displayQuestions.length}
            onAnswer={isReview ? undefined : (id, ans) => {
              saveAnswer(id, ans);
              handleAnswer(id, ans);
            }}
            showResult={showResult || isReview}
            userAnswer={isReview ? question.answer : answers[question.id]}
            isCorrect={isReview ? question.isCorrect : (answers[question.id] === question.answer)}
          />
        )}

        {/* 底部操作栏 */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentIndex === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700'
            }`}
          >
            上一题
          </button>

          <div className="flex space-x-2">
            {!isReview && (
              <button
                onClick={() => toggleMark(currentQuestion.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  markedIds.has(currentQuestion.id)
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'
                }`}
              >
                {markedIds.has(currentQuestion.id) ? '★ 已标记' : '☆ 标记'}
              </button>
            )}
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === displayQuestions.length - 1}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentIndex === displayQuestions.length - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}
          >
            下一题
          </button>
        </div>
      </div>
    );
  }

  return null;
}
