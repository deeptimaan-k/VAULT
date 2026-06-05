import { useState, useEffect } from "react";

export function useIsMobile(breakpoint = 768) {
  const [val, setVal] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const fn = () => setVal(window.innerWidth < breakpoint);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [breakpoint]);
  return val;
}
