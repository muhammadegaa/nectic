/**
 * Enterprise-Grade API Client
 * Handles retries, rate limiting, error handling for external APIs
 */

export interface ApiClientOptions {
  maxRetries?: number
  retryDelay?: number
  timeout?: number
  rateLimitRetryAfter?: boolean
}

export interface ApiResponse<T = any> {
  data: T
  status: number
  headers: Headers
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Make API request with retry logic and rate limiting
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit & { retryOptions?: ApiClientOptions } = {}
): Promise<ApiResponse<T>> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 30000,
    rateLimitRetryAfter = true,
  } = options.retryOptions || {}

  let lastError: ApiError | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        if (rateLimitRetryAfter && retryAfter && attempt < maxRetries) {
          const delay = parseInt(retryAfter, 10) * 1000
          await sleep(delay)
          continue
        }
        throw new ApiError(
          'Rate limit exceeded',
          429,
          await response.json().catch(() => ({})),
          true
        )
      }

      // Handle server errors (retryable)
      if (response.status >= 500 && attempt < maxRetries) {
        await sleep(retryDelay * Math.pow(2, attempt)) // Exponential backoff
        continue
      }

      // Handle client errors (not retryable)
      if (response.status >= 400 && response.status < 500) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          errorData.error?.message || errorData.message || `API error: ${response.statusText}`,
          response.status,
          errorData,
          false
        )
      }

      // Success
      const data = await response.json().catch(() => ({}))
      return {
        data: data as T,
        status: response.status,
        headers: response.headers,
      }
    } catch (error: any) {
      lastError = error instanceof ApiError ? error : new ApiError(
        error.message || 'Request failed',
        0,
        error,
        attempt < maxRetries
      )

      // Don't retry on abort (timeout) or non-retryable errors
      if (error.name === 'AbortError' || (error instanceof ApiError && !error.retryable)) {
        throw error
      }

      // Last attempt
      if (attempt === maxRetries) {
        break
      }

      // Exponential backoff
      await sleep(retryDelay * Math.pow(2, attempt))
    }
  }

  throw lastError || new ApiError('Request failed after retries', 0, undefined, false)
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

