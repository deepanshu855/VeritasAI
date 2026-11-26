import { useLocation } from "react-router-dom";

/**
 * Returns route-appropriate interaction props for the shared AeroBackground.
 * Disables click-pulse and hold-to-gather on auth/form routes so form clicks
 * do not trigger canvas effects, while keeping them active on the landing page.
 */
export function useAeroBackgroundProps() {
  const { pathname } = useLocation();
  const isLanding = pathname === "/";

  return {
    pulseOnClick: isLanding,
    holdToGather: isLanding,
  };
}

