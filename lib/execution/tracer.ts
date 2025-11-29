import type { TraceStep, StackFrame, ExecutionResult } from '@/types';

export class CodeTracer {
  private steps: TraceStep[] = [];
  private currentVariables: Record<string, any> = {};
  private stack: StackFrame[] = [];
  private output: string[] = [];
  private lineNumber: number = 0;

  constructor() {
    this.reset();
  }

  reset() {
    this.steps = [];
    this.currentVariables = {};
    this.stack = [];
    this.output = [];
    this.lineNumber = 0;
  }

  addStep(line: number, variables: Record<string, any>, condition?: string, explanation?: string) {
    this.lineNumber = line;
    this.currentVariables = { ...variables };
    
    const step: TraceStep = {
      step: this.steps.length + 1,
      line,
      variables: { ...this.currentVariables },
      stack: [...this.stack],
      output: [...this.output],
      condition,
      explanation,
    };
    
    this.steps.push(step);
  }

  pushStackFrame(functionName: string, variables: Record<string, any>, line: number) {
    this.stack.push({
      functionName,
      variables: { ...variables },
      line,
    });
  }

  popStackFrame() {
    return this.stack.pop();
  }

  addOutput(value: string) {
    this.output.push(value);
  }

  getTrace(): TraceStep[] {
    return this.steps;
  }

  getCurrentStep(): TraceStep | null {
    return this.steps[this.steps.length - 1] || null;
  }
}

// C++ execution tracer (simulated)
// Since we can't execute C++ in the browser, we use static analysis to simulate execution
export async function executeCpp(code: string): Promise<ExecutionResult> {
  const tracer = new CodeTracer();
  const output: string[] = [];
  let error: string | undefined;
  const startTime = Date.now();

  try {
    const lines = code.split('\n');
    const variables: Record<string, any> = {};
    let i = 0;
    const maxIterations = 1000; // Prevent infinite loops
    let iterations = 0;
    
    // Simple C++ static analysis with loop simulation
    while (i < lines.length && iterations < maxIterations) {
      iterations++;
      const line = lines[i];
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#include') || trimmed.startsWith('using')) {
        i++;
        continue;
      }
      
      // Detect variable declarations: int x = 5;
      const intVarMatch = trimmed.match(/int\s+(\w+)\s*=\s*(\d+);/);
      if (intVarMatch) {
        const varName = intVarMatch[1];
        const value = parseInt(intVarMatch[2], 10);
        variables[varName] = value;
        tracer.addStep(
          i + 1,
          { ...variables },
          undefined,
          `Line ${i + 1}: Variable ${varName} initialized to ${value}`
        );
        i++;
        continue;
      }
      
      // Detect variable assignments: x = 10;
      const assignMatch = trimmed.match(/(\w+)\s*=\s*(\d+);/);
      if (assignMatch && variables.hasOwnProperty(assignMatch[1])) {
        const varName = assignMatch[1];
        const value = parseInt(assignMatch[2], 10);
        variables[varName] = value;
        tracer.addStep(
          i + 1,
          { ...variables },
          undefined,
          `Line ${i + 1}: Variable ${varName} assigned to ${value}`
        );
        i++;
        continue;
      }
      
      // Detect increment: x++;
      const incMatch = trimmed.match(/(\w+)\s*\+\+;/);
      if (incMatch && variables.hasOwnProperty(incMatch[1])) {
        const varName = incMatch[1];
        variables[varName] = (variables[varName] || 0) + 1;
        tracer.addStep(
          i + 1,
          { ...variables },
          undefined,
          `Line ${i + 1}: Variable ${varName} incremented to ${variables[varName]}`
        );
        i++;
        continue;
      }
      
      // Detect addition assignment: sum += i;
      const addAssignMatch = trimmed.match(/(\w+)\s*\+=\s*(\w+);/);
      if (addAssignMatch && variables.hasOwnProperty(addAssignMatch[1]) && variables.hasOwnProperty(addAssignMatch[2])) {
        const varName = addAssignMatch[1];
        const addVar = addAssignMatch[2];
        variables[varName] = (variables[varName] || 0) + (variables[addVar] || 0);
        tracer.addStep(
          i + 1,
          { ...variables },
          undefined,
          `Line ${i + 1}: Variable ${varName} += ${addVar}, now ${variables[varName]}`
        );
        i++;
        continue;
      }
      
      // Detect while loops: while (i < 5) {
      const whileMatch = trimmed.match(/while\s*\(\s*(\w+)\s*(<|<=|>|>=)\s*(\d+)\s*\)\s*\{/);
      if (whileMatch) {
        const varName = whileMatch[1];
        const op = whileMatch[2];
        const limit = parseInt(whileMatch[3], 10);
        const currentValue = variables[varName] || 0;
        
        let condition = false;
        if (op === '<') condition = currentValue < limit;
        else if (op === '<=') condition = currentValue <= limit;
        else if (op === '>') condition = currentValue > limit;
        else if (op === '>=') condition = currentValue >= limit;
        
        if (!condition) {
          // Skip to closing brace
          let braceCount = 1;
          i++;
          while (i < lines.length && braceCount > 0) {
            const nextLine = lines[i].trim();
            if (nextLine.includes('{')) braceCount++;
            if (nextLine.includes('}')) braceCount--;
            i++;
          }
          continue;
        }
        
        tracer.addStep(
          i + 1,
          { ...variables },
          `while (${varName} ${op} ${limit})`,
          `Line ${i + 1}: Loop condition true, ${varName} = ${currentValue}`
        );
        i++;
        continue;
      }
      
      // Detect closing brace - check if we need to loop back
      if (trimmed === '}') {
        // Find the matching while loop
        let j = i - 1;
        let braceCount = 1;
        while (j >= 0 && braceCount > 0) {
          const prevLine = lines[j].trim();
          if (prevLine.includes('}')) braceCount++;
          if (prevLine.includes('{')) braceCount--;
          if (braceCount === 0 && prevLine.includes('while')) {
            // Check loop condition again
            const whileMatch = prevLine.match(/while\s*\(\s*(\w+)\s*(<|<=|>|>=)\s*(\d+)\s*\)/);
            if (whileMatch) {
              const varName = whileMatch[1];
              const op = whileMatch[2];
              const limit = parseInt(whileMatch[3], 10);
              const currentValue = variables[varName] || 0;
              
              let condition = false;
              if (op === '<') condition = currentValue < limit;
              else if (op === '<=') condition = currentValue <= limit;
              else if (op === '>') condition = currentValue > limit;
              else if (op === '>=') condition = currentValue >= limit;
              
              if (condition) {
                // Loop back to while line
                i = j;
                continue;
              }
            }
          }
          j--;
        }
        i++;
        continue;
      }
      
      // Detect cout statements: cout << "text" << var << endl;
      if (trimmed.includes('cout')) {
        const coutMatch = trimmed.match(/cout\s*<<\s*([^;]+);/);
        if (coutMatch) {
          let outputText = coutMatch[1];
          // Replace variable names with their values
          Object.keys(variables).forEach(varName => {
            const regex = new RegExp(`\\b${varName}\\b`, 'g');
            outputText = outputText.replace(regex, String(variables[varName]));
          });
          // Remove quotes and << operators for display
          outputText = outputText.replace(/["']/g, '').replace(/\s*<<\s*/g, ' ').replace(/\s*endl\s*/g, '');
          output.push(outputText.trim());
          tracer.addStep(
            i + 1,
            { ...variables },
            undefined,
            `Line ${i + 1}: Output: ${outputText.trim()}`
          );
        }
        i++;
        continue;
      }
      
      // Detect function calls: result = factorial(5);
      const funcCallMatch = trimmed.match(/(\w+)\s*=\s*(\w+)\s*\((\d+)\);/);
      if (funcCallMatch) {
        const resultVar = funcCallMatch[1];
        const funcName = funcCallMatch[2];
        const arg = parseInt(funcCallMatch[3], 10);
        
        // Simple factorial simulation
        if (funcName === 'factorial') {
          let fact = 1;
          for (let j = 1; j <= arg; j++) {
            fact *= j;
          }
          variables[resultVar] = fact;
          tracer.addStep(
            i + 1,
            { ...variables },
            undefined,
            `Line ${i + 1}: Function ${funcName}(${arg}) called, result = ${fact}`
          );
        }
        i++;
        continue;
      }
      
      // Default: move to next line
      i++;
    }

    // Ensure at least one trace step
    if (tracer.getTrace().length === 0) {
      tracer.addStep(1, { ...variables }, undefined, 'Code analyzed');
    }

    return {
      success: true,
      output,
      trace: tracer.getTrace(),
      executionTime: Date.now() - startTime,
    };
  } catch (e: any) {
    error = e.message || 'Execution error';
    return {
      success: false,
      output,
      trace: tracer.getTrace(),
      error,
      executionTime: Date.now() - startTime,
    };
  }
}

// JavaScript execution tracer
// This uses a combination of execution and static analysis to create trace steps
export async function executeJavaScript(code: string): Promise<ExecutionResult> {
  const tracer = new CodeTracer();
  const output: string[] = [];
  let error: string | undefined;
  const startTime = Date.now();

  try {
    // Create a sandboxed execution environment
    const capturedOutput: string[] = [];
    const capturedLog = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      capturedOutput.push(message);
      output.push(message);
    };

    // Track variables by executing in a controlled environment
    const variableStore: Record<string, any> = {};
    const tracePoints: Array<{ line: number; vars: Record<string, any>; explanation: string }> = [];
    
    // Create a function that captures variable state
    const captureState = (lineNum: number, explanation: string) => {
      tracePoints.push({
        line: lineNum,
        vars: JSON.parse(JSON.stringify(variableStore)), // Deep copy
        explanation,
      });
    };

    // Wrap code to instrument it
    const lines = code.split('\n');
    const instrumentedCode = lines.map((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith('//')) return line;
      
      // Instrument variable assignments
      if (/^(let|const|var)\s+\w+\s*=/.test(trimmed)) {
        const varName = trimmed.match(/^(let|const|var)\s+(\w+)/)?.[2];
        if (varName) {
          return `${line}\n; _captureState(${lineNum}, "Line ${lineNum}: Variable ${varName} assigned");`;
        }
      }
      
      // Instrument console.log
      if (trimmed.includes('console.log')) {
        return `${line}\n; _captureState(${lineNum}, "Line ${lineNum}: Output logged");`;
      }
      
      // Instrument function calls (simple detection)
      if (trimmed.match(/^\w+\s*\(/) && !trimmed.includes('function') && !trimmed.includes('console')) {
        return `${line}\n; _captureState(${lineNum}, "Line ${lineNum}: Function called");`;
      }
      
      return line;
    }).join('\n');

    // Create execution context
    const wrappedCode = `
      (function(_capturedLog, _captureState, _vars) {
        // Override console.log
        console.log = function(...args) {
          _capturedLog(...args);
        };
        
        // Execute instrumented code
        ${instrumentedCode}
        
        // Capture final state
        _captureState(${lines.length}, "Final state");
        
        return _vars;
      })
    `;

    // Execute with state capture
    const func = eval(wrappedCode);
    func(
      capturedLog,
      (lineNum: number, explanation: string) => captureState(lineNum, explanation),
      variableStore
    );

    // Convert trace points to trace steps
    tracePoints.forEach((point) => {
      tracer.addStep(point.line, point.vars, undefined, point.explanation);
    });

    // If no trace steps, analyze code statically as fallback
    if (tracer.getTrace().length === 0) {
      const vars: Record<string, any> = {};
      
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//')) return;
        
        const lineNum = idx + 1;
        
        // Try to extract variable assignments
        const varMatch = trimmed.match(/^(let|const|var)\s+(\w+)\s*=\s*(.+?);?$/);
        if (varMatch) {
          try {
            const varName = varMatch[2];
            const valueStr = varMatch[3].trim();
            
            // Simple value parsing
            let value: any;
            if (valueStr === 'true') value = true;
            else if (valueStr === 'false') value = false;
            else if (valueStr === 'null') value = null;
            else if (/^\d+$/.test(valueStr)) value = parseInt(valueStr, 10);
            else if (/^\d+\.\d+$/.test(valueStr)) value = parseFloat(valueStr);
            else if ((valueStr.startsWith('"') && valueStr.endsWith('"')) || 
                     (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
              value = valueStr.slice(1, -1);
            } else if (valueStr.startsWith('[')) {
              value = [];
            } else if (valueStr.startsWith('{')) {
              value = {};
            } else {
              // Try to evaluate
              try {
                value = eval(valueStr);
              } catch {
                value = undefined;
              }
            }
            
            vars[varName] = value;
            tracer.addStep(
              lineNum,
              { ...vars },
              undefined,
              `Line ${lineNum}: Variable ${varName} = ${JSON.stringify(value)}`
            );
          } catch (e) {
            // Skip
          }
        }
        
        // Detect console.log
        if (trimmed.includes('console.log')) {
          tracer.addStep(
            lineNum,
            { ...vars },
            undefined,
            `Line ${lineNum}: Output logged`
          );
        }
      });
    }

    // Ensure at least one trace step
    if (tracer.getTrace().length === 0) {
      tracer.addStep(1, {}, undefined, 'Code executed');
    }

    return {
      success: true,
      output,
      trace: tracer.getTrace(),
      executionTime: Date.now() - startTime,
    };
  } catch (e: any) {
    error = e.message || 'Execution error';
    
    // Return trace even on error
    return {
      success: false,
      output,
      trace: tracer.getTrace(),
      error,
      executionTime: Date.now() - startTime,
    };
  }
}

// Compare user prediction with actual execution
export function findDiscrepancies(
  userTrace: TraceStep[],
  actualTrace: TraceStep[]
): Array<{ step: number; userVariable: any; actualVariable: any; variableName: string; explanation: string }> {
  const discrepancies: Array<{ step: number; userVariable: any; actualVariable: any; variableName: string; explanation: string }> = [];
  
  const maxSteps = Math.max(userTrace.length, actualTrace.length);
  
  for (let i = 0; i < maxSteps; i++) {
    const userStep = userTrace[i];
    const actualStep = actualTrace[i];
    
    if (!userStep || !actualStep) continue;
    
    // Compare variables
    const allVars = new Set([
      ...Object.keys(userStep.variables || {}),
      ...Object.keys(actualStep.variables || {}),
    ]);
    
    for (const varName of allVars) {
      const userValue = userStep.variables?.[varName];
      const actualValue = actualStep.variables?.[varName];
      
      if (JSON.stringify(userValue) !== JSON.stringify(actualValue)) {
        discrepancies.push({
          step: i + 1,
          userVariable: userValue,
          actualVariable: actualValue,
          variableName: varName,
          explanation: `Variable ${varName} differs: you predicted ${JSON.stringify(userValue)}, but actual value is ${JSON.stringify(actualValue)}`,
        });
      }
    }
  }
  
  return discrepancies;
}

