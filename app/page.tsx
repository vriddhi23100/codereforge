'use client';

import { useChallengeStore } from '@/store/useChallengeStore';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { PredictionForm } from '@/components/trace/PredictionForm';
import { ExecutionVisualization } from '@/components/visualization/ExecutionVisualization';
import { MentorQuestions } from '@/components/visualization/MentorQuestions';
import { ConceptCard } from '@/components/visualization/ConceptCard';
import { TraceComparison } from '@/components/visualization/TraceComparison';
import { ThinkingAnalysis } from '@/components/visualization/ThinkingAnalysis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Play, Lock, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import type { Challenge } from '@/types';
import { bugscppChallenges } from '@/lib/data/bugscpp-challenges';

// Sample challenges with actual bugs - C++ code
// Includes real-world bugs from BugsCpp dataset: https://github.com/Suresoft-GLaDOS/bugscpp
const sampleChallenges: Challenge[] = [
  ...bugscppChallenges,
  {
    id: '1',
    title: 'Buggy Factorial',
    description: 'This factorial function has a bug. Predict what it will output before running it.',
    code: `#include <iostream>
using namespace std;

int factorial(int n) {
  if (n == 0) {
    return 1;
  }
  return n * factorial(n - 1);
}

int main() {
  int result = factorial(5);
  cout << result << endl;
  return 0;
}`,
    language: 'cpp',
    difficulty: 'easy',
    concepts: ['recursion', 'base cases', 'function calls'],
  },
  {
    id: '2',
    title: 'Off-by-One Loop Bug',
    description: 'This loop should sum numbers from 0 to 4, but something is wrong. Predict the final values.',
    code: `#include <iostream>
using namespace std;

int main() {
  int i = 0;
  int sum = 0;
  
  while (i <= 5) {
    sum += i;
    i++;
  }
  
  cout << "Final i: " << i << endl;
  cout << "Sum: " << sum << endl;
  return 0;
}`,
    language: 'cpp',
    difficulty: 'easy',
    concepts: ['loops', 'off-by-one errors', 'loop conditions'],
  },
  {
    id: '3',
    title: 'Array Reference Bug',
    description: 'This code modifies an array. Predict what will be logged and understand why.',
    code: `#include <iostream>
using namespace std;

int main() {
  int arr[3] = {1, 2, 3};
  int* arr2 = arr;
  arr2[2] = 4;
  
  cout << "arr[2]: " << arr[2] << endl;
  cout << "arr2[2]: " << arr2[2] << endl;
  return 0;
}`,
    language: 'cpp',
    difficulty: 'medium',
    concepts: ['pointers', 'array references', 'memory addresses'],
  },
  {
    id: '4',
    title: 'Variable Scope Mystery',
    description: 'Predict the output. Pay attention to variable scope and shadowing.',
    code: `#include <iostream>
using namespace std;

int x = 10;

void test() {
  int x = 20;
  cout << "x inside function: " << x << endl;
}

int main() {
  test();
  cout << "x outside function: " << x << endl;
  return 0;
}`,
    language: 'cpp',
    difficulty: 'medium',
    concepts: ['variable scope', 'global variables', 'variable shadowing'],
  },
  {
    id: '5',
    title: 'Infinite Loop Bug',
    description: 'This code should count to 5, but something is wrong. Predict what happens.',
    code: `#include <iostream>
using namespace std;

int main() {
  int count = 0;
  
  while (count < 5) {
    cout << "Count: " << count << endl;
  }
  
  cout << "Final count: " << count << endl;
  return 0;
}`,
    language: 'cpp',
    difficulty: 'easy',
    concepts: ['loops', 'increment operators', 'loop termination'],
  },
];

export default function Home() {
  const {
    challenge,
    prediction,
    executionResult,
    isLocked,
    fixedCode,
    fixSubmitted,
    fixValidated,
    thinkingAnalysis,
    setChallenge,
    unlockExecution,
    setExecutionResult,
    setDiscrepancies,
    setMentorQuestions,
    setThinkingAnalysis,
    setFixedCode,
    addConceptLearned,
    setFixSubmitted,
    setFixValidated,
  } = useChallengeStore();

  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async () => {
    if (!challenge || isLocked) return;

    setIsExecuting(true);
    try {
      const code = challenge.code;
      const userTrace = prediction?.traceSteps || [];

      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userTrace, language: challenge.language }),
      });

      const result = await response.json();
      setExecutionResult(result);
      setDiscrepancies(result.discrepancies || []);

      // Generate mentor questions if there are discrepancies
      if (result.discrepancies && result.discrepancies.length > 0) {
        const mentorResponse = await fetch('/api/mentor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            discrepancies: result.discrepancies,
            code,
            trace: result.trace,
          }),
        });

        const mentorData = await mentorResponse.json();
        setMentorQuestions(mentorData.questions || []);
      }
    } catch (error) {
      console.error('Execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleChallengeSelect = (selectedChallenge: Challenge) => {
    setChallenge(selectedChallenge);
  };

  const handleSubmitFix = async () => {
    if (!fixedCode || !challenge) {
      alert('Please edit the code first before submitting.');
      return;
    }

    // Check if code was actually changed
    if (fixedCode === challenge.code) {
      alert('Please modify the code to fix the bug before submitting.');
      return;
    }

    // Execute the fixed code to verify it works
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fixedCode, language: challenge.language }),
      });

      const result = await response.json();
      
      if (!result.success) {
        alert(`Error: ${result.error || 'Code execution failed'}`);
        return;
      }

      // Validate the fix by checking if it actually fixes the bug
      let isValidFix = false;
      
      if (challenge.id === '5') {
        // Infinite loop challenge - check if count increments and loop terminates
        const hasIncrement = fixedCode.includes('count++') || 
                            fixedCode.includes('count = count + 1') ||
                            fixedCode.includes('count += 1') ||
                            fixedCode.includes('++count');
        // Check if output shows count reaching 5 and loop terminates
        const outputText = result.output.join(' ');
        const hasFinalCount = outputText.includes('Final count: 5');
        // Also check that we don't have infinite output (should have max 6 lines: 5 counts + final)
        const outputLines = result.output.length;
        isValidFix = hasIncrement && hasFinalCount && outputLines <= 6;
      } else if (challenge.id === '1') {
        // Factorial - check if it returns correct value (120 for factorial(5))
        const outputText = result.output.join(' ');
        isValidFix = outputText.includes('120');
      } else if (challenge.id === '2') {
        // Off-by-one - check if sum is correct (should be 10 for 0+1+2+3+4, not 15 for 0+1+2+3+4+5)
        // The fix is to change "i <= 5" to "i < 5"
        
        // Check that the code was changed from <= to <
        // Look for "i < 5" pattern (with optional whitespace)
        const hasCorrectCondition = /i\s*<\s*5/.test(fixedCode);
        // Make sure the buggy condition "i <= 5" is NOT present
        const hasBuggyCondition = /i\s*<=\s*5/.test(fixedCode);
        
        // The fix is valid if:
        // 1. Code has the correct condition (i < 5)
        // 2. Code does NOT have the buggy condition (i <= 5)
        // 3. Code actually changed from the original
        const codeChanged = hasCorrectCondition && !hasBuggyCondition && fixedCode !== challenge.code;
        
        // Also try to validate output if available
        const outputText = result.output.join(' ');
        let sumValue = null;
        const sumMatch = outputText.match(/sum[:\s]+(\d+)/i);
        if (sumMatch) {
          sumValue = parseInt(sumMatch[1], 10);
        }
        
        // Primary validation: code change is correct
        // Secondary: if output is available, check sum is 10 (not 15)
        isValidFix = codeChanged && (sumValue === null || sumValue === 10);
        
        // Debug logging
        if (!isValidFix) {
          console.log('Challenge 2 validation failed:', {
            hasCorrectCondition,
            hasBuggyCondition,
            codeChanged,
            sumValue,
            outputText: outputText.substring(0, 150),
            fixedCodeSnippet: fixedCode.match(/while\s*\([^)]+\)/)?.[0] || 'not found'
          });
        }
      } else if (challenge.id === '3') {
        // Array reference - check if user understands references
        // Accept if code changed meaningfully (not just whitespace)
        const originalTrimmed = challenge.code.replace(/\s+/g, '');
        const fixedTrimmed = fixedCode.replace(/\s+/g, '');
        isValidFix = originalTrimmed !== fixedTrimmed && result.success;
      } else if (challenge.id === '4') {
        // Variable scope - accept if code changed meaningfully
        const originalTrimmed = challenge.code.replace(/\s+/g, '');
        const fixedTrimmed = fixedCode.replace(/\s+/g, '');
        isValidFix = originalTrimmed !== fixedTrimmed && result.success;
      } else {
        // Default: accept if code changed and executes successfully
        isValidFix = fixedCode !== challenge.code && result.success;
      }

      setFixSubmitted(true);
      setFixValidated(isValidFix);

      if (isValidFix) {
        // Add concept cards for learned concepts (only once)
        if (!fixValidated) {
          challenge.concepts.forEach((concept) => {
            addConceptLearned({
              concept,
              description: `You successfully understood and fixed the ${concept} concept!`,
              learned: true,
            });
          });
        }
        alert('✓ Fix submitted successfully! The bug has been fixed. Check the concept cards below.');
      } else {
        alert('⚠ The code executes, but the bug may not be fully fixed. Review your solution and try again.');
      }
    } catch (error) {
      console.error('Fix submission error:', error);
      alert('Failed to submit fix. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold">CodeReforge</h1>
          <p className="text-muted-foreground">
            Rebuild Your Logic — Think Before You Run
          </p>
        </div>

        {!challenge ? (
          <Card>
            <CardHeader>
              <CardTitle>Select a Challenge</CardTitle>
              <CardDescription>
                Choose a buggy code snippet to analyze and fix
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {sampleChallenges.map((ch) => (
                  <Card
                    key={ch.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleChallengeSelect(ch)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{ch.title}</CardTitle>
                      <CardDescription>{ch.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {ch.concepts.map((concept) => (
                          <span
                            key={concept}
                            className="text-xs bg-muted px-2 py-1 rounded"
                          >
                            {concept}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Challenge Header */}
            <Card>
              <CardHeader>
                <CardTitle>{challenge.title}</CardTitle>
                <CardDescription>{challenge.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeEditor readOnly={true} height="250px" />
              </CardContent>
            </Card>

            {/* Step 1: Predict Before You Run */}
            {!prediction?.submitted && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      1
                    </span>
                    Step 1: Predict Before You Run
                  </CardTitle>
                  <CardDescription>
                    Describe what the code does and trace its execution manually. You must complete this step before proceeding.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PredictionForm />
                </CardContent>
              </Card>
            )}

            {/* Step 2: Run the Truth - Only show after Step 1 is complete */}
            {prediction?.submitted && (
              <>
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        2
                      </span>
                      Step 2: Run the Truth
                    </CardTitle>
                    <CardDescription>
                      Execute the code and see how it actually runs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!executionResult && (
                      <Button
                        onClick={handleExecute}
                        disabled={isLocked || isExecuting}
                        className="w-full"
                        size="lg"
                      >
                        {isLocked ? (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Locked — Complete Prediction First
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            {isExecuting ? 'Executing...' : 'Execute Code & See Results'}
                          </>
                        )}
                      </Button>
                    )}

                    {prediction?.submitted && (
                      <>
                        <Card className="bg-muted/50">
                          <CardHeader>
                            <CardTitle className="text-lg">Your Prediction</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <p className="text-sm">
                                <strong>Description:</strong> {prediction.description}
                              </p>
                              <p className="text-sm">
                                <strong>Expected Output:</strong> {prediction.expectedOutput}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* AI Thinking Analysis */}
                        <ThinkingAnalysis />
                      </>
                    )}

                    {executionResult && (
                      <div className="space-y-4">
                        <ExecutionVisualization />
                        <MentorQuestions />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Step 3: Fix the Forge - Only show after Step 2 is complete */}
                {executionResult && (
                  <Card className="border-primary">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                          3
                        </span>
                        Step 3: Fix the Forge
                      </CardTitle>
                      <CardDescription>
                        Edit the code to fix the bug
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <CodeEditor readOnly={false} height="300px" />
                      <Button 
                        onClick={handleSubmitFix}
                        className="w-full" 
                        variant="outline"
                        disabled={!fixedCode || fixedCode === challenge.code || (fixSubmitted && fixValidated)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {fixSubmitted && fixValidated ? 'Fix Validated ✓' : 'Submit Fix'}
                      </Button>
                      {fixedCode && fixedCode === challenge.code && (
                        <p className="text-xs text-muted-foreground text-center">
                          Edit the code to fix the bug before submitting
                        </p>
                      )}
                      {fixSubmitted && fixValidated && (
                        <p className="text-xs text-green-600 text-center">
                          ✓ Bug fixed successfully! Check the comparison and concept cards below.
                        </p>
                      )}
                      {fixSubmitted && !fixValidated && (
                        <p className="text-xs text-yellow-600 text-center">
                          ⚠ Fix submitted but may not be correct. Review and try again.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Show comparison and concepts after fix is submitted */}
                {fixSubmitted && executionResult && (
                  <div className="space-y-4">
                    <TraceComparison />
                    <ConceptCard />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

