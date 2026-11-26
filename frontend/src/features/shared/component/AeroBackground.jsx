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
        placement="full"
        material="glass"
        markers="plus"
        count={1300}
        depthOfField={0.75}
        vignette={0.3}
        mouseInteraction
        pulseOnClick={pulseOnClick}
        holdToGather={holdToGather}
        onError={handleError}
      />
    </div>
  );
}
