// LocalStorage utility functions
const STORAGE_KEYS = {
  PROGRESS: 'exam_progress',
  WRONG_QUESTIONS: 'exam_wrong_questions',
  SETTINGS: 'exam_settings',
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

// Clear all data
export function clearAllData() {
  removeItem(STORAGE_KEYS.PROGRESS);
  removeItem(STORAGE_KEYS.WRONG_QUESTIONS);
  removeItem(STORAGE_KEYS.SETTINGS);
}
