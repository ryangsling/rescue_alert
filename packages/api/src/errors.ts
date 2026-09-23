import { FunctionsHttpError } from "@supabase/supabase-js";

/**
 * supabase-js wraps any non-2xx Edge Function response in
 * FunctionsHttpError with a fixed, generic message ("Edge Function
 * returned a non-2xx status code") - proven directly against a real
 * browser call to delete-account, which discarded the function's own
 * `{ error: "current_password_incorrect" }` body. error.context is
 * the raw Response; this reads the real error code back out of it.
 * Falls back to the generic message for a network-level failure
 * (FunctionsFetchError/FunctionsRelayError), which has no body to read.
 */
export async function getEdgeFunctionErrorCode(
  error: unknown,
): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.json()) as { error?: string };
      if (body.error) return body.error;
    } catch {
      // Response body wasn't JSON - fall through to the generic message.
    }
  }
  return error instanceof Error ? error.message : "unknown_error";
}
