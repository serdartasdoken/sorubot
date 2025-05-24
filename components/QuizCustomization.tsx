
import React, { useState, useEffect } from 'react';
import { Difficulty } from '../types';
import { DEFAULT_NUM_QUESTIONS, MIN_QUESTIONS, MAX_QUESTIONS, DIFFICULTIES, WORDS_PER_QUESTION_MIN_ESTIMATE, WORDS_PER_QUESTION_MAX_ESTIMATE } from '../constants';

interface QuizCustomizationProps {
  extractedText: string;
  fileName: string | null;
  onStartQuiz: (difficulty: Difficulty, numQuestions: number) => void;
  onBack: () => void;
}

const QuizCustomization: React.FC<QuizCustomizationProps> = ({ extractedText, fileName, onStartQuiz, onBack }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Medium);
  const [numQuestions, setNumQuestions] = useState<number>(DEFAULT_NUM_QUESTIONS);
  const [suggestedMin, setSuggestedMin] = useState(MIN_QUESTIONS);
  const [suggestedMax, setSuggestedMax] = useState(MAX_QUESTIONS);

  useEffect(() => {
    if (extractedText) {
      const wordCount = extractedText.split(/\s+/).length;
      const minQ = Math.max(MIN_QUESTIONS, Math.min(MAX_QUESTIONS, Math.floor(wordCount / WORDS_PER_QUESTION_MIN_ESTIMATE)));
      const maxQ = Math.max(MIN_QUESTIONS, Math.min(MAX_QUESTIONS, Math.floor(wordCount / WORDS_PER_QUESTION_MAX_ESTIMATE)));
      
      setSuggestedMin(minQ > 0 ? minQ : 1);
      setSuggestedMax(maxQ > minQ ? maxQ : (minQ > 0 ? minQ + 1 : MIN_QUESTIONS +1) );

      // Adjust numQuestions to be within the new suggested range if it's outside
      // or if it's the default and the suggested max is lower
      if (numQuestions > maxQ || (numQuestions === DEFAULT_NUM_QUESTIONS && DEFAULT_NUM_QUESTIONS > maxQ && maxQ > 0)) {
        setNumQuestions(maxQ);
      } else if (numQuestions < minQ) {
        setNumQuestions(minQ);
      }
    }
  }, [extractedText, numQuestions]);


  const handleNumQuestionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = MIN_QUESTIONS;
    if (value < MIN_QUESTIONS) value = MIN_QUESTIONS;
    if (value > MAX_QUESTIONS) value = MAX_QUESTIONS;
    setNumQuestions(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartQuiz(difficulty, numQuestions);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-xl">
      <button onClick={onBack} className="mb-4 text-sm text-primary-600 hover:text-primary-800">
        <i className="fas fa-arrow-left mr-1"></i> Farklı bir dosya yükle
      </button>
      <h2 className="text-2xl font-semibold text-center text-gray-700 mb-2">Sınav Ayarları</h2>
      {fileName && <p className="text-center text-gray-500 mb-6 text-sm">Dosya: {fileName}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
            Zorluk Seviyesi
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            {DIFFICULTIES.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 mb-1">
            Soru Sayısı
          </label>
          <input
            type="number"
            id="numQuestions"
            value={numQuestions}
            onChange={handleNumQuestionsChange}
            min={MIN_QUESTIONS}
            max={MAX_QUESTIONS}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">
            Metin uzunluğuna göre önerilen soru sayısı: {suggestedMin} - {suggestedMax}. (En fazla: {MAX_QUESTIONS})
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <i className="fas fa-cogs mr-2"></i> Sınav Oluştur
          </button>
        </div>
      </form>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
            <h4 className="text-sm font-semibold text-gray-600 mb-1">Metin Özeti:</h4>
            <p className="text-xs text-gray-500 italic">
                {extractedText.substring(0, 500)}...
            </p>
        </div>
    </div>
  );
};

export default QuizCustomization;
