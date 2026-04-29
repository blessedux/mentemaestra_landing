import "server-only";

export async function postResendEmail(
  apiKey: string,
  logPrefix: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`${logPrefix} Resend error`, res.status, errText);
    return false;
  }
  return true;
}

