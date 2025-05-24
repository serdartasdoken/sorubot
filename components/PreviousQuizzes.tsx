
import React from 'react';
import { StoredQuizData } from '../types';

interface PreviousQuizzesProps {
  quizzes: StoredQuizData[];
  onLoadQuiz: (quizId: string) => void;
  onDeleteQuiz: (quizId: string) => void;
}

const PreviousQuizzes: React.FC<PreviousQuizzesProps> = ({ quizzes, onLoadQuiz, onDeleteQuiz }) => {
  if (quizzes.length === 0) {
    return (
      <div className="mt-8 text-center text-gray-500">
        <p>Daha önce oluşturulmuş sınav bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="mt-10 w-full max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">Önceki Sınavlar</h3>
      <div className="space-y-3">
        {quizzes.map(quiz => (
          <div key={quiz.id} className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">{quiz.title}</p>
              <p className="text-xs text-gray-500">
                {new Date(quiz.createdAt).toLocaleString('tr-TR')} - {quiz.difficulty} - {quiz.questionCount} Soru
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onLoadQuiz(quiz.id)}
                className="text-sm text-primary-600 hover:text-primary-800 p-2 rounded-md hover:bg-primary-50"
                title="Sınavı Yükle"
              >
                <i className="fas fa-play-circle fa-lg"></i>
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`"${quiz.title}" adlı sınavı silmek istediğinizden emin misiniz?`)) {
                    onDeleteQuiz(quiz.id);
                  }
                }}
                className="text-sm text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50"
                title="Sınavı Sil"
              >
                <i className="fas fa-trash fa-lg"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviousQuizzes;
