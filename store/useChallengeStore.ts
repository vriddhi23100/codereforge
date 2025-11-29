import { create } from 'zustand';
import type { ChallengeState, Challenge, Prediction, ExecutionResult, Discrepancy, MentorQuestion, ConceptCard, ThinkingAnalysis } from '@/types';

interface ChallengeStore extends ChallengeState {
  // Actions
  setChallenge: (challenge: Challenge) => void;
  setPrediction: (prediction: Prediction) => void;
  submitPrediction: () => void;
  setExecutionResult: (result: ExecutionResult) => void;
  setDiscrepancies: (discrepancies: Discrepancy[]) => void;
  setMentorQuestions: (questions: MentorQuestion[]) => void;
  setThinkingAnalysis: (analysis: ThinkingAnalysis | null) => void;
  unlockExecution: () => void;
  setCurrentStep: (step: number) => void;
  setFixedCode: (code: string | null) => void;
  addConceptLearned: (concept: ConceptCard) => void;
  setFixSubmitted: (submitted: boolean) => void;
  setFixValidated: (validated: boolean) => void;
  reset: () => void;
}

const initialState: ChallengeState = {
  challenge: null,
  prediction: null,
  executionResult: null,
  discrepancies: [],
  mentorQuestions: [],
  thinkingAnalysis: null,
  isLocked: true,
  currentStep: 0,
  fixedCode: null,
  conceptsLearned: [],
  fixSubmitted: false,
  fixValidated: false,
};

export const useChallengeStore = create<ChallengeStore>((set) => ({
  ...initialState,
  
  setChallenge: (challenge) => set({ 
    challenge, 
    isLocked: true, 
    currentStep: 0,
    prediction: null,
    executionResult: null,
    discrepancies: [],
    mentorQuestions: [],
    thinkingAnalysis: null,
    fixedCode: null,
    fixSubmitted: false,
    fixValidated: false,
  }),
  
  setPrediction: (prediction) => set({ prediction }),
  
  submitPrediction: () => set((state) => ({
    prediction: state.prediction ? { ...state.prediction, submitted: true } : null,
    isLocked: false, // Unlock execution after prediction is submitted
  })),
  
  setExecutionResult: (result) => set({ executionResult: result }),
  
  setDiscrepancies: (discrepancies) => set({ discrepancies }),
  
  setMentorQuestions: (mentorQuestions) => set({ mentorQuestions }),
  
  setThinkingAnalysis: (thinkingAnalysis) => set({ thinkingAnalysis }),
  
  unlockExecution: () => set({ isLocked: false }),
  
  setCurrentStep: (currentStep) => set({ currentStep }),
  
  setFixedCode: (fixedCode) => set({ fixedCode: fixedCode || null }),
  
  addConceptLearned: (concept) => set((state) => {
    // Prevent duplicate concepts
    const exists = state.conceptsLearned.some(c => c.concept === concept.concept);
    if (exists) return state;
    return {
      conceptsLearned: [...state.conceptsLearned, concept],
    };
  }),
  
  setFixSubmitted: (fixSubmitted) => set({ fixSubmitted }),
  
  setFixValidated: (fixValidated) => set({ fixValidated }),
  
  reset: () => set(initialState),
}));

