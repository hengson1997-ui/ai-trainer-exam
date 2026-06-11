import { useState, useEffect } from 'react';
import { getProgress, getWrongQuestions } from '../utils/storage';
import { getCategories, getAllQuestions, getStatistics } from '../utils/questions';

export default function StatsPage() {
  const [progress, setProgress] = useState(null);
  const [wrongQuestions, setWrongQuestions] = useState([]);

  useEffect(() => {
    setProgress(getProgress());
    setWrongQuestions(getWrongQuestions());
  }, []);

  const categories = getCategories();
  const totalQuestions = getAllQuestions().length;

  if (!progress) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center text-secondary">加载中...</div>
      </div>
    );
  }

  const stats = getStatistics(progress.answeredQuestions);
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  const completionRate = Math.round((stats.total / totalQuestions) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-primary mb-8">学习统计</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card-glass p-6 hover:scale-[1.02] transition-transform">
          <div className="text-sm text-secondary mb-2">总题目数</div>
          <div className="text-3xl font-semibold text-primary">{totalQuestions}</div>
        </div>
        <div className="card-glass p-6 hover:scale-[1.02] transition-transform">
          <div className="text-sm text-secondary mb-2">已作答</div>
          <div className="text-3xl font-semibold text-primary">{stats.total}</div>
          <div className="text-xs text-secondary mt-1">完成率 {completionRate}%</div>
        </div>
        <div className="card-glass p-6 hover:scale-[1.02] transition-transform">
          <div className="text-sm text-secondary mb-2">正确率</div>
          <div className="text-3xl font-semibold text-success">{accuracy}%</div>
          <div className="text-xs text-secondary mt-1">{stats.correct} 道正确</div>
        </div>
        <div className="card-glass p-6 hover:scale-[1.02] transition-transform">
          <div className="text-sm text-secondary mb-2">错题数</div>
          <div className="text-3xl font-semibold text-error">{wrongQuestions.length}</div>
          <div className="text-xs text-secondary mt-1">需要加强</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Progress */}
        <div className="card-glass p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">各章节进度</h2>
          <div className="space-y-4">
            {categories.map(cat => {
              const catStats = stats.byCategory[cat.name];
              const answered = catStats ? catStats.total : 0;
              const correct = catStats ? catStats.correct : 0;
              const catAccuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
              const progressPercent = Math.round((answered / cat.count) * 100);

              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-secondary">{cat.name}</span>
                    <span className="text-xs text-secondary">
                      {answered}/{cat.count} ({catAccuracy}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-primary-light rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progressPercent}%`, background: 'var(--color-primary)' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weak Areas */}
        <div className="card-glass p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">薄弱环节</h2>
          
          {wrongQuestions.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-secondary mb-3">错题分布</h3>
              <div className="space-y-3">
                {categories.map(cat => {
                  const catWrong = wrongQuestions.filter(q => q.category === cat.name);
                  if (catWrong.length === 0) return null;
                  return (
                    <div key={cat.name} className="flex items-center justify-between p-3 bg-error-light rounded-lg">
                      <span className="text-sm text-secondary">{cat.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-error">{catWrong.length} 题</span>
                        <div className="w-24 h-2 bg-surface rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.round((catWrong.length / wrongQuestions.length) * 100)}%`, background: 'var(--color-error)' }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-secondary">暂无错题</p>
            </div>
          )}

          {/* Type breakdown */}
          {Object.keys(stats.byType).length > 0 && (
            <div className="mt-6 pt-6 border-t border-theme">
              <h3 className="text-sm font-medium text-secondary mb-3">各题型正确率</h3>
              <div className="space-y-3">
                {Object.entries(stats.byType).map(([type, data]) => {
                  const typeAccuracy = Math.round((data.correct / data.total) * 100);
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-secondary">{type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-primary-light rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              typeAccuracy >= 80 ? 'bg-success' :
                              typeAccuracy >= 60 ? 'bg-warning' : 'bg-error'
                            }`}
                            style={{ width: `${typeAccuracy}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-primary w-12 text-right">
                          {typeAccuracy}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
