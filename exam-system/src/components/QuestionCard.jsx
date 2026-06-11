import { useState, useEffect } from 'react';

export default function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  onAnswer,
  showResult = false,
  userAnswer = null,
  isCorrect = null,
  compact = false,
}) {
  const [selectedAnswer, setSelectedAnswer] = useState(userAnswer || '');

  useEffect(() => {
    setSelectedAnswer(userAnswer || '');
  }, [question.id, userAnswer]);

  const handleOptionClick = (optionLetter) => {
    if (showResult) return;

    if (question.type === '多选题') {
      const current = selectedAnswer.split('');
      const idx = current.indexOf(optionLetter);
      if (idx >= 0) {
        current.splice(idx, 1);
      } else {
        current.push(optionLetter);
      }
      setSelectedAnswer(current.sort().join(''));
    } else {
      setSelectedAnswer(optionLetter);
    }
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    onAnswer(question.id, selectedAnswer);
  };

  const getOptionStyle = (letter) => {
    if (!showResult) {
      return selectedAnswer.includes(letter)
        ? 'btn-glass text-primary'
        : 'btn-glass text-secondary hover:text-primary';
    }

    const isCorrectOption = question.answer.includes(letter);
    const isSelected = selectedAnswer.includes(letter);

    if (isCorrectOption) {
      return 'bg-success-light border border-success text-success';
    }
    if (isSelected && !isCorrectOption) {
      return 'bg-error-light border border-error text-error';
    }
    return 'glass opacity-60';
  };

  const getOptionIcon = (letter) => {
    if (!showResult) return null;
    
    const isCorrectOption = question.answer.includes(letter);
    const isSelected = selectedAnswer.includes(letter);

    if (isCorrectOption) {
      return <span className="text-success ml-2">✓</span>;
    }
    if (isSelected && !isCorrectOption) {
      return <span className="text-error ml-2">✗</span>;
    }
    return null;
  };

  return (
    <div className="card-glass overflow-hidden">
      {/* Header */}
      <div className={`border-b border-subtle ${compact ? 'px-4 py-2' : 'px-6 py-4'}`} style={{background: 'var(--color-primary-light)'}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-primary">
              {questionIndex !== undefined ? `#${questionIndex + 1}` : ''}
            </span>
            <span className={`tag-glass ${
              question.type === '判断题' 
                ? 'text-blue'
                : question.type === '单选题'
                ? 'text-success'
                : 'text-purple'
            }`}>
              {question.type}
            </span>
            <span className="text-xs text-secondary">{question.category}</span>
          </div>
          {showResult && (
            <span className={`tag-glass ${isCorrect ? 'text-success' : 'text-error'}`}>
              {isCorrect ? '✓ 正确' : '✗ 错误'}
            </span>
          )}
        </div>
      </div>

      {/* Question */}
      <div className={compact ? 'px-4 py-3' : 'px-6 py-5'}>
        <p className={`leading-relaxed ${compact ? 'text-sm mb-3' : 'text-base mb-6'}`} style={{color: 'var(--color-text)'}}>
          {question.question}
        </p>

        {/* Options */}
        <div className={compact ? 'space-y-2' : 'space-y-3'}>
          {question.options.map((option, idx) => {
            const letter = option.match(/^([A-Z])\./)?.[1] || String.fromCharCode(65 + idx);
            return (
              <button
                key={letter}
                onClick={() => handleOptionClick(letter)}
                disabled={showResult}
                className={`w-full rounded-2xl text-left transition-all duration-300 ${getOptionStyle(letter)} ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
              >
                <span className={compact ? 'text-sm' : 'font-medium'}>{option}</span>
                {getOptionIcon(letter)}
              </button>
            );
          })}

          {/* For judgment questions without options */}
          {question.type === '判断题' && question.options.length === 0 && (
            <div className="flex space-x-4">
              <button
                onClick={() => handleOptionClick('√')}
                disabled={showResult}
                className={`flex-1 rounded-2xl text-center font-medium transition-all duration-300 ${
                  selectedAnswer === '√'
                    ? 'btn-glass text-success'
                    : 'btn-glass text-secondary hover:text-success'
                } ${showResult && question.answer === '√' ? 'bg-success-light text-success' : ''} ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
              >
                ✓ 正确
              </button>
              <button
                onClick={() => handleOptionClick('×')}
                disabled={showResult}
                className={`flex-1 rounded-2xl text-center font-medium transition-all duration-300 ${
                  selectedAnswer === '×'
                    ? 'btn-glass text-error'
                    : 'btn-glass text-secondary hover:text-error'
                } ${showResult && question.answer === '×' ? 'bg-error-light text-error' : ''} ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
              >
                ✗ 错误
              </button>
            </div>
          )}
        </div>

        {/* Result */}
        {showResult && (
          <div className={`${compact ? 'mt-3 p-3' : 'mt-6 p-4'} rounded-2xl ${
            isCorrect 
              ? 'bg-success-light border border-success' 
              : 'bg-error-light border border-error'
          }`}>
            <div className="flex items-center">
              {!compact && (
                <span className={`text-lg font-semibold ${isCorrect ? 'text-success' : 'text-error'}`}>
                  {isCorrect ? '✓ 回答正确' : '✗ 回答错误'}
                </span>
              )}
              {!isCorrect && (
                <span className={`${compact ? 'text-sm' : 'ml-3 text-sm'} text-secondary`}>
                  正确答案：{question.answer}
                </span>
              )}
            </div>
            {question.explanation && (
              <p className={`${compact ? 'text-xs mt-1' : 'text-sm mt-2'} text-secondary`}>
                <span className="font-medium">解析：</span>
                {question.explanation}
              </p>
            )}
          </div>
        )}

        {/* Submit button */}
        {!showResult && (
          <div className={`${compact ? 'mt-3' : 'mt-6'} flex justify-end`}>
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className={`rounded-2xl text-sm font-medium transition-all duration-300 btn-primary ${compact ? 'px-5 py-2' : 'px-6 py-2.5'} ${
                !selectedAnswer ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              提交
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
