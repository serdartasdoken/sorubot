
import React, { useState } from 'react';
import { Question, GeneratedQuiz, Difficulty } from '../types';
import QuestionCard from './QuestionCard';
import Modal from './Modal';
import Spinner from './Spinner';

interface QuizViewProps {
  quiz: GeneratedQuiz;
  onExplainRequest: (questionId: string) => void;
  onAnswerSelect: (questionId: string, answerIndex: number) => void;
  explanationModal: {
    isOpen: boolean;
    questionId: string | null;
    isLoadingExplanation: boolean;
  };
  onCloseExplanationModal: () => void;
  onBackToCustomize: () => void;
  onBackToUpload: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({
  quiz,
  onExplainRequest,
  onAnswerSelect,
  explanationModal,
  onCloseExplanationModal,
  onBackToCustomize,
  onBackToUpload,
}) => {
  const [showResults, setShowResults] = useState(false);

  const currentQuestionForExplanation = quiz.questions.find(q => q.id === explanationModal.questionId);

  const handleShowResults = () => {
    setShowResults(true);
  };
  
  const calculateScore = () => {
    if (!showResults) return { correct: 0, total: quiz.questions.length};
    const correctAnswers = quiz.questions.filter(q => q.userAnswerIndex === q.correctAnswerIndex).length;
    return { correct: correctAnswers, total: quiz.questions.length };
  };

  const score = calculateScore();

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
        <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{quiz.title}</h2>
            <span className={`text-sm px-2 py-0.5 rounded-full font-medium
                ${quiz.difficulty === Difficulty.Easy ? 'bg-green-100 text-green-700' :
                  quiz.difficulty === Difficulty.Medium ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'}`}>
                {quiz.difficulty}
            </span>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
            <button 
                onClick={onBackToCustomize} 
                className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-3 rounded-lg transition-colors">
                <i className="fas fa-cog mr-1"></i> Yeni Ayarlar
            </button>
            <button 
                onClick={onBackToUpload} 
                className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-3 rounded-lg transition-colors">
                <i className="fas fa-file-alt mr-1"></i> Yeni Dosya
            </button>
        </div>
      </div>

      {quiz.questions.map((q, index) => (
        <QuestionCard
          key={q.id}
          question={q}
          questionNumber={index + 1}
          onAnswerSelect={onAnswerSelect}
          onExplain={onExplainRequest}
          showResult={showResults}
        />
      ))}

      {!showResults && (
        <button
          onClick={handleShowResults}
          className="w-full mt-6 bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400"
        >
          <i className="fas fa-check-circle mr-2"></i> Sonuçları Göster
        </button>
      )}

      {showResults && (
         <div className="mt-8 p-6 bg-primary-50 rounded-lg text-center shadow">
            <h3 className="text-2xl font-semibold text-primary-700">Sınav Tamamlandı!</h3>
            <p className="text-xl text-gray-700 mt-2">
                Skorunuz: <span className="font-bold">{score.correct} / {score.total}</span>
            </p>
         </div>
      )}

      {currentQuestionForExplanation && (
        <Modal
          isOpen={explanationModal.isOpen && explanationModal.questionId === currentQuestionForExplanation.id}
          onClose={onCloseExplanationModal}
          title={`Soru ${quiz.questions.findIndex(q => q.id === currentQuestionForExplanation.id) + 1} Açıklaması`}
        >
          {explanationModal.isLoadingExplanation ? (
            <Spinner message="Açıklama yükleniyor..." />
          ) : (
            <div className="space-y-3">
              <p className="font-semibold text-gray-700">{currentQuestionForExplanation.questionText}</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{currentQuestionForExplanation.explanation || "Açıklama bulunamadı."}</p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default QuizView;
