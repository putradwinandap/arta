import type { LocalCapture } from "../../lib/db";

export function errorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Something went wrong. Please try again.";
  return error.message.replaceAll("_", " ");
}

export function captureApiPayload(item: LocalCapture) {
  return {
    id: item.id,
    amountMinor: item.amountMinor,
    note: item.note,
    capturedAt: item.capturedAt,
  };
}

export function isUnauthenticated(error: unknown) {
  return error instanceof Error && /^(unauthenticated|http_401)$/.test(error.message);
}

export function createCaptureId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function withCaptureTimeout<T>(stage: string, operation: Promise<T>) {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error(`capture_${stage}_timeout`)),
      5000,
    );
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
}
