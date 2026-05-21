import { NextResponse } from 'next/server';

const PRIVATE_NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, private',
  Pragma: 'no-cache',
  Expires: '0',
};

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
  }, { status, headers: PRIVATE_NO_STORE_HEADERS });
}

export function errorResponse(error: string, status: number = 400): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      message: error,
    },
    { status, headers: PRIVATE_NO_STORE_HEADERS }
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
