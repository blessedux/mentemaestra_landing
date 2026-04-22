"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export type ParallaxComponentProps = {
  children?: ReactNode;
};

export function ParallaxComponent({ children }: ParallaxComponentProps) {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const root = parallaxRef.current;
    if (!root) return undefined;

    const triggerElement = root.querySelector("[data-parallax-layers]");
    if (!triggerElement) return undefined;

    const html = document.documentElement;
    const prevScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";

    const refresh = () => {
      ScrollTrigger.refresh();
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerElement,
          start: "top top",
          end: "bottom top",
          scrub: 0,
          invalidateOnRefresh: true,
        },
      });

      const layers = [
        { layer: "1", yPercent: 70 },
        { layer: "2", yPercent: 55 },
        { layer: "4", yPercent: 10 },
      ];

      layers.forEach((layerObj, idx) => {
        const targets = triggerElement.querySelectorAll(
          `[data-parallax-layer="${layerObj.layer}"]`,
        );
        tl.to(
          targets,
          {
            yPercent: layerObj.yPercent,
            ease: "none",
          },
          idx === 0 ? undefined : "<",
        );
      });
    }, root);

    let cancelled = false;
    const runRefresh = () => {
      if (!cancelled) requestAnimationFrame(refresh);
    };

    runRefresh();
    const t1 = window.setTimeout(runRefresh, 100);
    const t2 = window.setTimeout(runRefresh, 400);
    window.addEventListener("load", runRefresh);
    window.addEventListener("resize", refresh);

    return () => {
      cancelled = true;
      window.removeEventListener("load", runRefresh);
      window.removeEventListener("resize", refresh);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      html.style.scrollBehavior = prevScrollBehavior;
      ctx.revert();
    };
  }, []);

  return (
    <div className="parallax" ref={parallaxRef}>
      <section className="parallax__header parallax__header--with-footer">
        <div className="parallax__visuals">
          <div className="parallax__black-line-overflow" aria-hidden="true" />
          <div data-parallax-layers className="parallax__layers">
            <div data-parallax-layer="1" className="parallax__layer-parallax-node">
              <div aria-hidden className="parallax__layer-placeholder-fill" />
            </div>
            <div data-parallax-layer="2" className="parallax__layer-parallax-node">
              <div aria-hidden className="parallax__layer-placeholder-fill" />
            </div>
            <div data-parallax-layer="4" className="parallax__layer-parallax-node">
              <div aria-hidden className="parallax__layer-placeholder-fill" />
            </div>
          </div>
          <div className="parallax__fade" aria-hidden="true" />
        </div>
        {children ? (
          <div className="relative z-[35] flex w-full flex-1 flex-col">{children}</div>
        ) : null}
      </section>
    </div>
  );
}
