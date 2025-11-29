// Core types for CodeReforge

export interface Challenge {
  id: string;
  title: string;
  description: string;
  code: string;
  language: 'javascript' | 'python' | 'typescript' | 'cpp';
  difficulty: 'easy' | 'medium' | 'hard';
  concepts: string[];
  expectedOutput?: string;
}

export interface TraceStep {
  step: number;
  line: number;
  variables: Record<string, any>;
  stack: StackFrame[];
  output: string[];
  condition?: string;
  explanation?: string;
}

export interface StackFrame {
  functionName: string;
  variables: Record<string, any>;
  line: number;
}

export interface Prediction {
  description: string;
  expectedOutput: string;
  traceSteps: TraceStep[];
  submitted: boolean;
}

export interface ExecutionResult {
  success: boolean;
  output: string[];
  trace: TraceStep[];
  error?: string;
  executionTime?: number;
}

export interface Discrepancy {
  step: number;
  userVariable: any;
  actualVariable: any;
  variableName: string;
  explanation: string;
}

export interface MentorQuestion {
  question: string;
  type: 'socratic' | 'hint' | 'reflection';
  relatedStep?: number;
}

export interface ThinkingAnalysis {
  reasoningQuality: 'excellent' | 'good' | 'needs_improvement' | 'unclear';
  strengths: string[];
  weaknesses: string[];
  misconceptions: string[];
  suggestions: string[];
  overallAssessment: string;
}

export interface ConceptCard {
  concept: string;
  description: string;
  learned: boolean;
}

export interface ChallengeState {
  challenge: Challenge | null;
  prediction: Prediction | null;
  executionResult: ExecutionResult | null;
  discrepancies: Discrepancy[];
  mentorQuestions: MentorQuestion[];
  thinkingAnalysis: ThinkingAnalysis | null;
  isLocked: boolean;
  currentStep: number;
  fixedCode: string | null;
  conceptsLearned: ConceptCard[];
  fixSubmitted: boolean;
  fixValidated: boolean;
}

