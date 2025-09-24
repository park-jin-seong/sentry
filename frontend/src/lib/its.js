import { api } from "./api";

export async function searchCctv({ cctvType, minX, maxX, minY, maxY }) {
    const qs = new URLSearchParams({
        cctvType: String(cctvType),
        minX: String(minX),
        maxX: String(maxX),
        minY: String(minY),
        maxY: String(maxY),
    });
    const res = await api(`/api/its/cctv?${qs.toString()}`, { credentials: "include" });
    if (!res.ok) throw new Error("검색 실패");
    return res.json(); // ItsCctvResponse
}
