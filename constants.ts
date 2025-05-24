
import { Difficulty } from './types';

export const APP_NAME = "Sorubot";
export const GEMINI_TEXT_MODEL = "gemini-2.5-flash-preview-04-17";

export const DEFAULT_NUM_QUESTIONS = 5;
export const MIN_QUESTIONS = 1;
export const MAX_QUESTIONS = 19; // Users can select up to 19 questions (less than 20)

export const DIFFICULTIES = [Difficulty.Easy, Difficulty.Medium, Difficulty.Hard];

export const LOCAL_STORAGE_QUIZZES_KEY = 'sorubot_quizzes';
export const LOCAL_STORAGE_QUIZ_DETAIL_PREFIX = 'sorubot_quiz_detail_';

export const WORDS_PER_QUESTION_MIN_ESTIMATE = 150; // For min question suggestion
export const WORDS_PER_QUESTION_MAX_ESTIMATE = 75;  // For max question suggestion