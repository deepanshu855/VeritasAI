import { useCallback, useState } from "react";
import AeroShards from "./AeroShards";

const BACKGROUND_STYLE = {
  position: "fixed",
  inset: 0,
  zIndex: 0,
  pointerEvents: "none",
  overflow: "hidden",
  backgroundColor: "#07050f",
};

const FALLBACK_STYLE = {
  ...BACKGROUND_STYLE,
  backgroundImage:
    "radial-gradient(ellipse at 50% 40%, rgba(168, 85, 247, 0.28) 0%, rgba(137, 106, 189, 0.12) 45%, #07050f 80%)",
};

export default function AeroBackground({
  placement = "full",
  count = 1300,
  dpr = 2,
  speed = 1,
  vignette = 0.3,
  mouseStrength = 0.6,
  pulseOnClick = true,
  holdToGather = true,
}) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback((error) => {
    console.warn("[AeroBackground] Falling back to static gradient:", error);
    setHasError(true);
  }, []);

  if (hasError) {
    return <div style={FALLBACK_STYLE} aria-hidden="true" />;
  }

  return (
    <div style={BACKGROUND_STYLE} aria-hidden="true">
      <AeroShards
        shardColor="#896ABD"
        accentColor="#A855F7"
        placement={placement}
        material="glass"
        markers="plus"
        count={count}
        dpr={dpr}
        speed={speed}
        depthOfField={0.75}
        vignette={vignette}
        mouseInteraction
        mouseStrength={mouseStrength}
        pulseOnClick={pulseOnClick}
        holdToGather={holdToGather}
        onError={handleError}
      />
    </div>
  );
}
