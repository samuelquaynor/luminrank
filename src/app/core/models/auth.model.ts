export interface JwtPayload {
  sub: string; // user id
  email: string;
  name: string;
  role: string;
  iat: number; // issued at
  exp: number; // expiration
}

export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
}

export interface AuthError extends ApiError {
  field?: string; // for field-specific validation errors
}
