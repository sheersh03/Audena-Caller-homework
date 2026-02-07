const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN ?? "audena-secret";
const HEADER_VALUE = `Bearer ${PUBLIC_TOKEN}`;

export function getAuthHeaders(extra?: HeadersInit): HeadersInit {
  return {
    Authorization: HEADER_VALUE,
    ...extra,
  };
}
