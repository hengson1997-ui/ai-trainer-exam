import { getCategories, getTypes, getAllQuestions } from '../utils/questions';
import { getProgress, getWrongQuestions } from '../utils/storage';

export default function HomePage({ onNavigate }) {
  const categories = getCategories();
  const types = getTypes();
  const totalQuestions = getAllQuestions().length;
  const progress = getProgress();
  const wrongQuestions = getWrongQuestions();

  const accuracy = progress.totalAnswered > 0
    ? Math.round((progress.correctAnswers / progress.totalAnswered) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-semibold text-primary mb-4" style={{textShadow: '0 2px 20px rgba(125, 107, 93, 0.15)'}}>
          人工智能训练师三级
        </h1>
        <p className="text-lg text-secondary">
          题库共 {totalQuestions} 道题目，涵盖 {categories.length} 个知识领域
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card-glass p-6">
          <div className="text-sm text-secondary mb-1">总题目数</div>
          <div className="text-3xl font-semibold text-primary">{totalQuestions}</div>
        </div>
        <div className="card-glass p-6">
          <div className="text-sm text-secondary mb-1">已作答</div>
          <div className="text-3xl font-semibold text-primary">{progress.totalAnswered}</div>
        </div>
        <div className="card-glass p-6">
          <div className="text-sm text-secondary mb-1">正确率</div>
          <div className="text-3xl font-semibold text-success">{accuracy}%</div>
        </div>
        <div className="card-glass p-6">
          <div className="text-sm text-secondary mb-1">错题数</div>
          <div className="text-3xl font-semibold text-error">{wrongQuestions.length}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => onNavigate('practice')}
          className="card-glass p-6 text-left transition-all duration-300 hover:scale-[1.02]"
          style={{borderLeft: '4px solid var(--color-primary)'}}
        >
          <div className="text-3xl mb-3">📝</div>
          <div className="text-lg font-medium text-primary">开始练习</div>
          <div className="text-sm text-secondary mt-1">按章节分类练习</div>
        </button>
        <button
          onClick={() => onNavigate('exam')}
          className="card-glass p-6 text-left transition-all duration-300 hover:scale-[1.02]"
          style={{borderLeft: '4px solid var(--color-blue)'}}
        >
          <div className="text-3xl mb-3">📋</div>
          <div className="text-lg font-medium text-primary">模拟考试</div>
          <div className="text-sm text-secondary mt-1">自定义题目数量</div>
        </button>
        <button
          onClick={() => onNavigate('wrong')}
          className="card-glass p-6 text-left transition-all duration-300 hover:scale-[1.02]"
          style={{borderLeft: '4px solid var(--color-error)'}}
        >
          <div className="text-3xl mb-3">❌</div>
          <div className="text-lg font-medium text-primary">错题本</div>
          <div className="text-sm text-secondary mt-1">{wrongQuestions.length} 道错题</div>
        </button>
      </div>

      {/* Categories */}
      <div className="card-glass p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">知识领域</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map(cat => (
            <button
              key={cat.name}
              onClick={() => onNavigate('practice', { category: cat.name })}
              className="btn-glass flex items-center justify-between p-3 rounded-xl transition-all duration-300"
            >
              <span className="text-sm text-secondary">{cat.name}</span>
              <span className="text-sm font-medium text-primary">{cat.count} 题</span>
            </button>
          ))}
        </div>
      </div>

      {/* Question Types */}
      <div className="card-glass p-6 mt-4">
        <h2 className="text-lg font-semibold text-primary mb-4">题型分布</h2>
        <div className="flex flex-wrap gap-3">
          {types.map(type => (
            <button
              key={type.name}
              onClick={() => onNavigate('practice', { type: type.name })}
              className={`tag-glass text-sm font-medium transition-all duration-300 hover:scale-105 ${
                type.name === '判断题'
                  ? 'text-blue'
                  : type.name === '单选题'
                  ? 'text-success'
                  : 'text-purple'
              }`}
            >
              {type.name} ({type.count})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
