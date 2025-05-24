
import React from 'react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  onAnswerSelect: (questionId: string, answerIndex: number) => void;
  onExplain: (questionId: string) => void;
  showResult?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  onAnswerSelect,
  onExplain,
  showResult = false,
}) => {
  const getOptionClasses = (index: number): string => {
    let baseClasses = "block w-full text-left p-3 my-2 border rounded-lg transition-all duration-200 cursor-pointer";
    if (!showResult) {
      return `${baseClasses} ${question.userAnswerIndex === index ? 'bg-primary-100 border-primary-500 ring-2 ring-primary-300' : 'bg-white hover:bg-gray-50 border-gray-300'}`;
    }
    // Show results
    if (index === question.correctAnswerIndex) {
      return `${baseClasses} bg-green-100 border-green-500 text-green-800 font-medium`;
    }
    if (index === question.userAnswerIndex && index !== question.correctAnswerIndex) {
      return `${baseClasses} bg-red-100 border-red-500 text-red-800`;
    }
    return `${baseClasses} bg-white border-gray-300 text-gray-700`;
  };


  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {questionNumber}. {question.questionText}
      </h3>
      <div className="space-y-2">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => !showResult && onAnswerSelect(question.id, index)}
            className={getOptionClasses(index)}
            disabled={showResult}
            aria-pressed={question.userAnswerIndex === index}
          >
            <span className={`font-medium mr-2 ${ (showResult && index === question.correctAnswerIndex) ? 'text-green-700' : (showResult && index === question.userAnswerIndex && index !== question.correctAnswerIndex) ? 'text-red-700' : 'text-gray-700'}`}>{String.fromCharCode(65 + index)}.</span>
            {option}
            {showResult && index === question.correctAnswerIndex && <i className="fas fa-check text-green-600 ml-2"></i>}
            {showResult && index === question.userAnswerIndex && index !== question.correctAnswerIndex && <i className="fas fa-times text-red-600 ml-2"></i>}
          </button>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onExplain(question.id)}
          className="text-sm text-primary-600 hover:text-primary-800 font-medium py-2 px-3 rounded-md hover:bg-primary-50 transition-colors"
        >
          <i className="fas fa-info-circle mr-1"></i> Açıkla
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
