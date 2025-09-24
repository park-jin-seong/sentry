import { useState } from "react";
import { searchCctv } from "./lib/its";

export default function CctvSearch() {
    const [cctvType, setCctvType] = useState(1);
    const [minX, setMinX] = useState(126);
    const [maxX, setMaxX] = useState(127);
    const [minY, setMinY] = useState(34);
    const [maxY, setMaxY] = useState(35);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const onSearch = async () => {
        setLoading(true); setErr("");
        try {
            const json = await searchCctv({ cctvType, minX, maxX, minY, maxY });
            setData(json?.response?.data ?? []);
        } catch (e) {
            setErr(e.message ?? "오류");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{padding:16}}>
            <h2>ITS CCTV 검색</h2>
            <div style={{display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:8, maxWidth:800}}>
                <label>cctvType
                    <input value={cctvType} onChange={e=>setCctvType(Number(e.target.value)||0)} />
                </label>
                <label>minX
                    <input value={minX} onChange={e=>setMinX(Number(e.target.value))} />
                </label>
                <label>maxX
                    <input value={maxX} onChange={e=>setMaxX(Number(e.target.value))} />
                </label>
                <label>minY
                    <input value={minY} onChange={e=>setMinY(Number(e.target.value))} />
                </label>
                <label>maxY
                    <input value={maxY} onChange={e=>setMaxY(Number(e.target.value))} />
                </label>
            </div>
            <button style={{marginTop:12}} onClick={onSearch} disabled={loading}>
                {loading ? "검색 중…" : "검색"}
            </button>
            {err && <div style={{color:"tomato",marginTop:8}}>{err}</div>}

            <div style={{marginTop:16}}>
                {data.length === 0 ? <div>결과 없음</div> :
                    <table width="100%" cellPadding={8} style={{borderCollapse:"collapse"}}>
                        <thead>
                        <tr style={{borderBottom:"1px solid #444"}}>
                            <th align="left">이름</th>
                            <th align="left">형식</th>
                            <th align="left">URL</th>
                            <th align="left">X</th>
                            <th align="left">Y</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data.map((d, i)=>(
                            <tr key={i} style={{borderBottom:"1px solid #333"}}>
                                <td>{d.cctvname}</td>
                                <td>{d.cctvformat}</td>
                                <td style={{wordBreak:"break-all"}}>{d.cctvurl}</td>
                                <td>{d.coordx}</td>
                                <td>{d.coordy}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                }
            </div>
        </div>
    );
}
