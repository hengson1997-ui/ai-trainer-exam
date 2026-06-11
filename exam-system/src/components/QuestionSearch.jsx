/**
 * 题目搜索和过滤组件
 * 支持按关键词、题型、难度、领域进行筛选
 */

import { useState } from 'react';
import { searchQuestions, filterQuestions, QUESTION_TYPES } from '../utils/questionParser';
import './QuestionSearch.css';

export default function QuestionSearch({
  questions = [],
  domainId = '',
  onFilter = () => {},
  onSearch = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [results, setResults] = useState(questions);

  // 处理搜索
  const handleSearch = (term) => {
    setSearchTerm(term);
    performFilter(term, selectedType, selectedDifficulty);
  };

  // 处理题型过滤
  const handleTypeChange = (type) => {
    setSelectedType(type);
    performFilter(searchTerm, type, selectedDifficulty);
  };

  // 处理难度过滤
  const handleDifficultyChange = (difficulty) => {
    setSelectedDifficulty(difficulty);
    performFilter(searchTerm, selectedType, difficulty);
  };

  // 执行综合过滤
  const performFilter = (term, type, difficulty) => {
    let filtered = questions;

    // 关键词搜索
    if (term) {
      filtered = searchQuestions(filtered, term);
    }

    // 过滤条件
    const filters = {};
    if (type) filters.type = type;
    if (difficulty) filters.difficulty = difficulty;

    if (Object.keys(filters).length > 0) {
      filtered = filterQuestions(filtered, filters);
    }

    setResults(filtered);
    onFilter({ keyword: term, type, difficulty, count: filtered.length });
  };

  return (
    <div className="question-search">
      {/* 搜索栏 */}
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="搜索题目内容、知识点..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <span className="search-icon">🔍</span>
      </div>

      {/* 过滤条件 */}
      <div className="filter-bar">
        {/* 题型过滤 */}
        <div className="filter-group">
          <label className="filter-label">题型：</label>
          <div className="filter-options">
            <button
              className={`filter-btn ${selectedType === '' ? 'active' : ''}`}
              onClick={() => handleTypeChange('')}
            >
              全部
            </button>
            {Object.entries(QUESTION_TYPES).map(([key, label]) => (
              <button
                key={key}
                className={`filter-btn ${selectedType === label ? 'active' : ''}`}
                onClick={() => handleTypeChange(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 难度过滤 */}
        <div className="filter-group">
          <label className="filter-label">难度：</label>
          <div className="filter-options">
            <button
              className={`filter-btn ${selectedDifficulty === '' ? 'active' : ''}`}
              onClick={() => handleDifficultyChange('')}
            >
              全部
            </button>
            {['低', '中', '高'].map(difficulty => (
              <button
                key={difficulty}
                className={`filter-btn ${selectedDifficulty === difficulty ? 'active' : ''}`}
                onClick={() => handleDifficultyChange(difficulty)}
              >
                {difficulty}难度
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 结果统计 */}
      <div className="results-summary">
        <span className="result-count">
          找到 <strong>{results.length}</strong> 道题目
          {domainId && <span className="domain-tag">（来自 {domainId}）</span>}
        </span>
      </div>

      {/* 清空过滤 */}
      {(searchTerm || selectedType || selectedDifficulty) && (
        <button
          className="clear-filters-btn"
          onClick={() => {
            setSearchTerm('');
            setSelectedType('');
            setSelectedDifficulty('');
            setResults(questions);
          }}
        >
          ✕ 清除所有过滤
        </button>
      )}
    </div>
  );
}
