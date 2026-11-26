import { useEffect, useRef } from "react";

const MAX_HEIGHT_PX = 144; // ~6 lines at 15px / 1.5 line-height

export function useAutoGrow(value) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value]);

  return textareaRef;
}

