"use client";

import { useEffect, useRef } from "react";

/**
 * Inline split of /public/logo.svg into two path elements so each letter
 * can be animated independently. P and S orbit around the logo's geometric
 * centre on brand-link hover, keeping their orientation upright (pure
 * translate, no rotate). We drive the animation with WAAPI instead of CSS
 * keyframes so that mouseleave can reverse the orbit back to the starting
 * position from wherever it currently sits — CSS :hover can only snap back.
 */

const S_PATH =
  "M57.8828 43.5596C60.931 43.5596 63.3508 44.0523 65.1953 44.9746C67.0913 45.9226 68.4591 47.1167 69.3574 48.5352C70.2809 49.9932 70.7226 51.4632 70.7227 52.96C70.7227 54.3603 70.3285 55.7293 69.5078 57.0811L69.502 57.0898C68.756 58.3487 67.6236 59.4033 66.0537 60.2373C64.7936 60.9068 63.2537 61.3165 61.4092 61.4395C61.4552 61.1365 61.4934 60.8467 61.5186 60.5703L61.5195 60.5635C61.5745 59.9044 61.6025 59.315 61.6025 58.7998C61.6025 56.0285 60.9987 53.7963 59.5322 52.3965C58.2653 51.0835 56.7741 50.3604 55.082 50.3604C53.574 50.3605 52.1633 50.9032 50.8643 51.9033L50.6055 52.1094C49.0644 53.328 48.4024 55.2474 48.4023 57.5996C48.4023 59.6463 48.9324 61.4582 50.0312 62.9844L50.0381 62.9951L50.0459 63.0049C51.135 64.4379 52.5027 65.6875 54.1348 66.7568L54.1406 66.7607L54.1475 66.7646C55.7667 67.7902 57.4653 68.7881 59.2432 69.7578L59.2549 69.7637C61.0302 70.7036 62.7263 71.7477 64.3438 72.8955L64.3584 72.9062L64.374 72.916C65.9862 73.974 67.3086 75.2253 68.3525 76.667C69.3229 78.0072 69.8428 79.7351 69.8428 81.9199C69.8428 84.1802 69.2308 86.4085 67.9775 88.6172C66.7134 90.7915 64.9862 92.7516 62.7812 94.4951C60.5809 96.1817 58.0393 97.545 55.1465 98.5781L55.1406 98.5801C52.3214 99.6052 49.3439 100.12 46.2021 100.12C42.7365 100.12 39.9477 99.524 37.7852 98.3936C35.6315 97.2399 34.0769 95.7879 33.0664 94.0557C32.0269 92.2735 31.5225 90.4723 31.5225 88.6396C31.5225 86.8365 31.9597 85.134 32.8408 83.5186L32.8467 83.5078C33.7245 81.8499 34.9653 80.4823 36.5859 79.3994C37.9543 78.514 39.5403 77.9889 41.3672 77.8428C41.3643 77.9496 41.3623 78.0555 41.3623 78.1602V78.7197L41.3662 79.3916C41.4073 82.708 41.7586 85.43 42.4541 87.5166L42.4561 87.5234C43.1792 89.6373 44.1365 91.293 45.3945 92.3623L45.4062 92.3711L45.418 92.3809C46.6217 93.3438 47.9287 93.8798 49.3223 93.8799C51.3232 93.8799 53.0906 93.0862 54.5898 91.5869L54.6035 91.5732C56.1039 90.0128 56.8828 88.1686 56.8828 86.0801C56.8828 83.7196 55.8411 81.6725 53.9023 79.9688C52.1624 78.3932 49.9526 76.6702 47.2822 74.7998C45.8041 73.6912 44.2185 72.4485 42.5244 71.0723C41.1533 69.8756 39.9537 68.5049 38.9268 66.9561L38.4961 66.2783C37.4327 64.4853 36.8828 62.3512 36.8828 59.8398C36.8828 57.3899 37.4111 55.2407 38.4463 53.3662L38.6602 52.9941C39.9161 50.9894 41.547 49.3091 43.5615 47.9492L43.5664 47.9463C45.6654 46.5128 47.9428 45.4371 50.4023 44.7197L50.415 44.7158C52.9399 43.9429 55.4285 43.5596 57.8828 43.5596Z";

const P_PATH =
  "M25.2002 1C29.8413 1.00002 33.4941 1.81039 36.2285 3.35156L36.248 3.36133C39.0858 4.88157 41.1159 6.85522 42.3965 9.26855L42.4082 9.29004C43.7641 11.7006 44.4404 14.2787 44.4404 17.04C44.4404 19.4159 43.9857 21.8016 43.0664 24.2021L43.0615 24.2129C42.1978 26.5499 40.928 28.6861 39.2451 30.624L39.2354 30.6357C37.6126 32.5628 35.6881 34.1071 33.457 35.2734C31.263 36.4203 28.8366 37 26.1602 37C23.4004 37 20.5063 36.298 17.4688 34.8564L16.3818 34.3408L16.0732 35.5039C15.3744 38.1381 14.757 40.8254 14.2197 43.5654C13.6732 46.2987 13.4004 49.1106 13.4004 52C13.4004 53.2577 13.4638 54.5153 13.5918 55.7725C12.862 56.4238 12.0259 56.9366 11.0752 57.3086L11.0615 57.3145C9.99862 57.7493 8.95328 57.96 7.91992 57.96C6.38429 57.9599 4.99849 57.4065 3.72949 56.2354C2.5807 55.1258 1.87988 53.1415 1.87988 50C1.87988 47.9613 2.15991 45.6693 2.73145 43.1182C3.36648 40.5251 4.108 37.8499 4.95605 35.0938L4.95508 35.0928C5.8582 32.2775 6.76244 29.5694 7.66504 26.9678C8.57716 24.3387 9.33016 21.9439 9.92383 19.7852C10.5184 17.623 10.8398 15.8412 10.8398 14.4805C10.8398 13.6584 10.6845 12.8575 10.209 12.2461C9.69636 11.5871 8.95068 11.3203 8.16016 11.3203C6.39461 11.3203 4.88336 12.3533 3.61328 14.0225C2.86956 14.9691 2.08501 16.1389 1.25781 17.5254C1.68855 14.8716 2.66095 12.5106 4.16992 10.4268L4.1748 10.4199C6.30421 7.42864 9.17306 5.11116 12.8105 3.47168L12.8096 3.4707C16.5065 1.82835 20.632 1 25.2002 1ZM22.3203 8.67969C21.8545 8.67969 21.3153 8.70855 20.709 8.76367L20.7002 8.76465C20.1376 8.82091 19.5513 8.90571 18.9414 9.0166L17.8203 9.21973L18.168 10.3047C18.5723 11.5684 18.8226 12.8267 18.9229 14.0801L18.9248 14.1016L18.9277 14.124C19.0828 15.3649 19.1601 16.5767 19.1602 17.7598C19.1602 19.843 19.0042 21.8428 18.6934 23.7598C18.3764 25.7143 18.0064 27.6422 17.584 29.543L17.3652 30.5264L18.3506 30.7383C19.1591 30.9115 19.9494 31 20.7197 31C23.0486 31 25.1265 30.3555 26.9111 29.0469L26.9287 29.0332C28.6545 27.71 29.9836 26.0641 30.9053 24.1055L30.9043 24.1045C31.8658 22.1209 32.3603 20.1102 32.3604 18.0801C32.3604 15.6579 31.5565 13.4891 29.9756 11.6094H29.9766C28.3258 9.57764 25.6795 8.67974 22.3203 8.67969Z";

// P orbits clockwise around the logo centre (36, 51); 9 keyframes at ~45°
// steps approximate a circle while each P keeps its upright orientation.
const P_KEYFRAMES: Keyframe[] = [
  { transform: "translate(0, 0)" },
  { transform: "translate(27px, 0)" },
  { transform: "translate(46px, 18px)" },
  { transform: "translate(47px, 45px)" },
  { transform: "translate(28px, 64px)" },
  { transform: "translate(1px, 65px)" },
  { transform: "translate(-18px, 46px)" },
  { transform: "translate(-19px, 19px)" },
  { transform: "translate(0, 0)" },
];

// S stays diametrically opposite the P through the orbit.
const S_KEYFRAMES: Keyframe[] = [
  { transform: "translate(0, 0)" },
  { transform: "translate(-19px, 4px)" },
  { transform: "translate(-35px, -7px)" },
  { transform: "translate(-39px, -26px)" },
  { transform: "translate(-28px, -42px)" },
  { transform: "translate(-9px, -46px)" },
  { transform: "translate(7px, -35px)" },
  { transform: "translate(11px, -16px)" },
  { transform: "translate(0, 0)" },
];

const ORBIT_OPTIONS: KeyframeAnimationOptions = {
  duration: 1200,
  easing: "cubic-bezier(0.65, 0, 0.35, 1)",
  fill: "both",
};

export function HeaderLogo() {
  const pRef = useRef<SVGPathElement | null>(null);
  const sRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const pEl = pRef.current;
    const sEl = sRef.current;
    if (!pEl || !sEl) return;

    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const brand = pEl.closest<HTMLElement>(".site-header__brand") ?? pEl.closest<HTMLElement>("a");
    if (!brand) return;

    const pAnim = pEl.animate(P_KEYFRAMES, ORBIT_OPTIONS);
    const sAnim = sEl.animate(S_KEYFRAMES, ORBIT_OPTIONS);
    pAnim.pause();
    sAnim.pause();

    const duration = ORBIT_OPTIONS.duration as number;
    const play = (dir: 1 | -1) => {
      for (const a of [pAnim, sAnim]) {
        const t = typeof a.currentTime === "number" ? a.currentTime : 0;
        // If a previous forward run finished at the end, seek to 0 so the
        // next forward hover has somewhere to travel. If already at rest
        // and asked to reverse, there's nothing to reverse — skip.
        if (dir === 1 && t >= duration) a.currentTime = 0;
        if (dir === -1 && t <= 0) continue;
        a.playbackRate = dir;
        a.play();
      }
    };

    const onEnter = () => play(1);
    const onLeave = () => play(-1);

    brand.addEventListener("mouseenter", onEnter);
    brand.addEventListener("mouseleave", onLeave);
    brand.addEventListener("focusin", onEnter);
    brand.addEventListener("focusout", onLeave);

    return () => {
      brand.removeEventListener("mouseenter", onEnter);
      brand.removeEventListener("mouseleave", onLeave);
      brand.removeEventListener("focusin", onEnter);
      brand.removeEventListener("focusout", onLeave);
      pAnim.cancel();
      sAnim.cancel();
    };
  }, []);

  return (
    <svg
      className="site-header__logo"
      viewBox="0 0 72 102"
      width={13}
      height={18}
      aria-hidden="true"
    >
      <path
        ref={sRef}
        className="site-header__logo-letter site-header__logo-letter--s"
        d={S_PATH}
        fill="currentColor"
      />
      <path
        ref={pRef}
        className="site-header__logo-letter site-header__logo-letter--p"
        d={P_PATH}
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}
