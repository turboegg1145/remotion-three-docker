import React, { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { ThreeScene } from "./ThreeScene";

const INTER = "Inter, system-ui, sans-serif";
const MONO = '"JetBrains Mono", ui-monospace, monospace';

const VIOLET = "#8b5cf6";
const CYAN = "#22d3ee";
const GREEN = "#34d399";

const CHIPS: { label: string; color: string }[] = [
  { label: "REMOTION 4", color: VIOLET },
  { label: "THREE r187", color: CYAN },
  { label: "DOCKER", color: GREEN },
];

const fontCss = `
@font-face {
  font-family: 'Inter';
  src: url('${staticFile("fonts/inter-var-latin.woff2")}') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: 'JetBrains Mono';
  src: url('${staticFile("fonts/jetbrains-mono-var-latin.woff2")}') format('woff2');
  font-weight: 100 800;
  font-style: normal;
  font-display: block;
}
`;

const pad = (value: number) => String(value).padStart(2, "0");

const formatTimecode = (frame: number, fps: number) => {
  const seconds = Math.floor(frame / fps);
  return `00:${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}:${pad(frame % fps)}`;
};

const Backdrop: React.FC<{ frame: number }> = ({ frame }) => {
  const breathe = 0.86 + 0.14 * Math.sin(frame / 24);
  return (
    <AbsoluteFill style={{ backgroundColor: "#05050a" }}>
      <AbsoluteFill
        style={{
          opacity: breathe,
          background: [
            "radial-gradient(900px 640px at 72% 44%, rgba(109, 64, 255, 0.34), transparent 62%)",
            "radial-gradient(620px 480px at 88% 82%, rgba(34, 211, 238, 0.12), transparent 68%)",
            "radial-gradient(520px 380px at 8% 100%, rgba(244, 114, 182, 0.07), transparent 70%)",
            "linear-gradient(118deg, #05050a 0%, #080713 52%, #05050a 100%)",
          ].join(","),
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.55,
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          ].join(","),
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 62% 58% at 58% 46%, black 12%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 62% 58% at 58% 46%, black 12%, transparent 78%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 52% 48%, transparent 42%, rgba(0,0,0,0.62) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

const Corner: React.FC<{
  style: CSSProperties;
}> = ({ style }) => (
  <div
    style={{
      position: "absolute",
      width: 22,
      height: 22,
      borderColor: "rgba(255,255,255,0.2)",
      borderStyle: "solid",
      borderWidth: 0,
      ...style,
    }}
  />
);

export const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  const [fontHandle] = useState(() =>
    delayRender("Loading Inter and JetBrains Mono"),
  );
  useEffect(() => {
    let finished = false;
    const finish = () => {
      if (!finished) {
        finished = true;
        continueRender(fontHandle);
      }
    };
    Promise.allSettled([
      document.fonts.load(`800 84px ${INTER}`),
      document.fonts.load(`500 16px ${INTER}`),
      document.fonts.load(`400 12px ${MONO}`),
      document.fonts.load(`500 12px ${MONO}`),
    ])
      .then(() => document.fonts.ready)
      .then(finish, finish);
    return finish;
  }, [fontHandle]);

  const t = frame / fps;
  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    extrapolateRight: "clamp",
  });

  const headerOpacity = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hudOpacity = interpolate(frame, [46, 68], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const eyebrow = interpolate(frame, [4, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line1 = spring({
    frame: frame - 7,
    fps,
    config: { damping: 26, stiffness: 95 },
  });
  const line2 = spring({
    frame: frame - 15,
    fps,
    config: { damping: 26, stiffness: 95 },
  });
  const copy = spring({
    frame: frame - 28,
    fps,
    config: { damping: 30, stiffness: 100 },
  });
  const stamp = spring({
    frame: frame - 100,
    fps,
    config: { damping: 13, stiffness: 150, mass: 0.7 },
  });

  const chipProgress = [36, 43, 50].map((delay) =>
    spring({
      frame: frame - delay,
      fps,
      config: { damping: 24, stiffness: 120 },
    }),
  );

  const rise = (p: number, distance = 46): CSSProperties => ({
    opacity: p,
    transform: `translate3d(0, ${(1 - p) * distance}px, 0)`,
    filter: `blur(${(1 - p) * 6}px)`,
  });

  const pulse = 0.45 + 0.55 * Math.abs(Math.sin(frame / 7));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#05050a",
        fontFamily: INTER,
        color: "#f5f5fa",
        overflow: "hidden",
      }}
    >
      <style>{fontCss}</style>
      <Backdrop frame={frame} />

      <ThreeCanvas
        width={width}
        height={height}
        dpr={1}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <ThreeScene frame={frame} fps={fps} />
      </ThreeCanvas>

      {/* Frame marks */}
      <Corner style={{ top: 24, left: 24, borderTopWidth: 1, borderLeftWidth: 1, opacity: headerOpacity }} />
      <Corner style={{ top: 24, right: 24, borderTopWidth: 1, borderRightWidth: 1, opacity: headerOpacity }} />
      <Corner style={{ bottom: 24, left: 24, borderBottomWidth: 1, borderLeftWidth: 1, opacity: headerOpacity }} />
      <Corner style={{ bottom: 24, right: 24, borderBottomWidth: 1, borderRightWidth: 1, opacity: headerOpacity }} />

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 46,
          left: 64,
          right: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: headerOpacity,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 27,
              height: 27,
              borderRadius: 7,
              background: `linear-gradient(135deg, ${VIOLET}, ${CYAN})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 26px rgba(139,92,246,0.45)",
            }}
          >
            <span
              style={{
                fontFamily: INTER,
                fontWeight: 800,
                fontSize: 15,
                color: "#07070d",
                lineHeight: 1,
              }}
            >
              R
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: 2.2,
                color: "rgba(244,244,248,0.85)",
              }}
            >
              REMOTION × THREE.JS
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 8,
                letterSpacing: 2.7,
                color: "rgba(244,244,248,0.34)",
              }}
            >
              HEADLESS 3D MOTION LAB
            </span>
          </div>
        </div>
        <div
          style={{
            textAlign: "right",
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: 1.8,
            lineHeight: 1.95,
            color: "rgba(244,244,248,0.4)",
          }}
        >
          <div>SCENE 01 / 180F</div>
          <div>1280 × 720 · 30 FPS</div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 98,
          left: 64,
          right: 64,
          height: 1,
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.16), rgba(255,255,255,0.02))",
          opacity: headerOpacity,
        }}
      />

      {/* Eyebrow */}
      <div
        style={{
          position: "absolute",
          top: 168,
          left: 66,
          display: "flex",
          alignItems: "center",
          gap: 10,
          opacity: eyebrow,
          transform: `translate3d(0, ${(1 - eyebrow) * 14}px, 0)`,
        }}
      >
        <span style={{ width: 28, height: 1, backgroundColor: VIOLET }} />
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: 3.2,
            color: "rgba(196,181,253,0.9)",
          }}
        >
          A DOCKERIZED 3D PIPELINE
        </span>
      </div>

      {/* Headline */}
      <div style={{ position: "absolute", left: 62, top: 194 }}>
        <div style={{ ...rise(line1, 56), marginLeft: 2 }}>
          <span
            style={{
              fontSize: 86,
              fontWeight: 800,
              letterSpacing: "-3.6px",
              lineHeight: 1,
              color: "#f6f6fb",
            }}
          >
            REMOTION
          </span>
        </div>
        <div style={{ ...rise(line2, 56), marginTop: 2 }}>
          <span
            style={{
              fontSize: 86,
              fontWeight: 800,
              letterSpacing: "-3.6px",
              lineHeight: 1,
              backgroundImage:
                "linear-gradient(96deg, #ede9fe 0%, #a78bfa 32%, #22d3ee 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            × THREE.JS
          </span>
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: "absolute",
          left: 66,
          top: 404,
          width: 432,
          ...rise(copy, 26),
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 16,
            lineHeight: 1.75,
            fontWeight: 400,
            color: "rgba(203,203,218,0.8)",
          }}
        >
          Deterministic 3D motion graphics — composed in React, drawn with
          Three.js, and rendered frame by frame inside a headless Docker
          container.
        </p>
      </div>

      {/* Tech chips */}
      <div
        style={{
          position: "absolute",
          left: 66,
          top: 498,
          display: "flex",
          gap: 8,
        }}
      >
        {CHIPS.map((chip, i) => {
          const p = chipProgress[i];
          return (
            <div
              key={chip.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "7px 11px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.13)",
                backgroundColor: "rgba(255,255,255,0.035)",
                opacity: p,
                transform: `translate3d(0, ${(1 - p) * 18}px, 0)`,
              }}
            >
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  backgroundColor: chip.color,
                  boxShadow: `0 0 8px ${chip.color}`,
                }}
              />
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 9,
                  letterSpacing: 1.4,
                  color: "rgba(244,244,248,0.66)",
                }}
              >
                {chip.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Docker stamp */}
      <div
        style={{
          position: "absolute",
          left: 66,
          top: 552,
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "9px 15px",
          borderRadius: 999,
          border: "1px solid rgba(52,211,153,0.32)",
          backgroundColor: "rgba(16,185,129,0.07)",
          opacity: Math.min(1, stamp),
          transform: `scale(${0.86 + stamp * 0.14})`,
          transformOrigin: "left center",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: GREEN,
            boxShadow: `0 0 12px ${GREEN}`,
            opacity: pulse,
          }}
        />
        <span
          style={{
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: 2.4,
            color: "#6ee7b7",
          }}
        >
          RENDERED IN DOCKER
        </span>
      </div>

      {/* Right-hand technical HUD */}
      <div
        style={{
          position: "absolute",
          right: 66,
          bottom: 102,
          textAlign: "right",
          fontFamily: MONO,
          fontSize: 9.5,
          letterSpacing: 1.5,
          lineHeight: 2.05,
          color: "rgba(244,244,248,0.34)",
          opacity: hudOpacity,
        }}
      >
        <div style={{ color: "rgba(196,181,253,0.62)" }}>
          OBJ_01 — TORUSKNOT
        </div>
        <div>~22K TRIS · PBR METAL</div>
        <div>DOCKER · NODE 22 · CHROME HEADLESS</div>
      </div>

      {/* Vertical rail */}
      <div
        style={{
          position: "absolute",
          right: 20,
          top: "50%",
          transform: "translateY(-50%)",
          writingMode: "vertical-rl",
          fontFamily: MONO,
          fontSize: 8,
          letterSpacing: 4,
          color: "rgba(255,255,255,0.2)",
          opacity: headerOpacity,
        }}
      >
        FRAME BY FRAME — MMXXVI
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          bottom: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: 1.6,
          color: "rgba(244,244,248,0.4)",
          opacity: headerOpacity,
        }}
      >
        <span>TC {formatTimecode(frame, fps)}</span>
        <span style={{ color: "rgba(167,139,250,0.55)" }}>
          WEBGL 2 · ANGLE · SWIFTSHADER
        </span>
        <span>
          FRAME {String(frame).padStart(3, "0")} / {durationInFrames}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 2,
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: `${progress * 100}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${VIOLET}, ${CYAN})`,
            boxShadow: "0 0 12px rgba(34,211,238,0.55)",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -3,
              top: -2,
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "#a5f3fc",
              boxShadow: "0 0 10px #22d3ee",
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
