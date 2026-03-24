/**
 * API client for FastAPI backend.
 *
 * Authenticated requests send the JWT:
 *   Authorization: Bearer <token>
 *
 * Use the auth context's getToken() and pass it to API client functions.
 */

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}
