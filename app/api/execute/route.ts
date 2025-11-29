import { NextRequest, NextResponse } from 'next/server';
import { executeJavaScript, executeCpp } from '@/lib/execution/tracer';
import { findDiscrepancies } from '@/lib/execution/tracer';
import type { TraceStep } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userTrace, language } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    // Execute the code based on language
    const executionResult = language === 'cpp' 
      ? await executeCpp(code)
      : await executeJavaScript(code);

    // Find discrepancies if user trace is provided
    let discrepancies: any[] = [];
    if (userTrace && executionResult.trace) {
      discrepancies = findDiscrepancies(userTrace as TraceStep[], executionResult.trace);
    }

    return NextResponse.json({
      ...executionResult,
      discrepancies,
    });
  } catch (error: any) {
    console.error('Execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Execution failed' },
      { status: 500 }
    );
  }
}

