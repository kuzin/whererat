import { router, useNavigationContainerRef } from "expo-router";
import { useEffect, useRef } from "react";

/**
 * Lightweight stack anchor so `/info/menu` sits above this route — the native-stack back glyph
 * then matches drilled-in screens (About / Guidelines / Privacy) instead of a JS-only control.
 *
 * `router.*` requires `navigationRef.isReady()`; `useLayoutEffect` runs too early and throws:
 * “Attempted to navigate before mounting the Root Layout…”
 */
export default function InfoStackEntry() {
  const navigationRef = useNavigationContainerRef();
  const pushedRef = useRef(false);

  useEffect(() => {
    const pushMenu = () => {
      if (pushedRef.current || !navigationRef.isReady()) return;
      pushedRef.current = true;
      router.push("/info/menu");
    };

    pushMenu();
    /** First paint can be before `onReady`; the next state tick is reliably ready. */
    const unsub = navigationRef.addListener("state", pushMenu);
    return () => unsub();
  }, [navigationRef]);

  return null;
}
