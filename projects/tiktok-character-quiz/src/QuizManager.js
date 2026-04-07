// QuizManager.js — State machine for TikTok Character Quiz
// Implements flow from GDD Section 5

import { QUIZ_QUESTIONS, calculateResult } from './quizData.js';

// States
export const QuizState = {
  START: 'START',
  QUESTION: 'QUESTION',
  LOADING: 'LOADING',
  RESULT: 'RESULT'
};

export class QuizManager {
  constructor(onStateChange) {
    this.onStateChange = onStateChange;
    this.currentQuestionIndex = 0;
    this.totalScore = 0;
    this.state = QuizState.START;
    this.answers = [];
  }

  startQuiz() {
    this.currentQuestionIndex = 0;
    this.totalScore = 0;
    this.answers = [];
    this.setState(QuizState.QUESTION);
  }

  answerQuestion(answerValue) {
    this.answers.push(answerValue);
    this.totalScore += answerValue;
    this.currentQuestionIndex++;

    if (this.currentQuestionIndex >= QUIZ_QUESTIONS.length) {
      this.setState(QuizState.LOADING);
      // Auto-transition to result after suspense delay
      setTimeout(() => {
        this.setState(QuizState.RESULT);
      }, 1500);
    } else {
      this.setState(QuizState.QUESTION);
    }
  }

  retakeQuiz() {
    this.startQuiz();
  }

  getCurrentQuestion() {
    return QUIZ_QUESTIONS[this.currentQuestionIndex];
  }

  getProgress() {
    return {
      current: this.currentQuestionIndex + 1,
      total: QUIZ_QUESTIONS.length
    };
  }

  getResult() {
    return calculateResult(this.totalScore);
  }

  setState(newState) {
    this.state = newState;
    if (this.onStateChange) {
      this.onStateChange(newState, this);
    }
  }
}
