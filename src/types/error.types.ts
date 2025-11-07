export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ValidationError[];
  };
}

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: ValidationError[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}

