'use client';

import { useChallengeStore } from '@/store/useChallengeStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TraceStep } from '@/types';

interface TraceTableProps {
  trace: TraceStep[];
  isUserTrace?: boolean;
}

export function TraceTable({ trace, isUserTrace = false }: TraceTableProps) {
  const { currentStep, setCurrentStep } = useChallengeStore();

  if (trace.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isUserTrace ? 'Your Prediction' : 'Actual Execution'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No trace steps yet. Start predicting!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isUserTrace ? 'Your Prediction' : 'Actual Execution'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Step</th>
                <th className="p-2 text-left">Line</th>
                <th className="p-2 text-left">Variables</th>
                <th className="p-2 text-left">Output</th>
                <th className="p-2 text-left">Explanation</th>
              </tr>
            </thead>
            <tbody>
              {trace.map((step, index) => (
                <tr
                  key={step.step}
                  className={`border-b hover:bg-accent cursor-pointer ${
                    currentStep === step.step ? 'bg-accent' : ''
                  }`}
                  onClick={() => setCurrentStep(step.step)}
                >
                  <td className="p-2 font-mono">{step.step}</td>
                  <td className="p-2 font-mono">{step.line}</td>
                  <td className="p-2">
                    <pre className="text-xs bg-muted p-2 rounded">
                      {JSON.stringify(step.variables, null, 2)}
                    </pre>
                  </td>
                  <td className="p-2">
                    {step.output.length > 0 ? (
                      <div className="text-xs font-mono bg-muted p-1 rounded">
                        {step.output.join(', ')}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-2 text-sm text-muted-foreground">
                    {step.explanation || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

