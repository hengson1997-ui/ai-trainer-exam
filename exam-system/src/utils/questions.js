import questions from '../data/questions.json';

// Get all questions
export function getAllQuestions() {
  return questions;
}

// Get questions by category
export function getQuestionsByCategory(category) {
  return questions.filter(q => q.category === category);
}

// Get questions by type
export function getQuestionsByType(type) {
  return questions.filter(q => q.type === type);
}

// Get question by id
export function getQuestionById(id) {
  return questions.find(q => q.id === id);
}

// Get all categories
export function getCategories() {
  const categories = [...new Set(questions.map(q => q.category))];
  return categories.map(cat => ({
    name: cat,
    count: questions.filter(q => q.category === cat).length,
  }));
}

// Get all types
export function getTypes() {
  const types = [...new Set(questions.map(q => q.type))];
  return types.map(type => ({
    name: type,
    count: questions.filter(q => q.type === type).length,
  }));
}

// Shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get random questions for exam
export function getRandomQuestions(count = 100, category = null) {
  let filtered = category 
    ? questions.filter(q => q.category === category)
    : questions;
  
  return shuffleArray(filtered).slice(0, count);
}

// Shuffle options for a question
export function shuffleOptions(question) {
  if (!question.options || question.options.length === 0) {
    return question;
  }

  // Extract option letters and texts
  const optionPairs = question.options.map(opt => {
    const match = opt.match(/^([A-Z])\.\s*(.+)$/);
    return match ? { letter: match[1], text: match[2] } : null;
  }).filter(Boolean);

  // Shuffle
  const shuffled = shuffleArray(optionPairs);

  // Reassign letters
  const newLetters = ['A', 'B', 'C', 'D', 'E'];
  const newOptions = shuffled.map((opt, idx) => `${newLetters[idx]}. ${opt.text}`);

  // Find new answer
  const oldAnswer = question.answer;
  const newAnswer = oldAnswer.split('').map(letter => {
    const idx = optionPairs.findIndex(opt => opt.letter === letter);
    return idx >= 0 ? newLetters[idx] : letter;
  }).join('');

  return {
    ...question,
    options: newOptions,
    answer: newAnswer,
  };
}

// Check answer
export function checkAnswer(question, userAnswer) {
  return question.answer === userAnswer;
}

// Parse answer for multi-select
export function parseAnswer(answer) {
  return answer.split('').sort().join('');
}

// Format answer for display
export function formatAnswer(answer) {
  if (answer.length === 1) return answer;
  return answer.split('').join(', ');
}

// Get statistics
export function getStatistics(answeredQuestions) {
  const total = answeredQuestions.length;
  const correct = answeredQuestions.filter(q => q.isCorrect).length;
  const wrong = total - correct;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  // By category
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

  // By type
  const byType = {};
  answeredQuestions.forEach(q => {
    if (!byType[q.type]) {
      byType[q.type] = { total: 0, correct: 0 };
    }
    byType[q.type].total += 1;
    if (q.isCorrect) {
      byType[q.type].correct += 1;
    }
  });

  return {
    total,
    correct,
    wrong,
    accuracy,
    byCategory,
    byType,
  };
}
