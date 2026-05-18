import { NextResponse } from 'next/server';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export function successResponse<T>(data: T, message?: string, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
  }, { status });
}

export function errorResponse(error: string, status: number = 400): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      message: error,
    },
    { status }
  );
}

export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse<ApiResponse> {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message: string = 'Forbidden'): NextResponse<ApiResponse> {
  return errorResponse(message, 403);
}

export function notFoundResponse(message: string = 'Not found'): NextResponse<ApiResponse> {
  return errorResponse(message, 404);
}

export function validationErrorResponse(message: string): NextResponse<ApiResponse> {
  return errorResponse(message, 422);
}
