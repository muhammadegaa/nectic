/**
 * Access Control Errors
 * Custom error classes for access control and validation
 */

export class AccessDeniedError extends Error {
  constructor(message: string = "Access denied") {
    super(message)
    this.name = "AccessDeniedError"
  }
}

export class ValidationError extends Error {
  constructor(message: string = "Validation failed") {
    super(message)
    this.name = "ValidationError"
  }
}

