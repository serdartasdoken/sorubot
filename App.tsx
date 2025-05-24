
import React, { useEffect, useReducer, useCallback } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import QuizCustomization from './components/QuizCustomization';
import QuizView from './components/QuizView';
import Spinner from './components/Spinner';
import PreviousQuizzes from './components/PreviousQuizzes';
import { AppState, AppAction, ActionType, Difficulty, GeneratedQuiz, Question, StoredQuizData } from './types';
import { generateQuestionsFromText, getExplanationForQuestion } from './services/geminiService';
import { DEFAULT_NUM_QUESTIONS, LOCAL_STORAGE_QUIZZES_KEY, LOCAL_STORAGE_QUIZ_DETAIL_PREFIX } from './constants';

const initialState: AppState = {
  currentView: 'upload',
  uploadedFile: null,
  extractedText: null,
  fileName: null,
  quizSettings: {
    difficulty: Difficulty.Medium,
    numQuestions: DEFAULT_NUM_QUESTIONS,
  },
  currentQuiz: null,
  isLoading: false,
  error: null,
  explanationModal: {
    isOpen: false,
    questionId: null,
    isLoadingExplanation: false,
  },
  previousQuizzes: [],
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case ActionType.SET_VIEW:
      return { ...state, currentView: action.payload, error: null };
    case ActionType.SET_FILE:
      return { ...state, uploadedFile: action.payload.file, fileName: action.payload.fileName, error: null };
    case ActionType.SET_EXTRACTED_TEXT:
      return { ...state, extractedText: action.payload, isLoading: false, currentView: 'customize', error: null };
    case ActionType.SET_QUIZ_SETTINGS:
      return { ...state, quizSettings: action.payload };
    case ActionType.START_GENERATION:
      return { ...state, isLoading: true, currentView: 'generating', error: null, currentQuiz: null };
    case ActionType.GENERATION_SUCCESS:
      return { ...state, isLoading: false, currentQuiz: action.payload, currentView: 'quiz', error: null };
    case ActionType.GENERATION_FAILURE:
      return { ...state, isLoading: false, error: action.payload, currentView: 'customize' }; // Or 'upload'
    case ActionType.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ActionType.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    case ActionType.OPEN_EXPLANATION_MODAL:
      return { ...state, explanationModal: { ...state.explanationModal, isOpen: true, questionId: action.payload } };
    case ActionType.CLOSE_EXPLANATION_MODAL:
      return { ...state, explanationModal: { ...state.explanationModal, isOpen: false, questionId: null, isLoadingExplanation: false } };
    case ActionType.SET_EXPLANATION_LOADING:
      return { ...state, explanationModal: { ...state.explanationModal, isLoadingExplanation: action.payload } };
    case ActionType.SET_EXPLANATION:
      if (!state.currentQuiz || !state.explanationModal.questionId) return state;
      return {
        ...state,
        currentQuiz: {
          ...state.currentQuiz,
          questions: state.currentQuiz.questions.map(q =>
            q.id === action.payload.questionId ? { ...q, explanation: action.payload.explanation } : q
          ),
        },
        explanationModal: { ...state.explanationModal, isLoadingExplanation: false },
      };
    case ActionType.SET_USER_ANSWER:
      if (!state.currentQuiz) return state;
      return {
        ...state,
        currentQuiz: {
          ...state.currentQuiz,
          questions: state.currentQuiz.questions.map(q =>
            q.id === action.payload.questionId ? { ...q, userAnswerIndex: action.payload.answerIndex } : q
          ),
        }
      };
    case ActionType.LOAD_PREVIOUS_QUIZZES:
      return { ...state, previousQuizzes: action.payload };
    case ActionType.DELETE_QUIZ:
      return {
        ...state,
        previousQuizzes: state.previousQuizzes.filter(q => q.id !== action.payload),
      };
    case ActionType.LOAD_QUIZ_FROM_STORAGE:
      return {
        ...state,
        currentQuiz: action.payload,
        extractedText: localStorage.getItem(`${LOCAL_STORAGE_QUIZ_DETAIL_PREFIX}${action.payload.id}_text`), // Assume text is stored separately
        fileName: action.payload.title, // Use quiz title as filename approximation
        quizSettings: { difficulty: action.payload.difficulty, numQuestions: action.payload.questions.length },
        currentView: 'quiz',
        isLoading: false,
        error: null,
      };
    default:
      return state;
  }
};

const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const saveQuizToLocalStorage = (quiz: GeneratedQuiz, text: string) => {
    try {
      const storedQuizzes: StoredQuizData[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_QUIZZES_KEY) || '[]');
      const newStoredQuiz: StoredQuizData = {
        id: quiz.id,
        title: quiz.title,
        difficulty: quiz.difficulty,
        questionCount: quiz.questions.length,
        createdAt: quiz.createdAt,
      };
      const updatedQuizzes = [newStoredQuiz, ...storedQuizzes.filter(sq => sq.id !== quiz.id)].slice(0, 10); // Keep last 10
      localStorage.setItem(LOCAL_STORAGE_QUIZZES_KEY, JSON.stringify(updatedQuizzes));
      localStorage.setItem(`${LOCAL_STORAGE_QUIZ_DETAIL_PREFIX}${quiz.id}`, JSON.stringify(quiz));
      localStorage.setItem(`${LOCAL_STORAGE_QUIZ_DETAIL_PREFIX}${quiz.id}_text`, text); // Store source text separately
      dispatch({ type: ActionType.LOAD_PREVIOUS_QUIZZES, payload: updatedQuizzes });
    } catch (e) {
      console.error("Error saving quiz to local storage:", e);
    }
  };

  const loadPreviousQuizzesFromStorage = useCallback(() => {
    try {
      const storedQuizzes: StoredQuizData[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_QUIZZES_KEY) || '[]');
      dispatch({ type: ActionType.LOAD_PREVIOUS_QUIZZES, payload: storedQuizzes });
    } catch (e) {
      console.error("Error loading quizzes from local storage:", e);
      dispatch({ type: ActionType.LOAD_PREVIOUS_QUIZZES, payload: [] });
    }
  }, []);

  useEffect(() => {
    loadPreviousQuizzesFromStorage();
  }, [loadPreviousQuizzesFromStorage]);


  const handleTextExtracted = (text: string, fileName: string) => {
    dispatch({ type: ActionType.SET_FILE, payload: { file: state.uploadedFile, fileName } });
    dispatch({ type: ActionType.SET_EXTRACTED_TEXT, payload: text });
  };

  const handleStartQuiz = async (difficulty: Difficulty, numQuestions: number) => {
    if (!state.extractedText) {
      dispatch({ type: ActionType.SET_ERROR, payload: "Metin bulunamadı." });
      return;
    }
    dispatch({ type: ActionType.SET_QUIZ_SETTINGS, payload: { difficulty, numQuestions } });
    dispatch({ type: ActionType.START_GENERATION });

    try {
      const questions: Question[] = await generateQuestionsFromText(state.extractedText, difficulty, numQuestions);
      const newQuiz: GeneratedQuiz = {
        id: `quiz-${Date.now()}`,
        title: state.fileName || `Sınav - ${new Date().toLocaleString()}`,
        questions,
        difficulty,
        createdAt: new Date().toISOString(),
        sourceTextLength: state.extractedText.length,
      };
      dispatch({ type: ActionType.GENERATION_SUCCESS, payload: newQuiz });
      if(state.extractedText) saveQuizToLocalStorage(newQuiz, state.extractedText);
    } catch (err) {
      const error = err as Error;
      dispatch({ type: ActionType.GENERATION_FAILURE, payload: error.message || "Soru üretilirken bilinmeyen bir hata oluştu." });
    }
  };

  const handleExplainRequest = async (questionId: string) => {
    if (!state.currentQuiz || !state.extractedText) return;
    const question = state.currentQuiz.questions.find(q => q.id === questionId);
    if (!question) return;

    dispatch({ type: ActionType.OPEN_EXPLANATION_MODAL, payload: questionId });

    if (question.explanation) return; // Already have explanation

    dispatch({ type: ActionType.SET_EXPLANATION_LOADING, payload: true });
    try {
      const explanation = await getExplanationForQuestion(question, state.extractedText);
      dispatch({ type: ActionType.SET_EXPLANATION, payload: { questionId, explanation } });
    } catch (err) {
      const error = err as Error;
      dispatch({ type: ActionType.SET_EXPLANATION, payload: { questionId, explanation: `Açıklama alınamadı: ${error.message}` } });
      // Keep modal open with error
    }
  };
  
  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    dispatch({ type: ActionType.SET_USER_ANSWER, payload: { questionId, answerIndex }});
  };

  const resetToUpload = () => {
    dispatch({ type: ActionType.SET_EXTRACTED_TEXT, payload: null });
    dispatch({ type: ActionType.SET_FILE, payload: { file: null, fileName: null } });
    dispatch({ type: ActionType.SET_VIEW, payload: 'upload' });
    dispatch({ type: ActionType.SET_ERROR, payload: null });
    dispatch({ type: ActionType.SET_LOADING, payload: false });
  };
  
  const resetToCustomize = () => {
     dispatch({ type: ActionType.SET_VIEW, payload: 'customize' });
  };

  const handleDeleteQuiz = (quizId: string) => {
    try {
      localStorage.removeItem(`${LOCAL_STORAGE_QUIZ_DETAIL_PREFIX}${quizId}`);
      localStorage.removeItem(`${LOCAL_STORAGE_QUIZ_DETAIL_PREFIX}${quizId}_text`);
      const storedQuizzes: StoredQuizData[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_QUIZZES_KEY) || '[]');
      const updatedQuizzes = storedQuizzes.filter(q => q.id !== quizId);
      localStorage.setItem(LOCAL_STORAGE_QUIZZES_KEY, JSON.stringify(updatedQuizzes));
      dispatch({ type: ActionType.DELETE_QUIZ, payload: quizId });
    } catch (e) {
      console.error("Error deleting quiz from local storage:", e);
    }
  };

  const handleLoadQuiz = (quizId: string) => {
    dispatch({type: ActionType.SET_LOADING, payload: true});
    dispatch({type: ActionType.SET_VIEW, payload: 'loadingPrevQuiz'});
    try {
      const quizDetailString = localStorage.getItem(`${LOCAL_STORAGE_QUIZ_DETAIL_PREFIX}${quizId}`);
      const quizText = localStorage.getItem(`${LOCAL_STORAGE_QUIZ_DETAIL_PREFIX}${quizId}_text`);

      if (quizDetailString && quizText) {
        const quizDetail: GeneratedQuiz = JSON.parse(quizDetailString);
         // Reset user answers for a fresh attempt
        const quizWithResetAnswers = {
            ...quizDetail,
            questions: quizDetail.questions.map(q => ({...q, userAnswerIndex: undefined, explanation: undefined})) 
        };

        dispatch({ type: ActionType.SET_EXTRACTED_TEXT, payload: quizText }); // Important to load text for explanations
        dispatch({ type: ActionType.LOAD_QUIZ_FROM_STORAGE, payload: quizWithResetAnswers });
      } else {
        throw new Error("Sınav detayı bulunamadı.");
      }
    } catch (e) {
      console.error("Error loading quiz detail from local storage:", e);
      dispatch({ type: ActionType.SET_ERROR, payload: "Kaydedilmiş sınav yüklenirken bir hata oluştu." });
      dispatch({ type: ActionType.SET_VIEW, payload: 'upload' }); // Go back to upload on error
      dispatch({ type: ActionType.SET_LOADING, payload: false });
    }
  };


  const renderContent = () => {
    if (state.isLoading && (state.currentView === 'upload' || state.currentView === 'generating' || state.currentView === 'loadingPrevQuiz')) {
        let message = "Yükleniyor...";
        if(state.currentView === 'generating') message = "Sınavınız oluşturuluyor, lütfen bekleyin...";
        if(state.currentView === 'loadingPrevQuiz') message = "Sınav yükleniyor...";
        return <div className="mt-20"><Spinner message={message} size="lg"/></div>;
    }

    if (state.error && (state.currentView === 'upload' || state.currentView === 'customize')) {
      return (
         <div className="w-full max-w-xl mx-auto mt-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
            <p className="font-semibold">Bir Hata Oluştu!</p>
            <p className="text-sm">{state.error}</p>
            <button 
                onClick={() => dispatch({ type: ActionType.SET_ERROR, payload: null })}
                className="mt-3 bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 text-xs"
            >
                Kapat
            </button>
        </div>
      );
    }


    switch (state.currentView) {
      case 'upload':
        return (
          <>
            <FileUpload
              onTextExtracted={handleTextExtracted}
              setLoading={(loading) => dispatch({ type: ActionType.SET_LOADING, payload: loading })}
              setError={(error) => dispatch({ type: ActionType.SET_ERROR, payload: error })}
              isLoading={state.isLoading}
            />
            <PreviousQuizzes 
              quizzes={state.previousQuizzes}
              onLoadQuiz={handleLoadQuiz}
              onDeleteQuiz={handleDeleteQuiz}
            />
          </>
        );
      case 'customize':
        if (!state.extractedText) {
          resetToUpload(); // Should not happen, but as a safeguard
          return null;
        }
        return (
          <QuizCustomization
            extractedText={state.extractedText}
            fileName={state.fileName}
            onStartQuiz={handleStartQuiz}
            onBack={resetToUpload}
          />
        );
      case 'quiz':
        if (!state.currentQuiz) {
            resetToUpload(); // Should not happen
            return null;
        }
        return (
          <QuizView
            quiz={state.currentQuiz}
            onExplainRequest={handleExplainRequest}
            onAnswerSelect={handleAnswerSelect}
            explanationModal={state.explanationModal}
            onCloseExplanationModal={() => dispatch({ type: ActionType.CLOSE_EXPLANATION_MODAL })}
            onBackToCustomize={resetToCustomize}
            onBackToUpload={resetToUpload}
          />
        );
      default:
        return <div className="mt-20"><Spinner message="Yükleniyor..." size="lg"/></div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderContent()}
      </main>
      <footer className="py-4 text-center text-sm text-gray-500 border-t border-gray-200">
        Sorubot &copy; {new Date().getFullYear()} - Akıllı Sınav Asistanınız
      </footer>
    </div>
  );
};

export default App;
