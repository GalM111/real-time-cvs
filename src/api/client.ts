const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, init);
    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Request failed: ${res.status}`);
    }
    return res.json() as Promise<T>;
}
