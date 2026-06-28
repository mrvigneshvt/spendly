const VPA = /\b([a-z0-9.\-_]+@[a-z]+)\b/i;
const AT = /\b(?:at|to)\s+([A-Z][A-Z0-9 &._-]{2,30}?)(?:\s+(?:on|via|ref|UPI|Rs|INR)\b|[.,]|$)/;

export function extractPayee(body: string): string | null {
  const vpa = body.match(VPA);
  if (vpa) return vpa[1];
  const at = body.match(AT);
  if (at) return at[1].trim();
  return null;
}
