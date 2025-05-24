
export enum Difficulty {
  Easy = "Kolay",
  Medium = "Orta",
  Hard = "Zor",
}

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
  userAnswerIndex?: number;
}

export interface GeneratedQuiz {
  id: string;
  title: string;
  questions: Question[];
  difficulty: Difficulty;
  createdAt: string;
  sourceTextLength: number;
}

export interface StoredQuizData {
  id: string;
  title: string;
  difficulty: Difficulty;
  questionCount: number;
  createdAt: string;
}

export interface AppState {
  currentView: 'upload' | 'customize' | 'generating' | 'quiz' | 'loadingPrevQuiz';
  uploadedFile: File | null;
  extractedText: string | null;
  fileName: string | null;
  quizSettings: {
    difficulty: Difficulty;
    numQuestions: number;
  };
  currentQuiz: GeneratedQuiz | null;
  isLoading: boolean;
  error: string | null;
  explanationModal: {
    isOpen: boolean;
    questionId: string | null;
    isLoadingExplanation: boolean;
  };
  previousQuizzes: StoredQuizData[];
}

export enum ActionType {
  SET_VIEW = 'SET_VIEW',
  SET_FILE = 'SET_FILE',
  SET_EXTRACTED_TEXT = 'SET_EXTRACTED_TEXT',
  SET_QUIZ_SETTINGS = 'SET_QUIZ_SETTINGS',
  START_GENERATION = 'START_GENERATION',
  GENERATION_SUCCESS = 'GENERATION_SUCCESS',
  GENERATION_FAILURE = 'GENERATION_FAILURE',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  OPEN_EXPLANATION_MODAL = 'OPEN_EXPLANATION_MODAL',
  CLOSE_EXPLANATION_MODAL = 'CLOSE_EXPLANATION_MODAL',
  SET_EXPLANATION_LOADING = 'SET_EXPLANATION_LOADING',
  SET_EXPLANATION = 'SET_EXPLANATION',
  SET_USER_ANSWER = 'SET_USER_ANSWER',
  LOAD_PREVIOUS_QUIZZES = 'LOAD_PREVIOUS_QUIZZES',
  DELETE_QUIZ = 'DELETE_QUIZ',
  LOAD_QUIZ_FROM_STORAGE = 'LOAD_QUIZ_FROM_STORAGE',
}

export type AppAction =
  | { type: ActionType.SET_VIEW; payload: AppState['currentView'] }
  | { type: ActionType.SET_FILE; payload: { file: File | null; fileName: string | null } }
  | { type: ActionType.SET_EXTRACTED_TEXT; payload: string | null }
  | { type: ActionType.SET_QUIZ_SETTINGS; payload: AppState['quizSettings'] }
  | { type: ActionType.START_GENERATION }
  | { type: ActionType.GENERATION_SUCCESS; payload: GeneratedQuiz }
  | { type: ActionType.GENERATION_FAILURE; payload: string }
  | { type: ActionType.SET_LOADING; payload: boolean } // General loading
  | { type: ActionType.SET_ERROR; payload: string | null }
  | { type: ActionType.OPEN_EXPLANATION_MODAL; payload: string } // questionId
  | { type: ActionType.CLOSE_EXPLANATION_MODAL }
  | { type: ActionType.SET_EXPLANATION_LOADING; payload: boolean }
  | { type: ActionType.SET_EXPLANATION; payload: { questionId: string; explanation: string } }
  | { type: ActionType.SET_USER_ANSWER; payload: { questionId: string; answerIndex: number } }
  | { type: ActionType.LOAD_PREVIOUS_QUIZZES; payload: StoredQuizData[] }
  | { type: ActionType.DELETE_QUIZ; payload: string } // quizId
  | { type: ActionType.LOAD_QUIZ_FROM_STORAGE; payload: GeneratedQuiz };

// For Gemini API response
export interface GeminiQuestionFormat {
  question: string;
  options: string[];
  correctAnswerIndex: number; // Should be number
}
