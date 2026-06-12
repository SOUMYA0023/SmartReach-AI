import { Variants } from "framer-motion";

// ─── Page Transitions ───
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

// ─── Stagger Container ───
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerSlow: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

// ─── Fade Up Item ───
export const fadeUpItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ─── Fade In ───
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
};

// ─── Scale In ───
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ─── Slide In from Right ───
export const slideInRight: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: { opacity: 0, x: 24, transition: { duration: 0.2 } },
};

// ─── Card Hover ───
export const cardHover = {
  rest: { y: 0 },
  hover: {
    y: 0,
    transition: { duration: 0.15, ease: "easeOut" as const },
  },
};

// ─── AI Step Animation ───
export const aiStepVariants: Variants = {
  pending: { opacity: 0.4, scale: 0.97 },
  active: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4 },
  },
  complete: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 },
  },
};

// ─── Counter animation config ───
export const counterAnimation = {
  duration: 1.5,
  ease: [0.25, 0.46, 0.45, 0.94] as const,
};

// ─── AI Thinking Pulse ───
export const thinkingPulse: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
  },
};

// ─── Timeline line grow ───
export const lineGrow: Variants = {
  initial: { scaleY: 0 },
  animate: {
    scaleY: 1,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};
