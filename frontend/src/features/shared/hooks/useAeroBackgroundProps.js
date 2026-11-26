import { useLocation } from "react-router-dom";

/**
 * Returns route-appropriate interaction props for the shared AeroBackground.
 * Disables click-pulse and hold-to-gather on auth/form routes so form clicks
 * do not trigger canvas effects, while keeping them active on the landing page.
 */
export function useAeroBackgroundProps() {
  const { pathname } = useLocation();
  const isLanding = pathname === "/";
  const isChat = pathname === "/chat" || pathname.startsWith("/chat/");

  if (isChat) {
    return {
      placement: "right",
      count: 700,
      dpr: 1.5,
      speed: 0.6,
      vignette: 0.35,
      mouseStrength: 0.3,
      pulseOnClick: false,
      holdToGather: false,
    };
  }

  return {
    pulseOnClick: isLanding,
    holdToGather: isLanding,
  };
}

