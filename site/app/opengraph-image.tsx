import { ImageResponse } from "next/og";

export const alt = "Project Spine — turn reviewed failures into verified guardrails";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "54px 64px 58px",
          color: "#0a0f1a",
          background: "#1e9bff",
          fontFamily: "Arial, Helvetica, sans-serif",
          border: "12px solid #0a0f1a",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 27, fontWeight: 800, letterSpacing: "-0.04em" }}>
            PROJECT SPINE
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 16px",
              border: "3px solid #0a0f1a",
              borderRadius: 999,
              background: "#ff79de",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            OPEN SOURCE · LOCAL FIRST
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 1030 }}>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              lineHeight: 0.98,
              fontWeight: 900,
              letterSpacing: "-0.06em",
            }}
          >
            Turn reviewed failures into verified guardrails.
          </div>
          <div style={{ display: "flex", marginTop: 30, gap: 16, alignItems: "center" }}>
            {["LEARN", "REPLAY", "GUARD"].map((label, index) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {index > 0 ? <div style={{ display: "flex", fontSize: 27, fontWeight: 900 }}>→</div> : null}
                <div
                  style={{
                    display: "flex",
                    padding: "11px 18px",
                    color: index === 1 ? "#0a0f1a" : "#f6fafd",
                    background: index === 1 ? "#ff79de" : "#0a0f1a",
                    border: "3px solid #0a0f1a",
                    fontSize: 23,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
