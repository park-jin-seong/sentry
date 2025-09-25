// /src/lib/its.js
export async function searchCctv({ type = "its", cctvType, minX, maxX, minY, maxY }) {
    const qs = new URLSearchParams({
        type,
        cctvType: String(cctvType),
        minX: String(minX),
        maxX: String(maxX),
        minY: String(minY),
        maxY: String(maxY)
    });
    const res = await fetch(`/api/its/cctv?${qs.toString()}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
}
