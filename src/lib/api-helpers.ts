/**
 * API helper utilities for retry logic and better error handling
 */

export interface RetryOptions {
  maxRetries?: number
  delayMs?: number
  onRetry?: (attempt: number, error: Error) => void
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, onRetry } = options

  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt)
        if (onRetry) {
          onRetry(attempt + 1, lastError)
        }
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}

/**
 * Get user-friendly error message from API response
 */
export function getErrorMessage(error: unknown, defaultMessage: string = "Something went wrong"): string {
  if (error instanceof Error) {
    // Check if it's a network error
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      return "Network error. Please check your connection and try again."
    }

    // Check if it's an authentication error
    if (error.message.includes("Unauthorized") || error.message.includes("Authentication")) {
      return "Your session has expired. Please log in again."
    }

    // Check if it's a rate limit error
    if (error.message.includes("rate limit") || error.message.includes("429")) {
      return "Too many requests. Please wait a moment and try again."
    }

    // Return the error message if it's user-friendly
    if (error.message && !error.message.includes("Error:") && !error.message.includes("at ")) {
      return error.message
    }
  }

  // Try to extract error from response
  if (typeof error === "object" && error !== null && "error" in error) {
    const errorObj = error as { error?: string; message?: string }
    return errorObj.error || errorObj.message || defaultMessage
  }

  return defaultMessage
}

/**
 * Fetch with better error handling
 */
export async function fetchWithErrorHandling(
  url: string,
  options: RequestInit = {},
  retryOptions?: RetryOptions
): Promise<Response> {
  const fetchFn = async () => {
    const response = await fetch(url, options)

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`

      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage
      }

      const error = new Error(errorMessage)
      ;(error as any).status = response.status
      throw error
    }

    return response
  }

  if (retryOptions) {
    return retryWithBackoff(fetchFn, retryOptions)
  }

  return fetchFn()
}

