import type { Transition, Variants } from "framer-motion";

/** Shared easing + spring curves so motion feels like one system. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export const springSoft: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 34,
  mass: 0.7,
};

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 38,
  mass: 0.6,
};

/** Page-level route transition. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: EASE_OUT },
  },
  exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: EASE_IN_OUT } },
};

/** Parent for staggered lists. */
export const listVariants: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.035, delayChildren: 0.02 },
  },
};

export const listItemVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.34, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.16, ease: EASE_IN_OUT },
  },
};

/** Cards that fade+rise into place. */
export const riseVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

/** Press feedback shared by tappable surfaces. */
export const tap = { scale: 0.97 };
