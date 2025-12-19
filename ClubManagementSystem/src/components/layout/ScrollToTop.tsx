import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls page (and any tagged scroll containers) to top on route changes.
 * Use by placing <ScrollToTop /> inside a layout rendered within Router.
 * For inner scroll areas, add data-scroll-root to the container element.
 */
export function ScrollToTop({ behavior = "auto" as ScrollBehavior }) {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // Skip if navigating to a hash anchor — let browser handle it.
    if (hash) return;

    // Window scroll
    window.scrollTo({ top: 0, left: 0, behavior });

    // Any custom scroll roots
    const nodes = document.querySelectorAll<HTMLElement>("[data-scroll-root]");
    nodes.forEach((el) => {
      el.scrollTop = 0;
      el.scrollLeft = 0;
    });
  }, [pathname, search, hash, behavior]);

  return null;
}
