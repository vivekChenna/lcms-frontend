/** Reads the emails the backend sends in development from MailHog's HTTP API (port 8025). */
const MAILHOG = process.env["MAILHOG_URL"] ?? "http://localhost:8025";

export type Mail = { subject: string; body: string };

/** Undoes quoted-printable encoding (soft line breaks and =XX escapes) so links read back intact. */
function decodeQuotedPrintable(text: string): string {
  return text
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-F]{2})/gi, (_m, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

async function messagesTo(address: string): Promise<Mail[]> {
  const res = await fetch(
    `${MAILHOG}/api/v2/search?kind=to&query=${encodeURIComponent(address)}&limit=50`,
  );
  if (!res.ok) throw new Error(`MailHog answered ${res.status}: is it running on ${MAILHOG}?`);
  const json = (await res.json()) as {
    items: { Content: { Body: string; Headers: Record<string, string[]> } }[];
  };
  // newest first
  return json.items.map((m) => ({
    subject: decodeQuotedPrintable(m.Content.Headers["Subject"]?.[0] ?? ""),
    body: decodeQuotedPrintable(m.Content.Body),
  }));
}

/** How many emails MailHog already holds for this address (take it before triggering a new one). */
export async function mailCount(address: string): Promise<number> {
  return (await messagesTo(address)).length;
}

/** Waits until more than `already` emails exist for the address, then returns the newest. */
export async function waitForNewMail(
  address: string,
  already = 0,
  timeoutMs = 15_000,
): Promise<Mail> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const all = await messagesTo(address);
    if (all.length > already) return all[0]!;
    if (Date.now() > deadline)
      throw new Error(`no new email for ${address} within ${timeoutMs} ms`);
    await new Promise((r) => setTimeout(r, 300));
  }
}

/** The one-time token in a password email's link. */
export function tokenFromMail(mail: Mail): string {
  const match = /\/set-password\?token=([0-9a-f]{64})/.exec(mail.body);
  if (!match?.[1])
    throw new Error(`no password link in the email "${mail.subject}":\n${mail.body}`);
  return match[1];
}
