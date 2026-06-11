// LocalStorage utility functions
const STORAGE_KEYS = {
  PROGRESS: 'exam_progress',
  WRONG_QUESTIONS: 'exam_wrong_questions',
  SETTINGS: 'exam_settings',
  PRACTICE_PROGRESS: 'practice_progress',
  FAVORITES: 'practice_favorites',
  STATS: 'practice_stats',
};

// Get item from localStorage
export function getItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error getting item from localStorage: ${error}`);
    return defaultValue;
  }
}

// Set item to localStorage
export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting item to localStorage: ${error}`);
    return false;
  }
}

// Remove item from localStorage
export function removeItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing item from localStorage: ${error}`);
    return false;
  }
}

// Save progress
export function saveProgress(progress) {
  return setItem(STORAGE_KEYS.PROGRESS, progress);
}

// Get progress
export function getProgress() {
  return getItem(STORAGE_KEYS.PROGRESS, {
    answeredQuestions: [],
    correctAnswers: 0,
    totalAnswered: 0,
    lastCategory: null,
    lastQuestionIndex: 0,
  });
}

// Save wrong question
export function saveWrongQuestion(question) {
  const wrongQuestions = getWrongQuestions();
  const exists = wrongQuestions.find(q => q.id === question.id);
  if (!exists) {
    wrongQuestions.push({
      ...question,
      wrongCount: 1,
      lastWrongTime: new Date().toISOString(),
    });
  } else {
    exists.wrongCount += 1;
    exists.lastWrongTime = new Date().toISOString();
  }
  return setItem(STORAGE_KEYS.WRONG_QUESTIONS, wrongQuestions);
}

// Remove wrong question (when answered correctly)
export function removeWrongQuestion(questionId) {
  const wrongQuestions = getWrongQuestions();
  const filtered = wrongQuestions.filter(q => q.id !== questionId);
  return setItem(STORAGE_KEYS.WRONG_QUESTIONS, filtered);
}

// Get wrong questions
export function getWrongQuestions() {
  return getItem(STORAGE_KEYS.WRONG_QUESTIONS, []);
}

// Save settings
export function saveSettings(settings) {
  return setItem(STORAGE_KEYS.SETTINGS, settings);
}

// Get settings
export function getSettings() {
  return getItem(STORAGE_KEYS.SETTINGS, {
    randomOptions: true,
    showExplanation: true,
    examDuration: 120, // minutes
    questionsPerExam: 100,
  });
}

// Clear wrong questions only
export function clearWrongQuestions() {
  return setItem(STORAGE_KEYS.WRONG_QUESTIONS, []);
}

// Clear all data
export function clearAllData() {
  removeItem(STORAGE_KEYS.PROGRESS);
  removeItem(STORAGE_KEYS.WRONG_QUESTIONS);
  removeItem(STORAGE_KEYS.SETTINGS);
  removeItem(STORAGE_KEYS.PRACTICE_PROGRESS);
  removeItem(STORAGE_KEYS.FAVORITES);
  removeItem(STORAGE_KEYS.STATS);
}

// ============ 练习进度记忆 ============
export function savePracticeProgress(data) {
  return setItem(STORAGE_KEYS.PRACTICE_PROGRESS, data);
}

export function getPracticeProgress() {
  return getItem(STORAGE_KEYS.PRACTICE_PROGRESS, null);
}

export function clearPracticeProgress() {
  removeItem(STORAGE_KEYS.PRACTICE_PROGRESS);
}

// 保存答题状态
export function savePracticeAnswers(category, type, answers, results) {
  const key = `practice_state_${category}_${type}`;
  setItem(key, {
    answers,
    results,
    timestamp: Date.now(),
  });
}

// 获取答题状态
export function getPracticeAnswers(category, type) {
  const key = `practice_state_${category}_${type}`;
  return getItem(key, { answers: {}, results: {} });
}

// 清除答题状态
export function clearPracticeAnswers(category, type) {
  const key = `practice_state_${category}_${type}`;
  removeItem(key);
}

// ============ 收藏题目 ============
export function addFavorite(questionId) {
  const favorites = getFavorites();
  if (!favorites.includes(questionId)) {
    favorites.push(questionId);
    setItem(STORAGE_KEYS.FAVORITES, favorites);
  }
  return favorites;
}

export function removeFavorite(questionId) {
  const favorites = getFavorites().filter(id => id !== questionId);
  setItem(STORAGE_KEYS.FAVORITES, favorites);
  return favorites;
}

export function isFavorite(questionId) {
  return getFavorites().includes(questionId);
}

export function getFavorites() {
  return getItem(STORAGE_KEYS.FAVORITES, []);
}

// ============ 答题统计 ============
export function saveQuestionStats(questionId, timeSpent, isCorrect) {
  const stats = getStats();
  if (!stats[questionId]) {
    stats[questionId] = {
      attempts: 0,
      correct: 0,
      totalTime: 0,
      lastAttempt: null,
    };
  }
  stats[questionId].attempts += 1;
  if (isCorrect) stats[questionId].correct += 1;
  stats[questionId].totalTime += timeSpent;
  stats[questionId].lastAttempt = new Date().toISOString();
  setItem(STORAGE_KEYS.STATS, stats);
  return stats;
}

export function getStats() {
  return getItem(STORAGE_KEYS.STATS, {});
}

export function getQuestionStats(questionId) {
  const stats = getStats();
  return stats[questionId] || null;
}

// 获取薄弱章节（错题最多的章节）
export function getWeakCategories() {
  const wrongQuestions = getWrongQuestions();
  const categoryCount = {};
  
  wrongQuestions.forEach(q => {
    categoryCount[q.category] = (categoryCount[q.category] || 0) + 1;
  });
  
  return Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({ category, count }));
}

// 获取答题速度统计
export function getSpeedStats() {
  const stats = getStats();
  let totalTime = 0;
  let totalCount = 0;
  
  Object.values(stats).forEach(s => {
    totalTime += s.totalTime;
    totalCount += s.attempts;
  });
  
  return {
    totalTime,
    totalCount,
    averageTime: totalCount > 0 ? Math.round(totalTime / totalCount) : 0,
  };
}
