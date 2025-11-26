/**
 * Shared Animation Variants for Framer Motion
 *
 * This file contains reusable animation configurations
 * that respect prefers-reduced-motion automatically.
 */

// Check if user prefers reduced motion
const prefersReducedMotion =
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Spring physics for natural feel
export const springConfig = {
  default: { type: "spring", stiffness: 300, damping: 25 },
  gentle: { type: "spring", stiffness: 200, damping: 20 },
  bouncy: { type: "spring", stiffness: 400, damping: 15 },
  stiff: { type: "spring", stiffness: 500, damping: 30 },
};

// Reduced motion safe defaults
const safeTransition = prefersReducedMotion ? { duration: 0.01 } : springConfig.default;

// Modal animations
export const modalVariants = {
  overlay: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: prefersReducedMotion ? { duration: 0.1 } : { duration: 0.2 },
    },
    exit: {
      opacity: 0,
      transition: prefersReducedMotion ? { duration: 0.1 } : { duration: 0.15 },
    },
  },
  content: {
    hidden: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.95,
      y: prefersReducedMotion ? 0 : 10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: safeTransition,
    },
    exit: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.95,
      transition: { duration: 0.15 },
    },
  },
};

// Card animations
export const cardVariants = {
  initial: {
    opacity: 0,
    scale: prefersReducedMotion ? 1 : 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: safeTransition,
  },
  exit: {
    opacity: 0,
    scale: prefersReducedMotion ? 1 : 0.9,
    transition: { duration: 0.2 },
  },
  hover: prefersReducedMotion
    ? {}
    : {
        y: -4,
        scale: 1.02,
        transition: { duration: 0.2 },
      },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

// Fade animations
export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: prefersReducedMotion ? 0.1 : 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: prefersReducedMotion ? 0.1 : 0.2 },
  },
};

// Slide animations
export const slideVariants = {
  fromTop: {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : -20 },
    visible: { opacity: 1, y: 0, transition: safeTransition },
    exit: { opacity: 0, y: prefersReducedMotion ? 0 : -20 },
  },
  fromBottom: {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: safeTransition },
    exit: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
  },
  fromLeft: {
    hidden: { opacity: 0, x: prefersReducedMotion ? 0 : -20 },
    visible: { opacity: 1, x: 0, transition: safeTransition },
    exit: { opacity: 0, x: prefersReducedMotion ? 0 : -20 },
  },
  fromRight: {
    hidden: { opacity: 0, x: prefersReducedMotion ? 0 : 20 },
    visible: { opacity: 1, x: 0, transition: safeTransition },
    exit: { opacity: 0, x: prefersReducedMotion ? 0 : 20 },
  },
};

// Stagger container for lists
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.05,
      delayChildren: prefersReducedMotion ? 0 : 0.1,
    },
  },
};

// Stagger item
export const staggerItem = {
  hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: safeTransition,
  },
};

// Scale animations for buttons/interactive elements
export const scaleVariants = {
  initial: { scale: 1 },
  hover: prefersReducedMotion ? {} : { scale: 1.05 },
  tap: { scale: 0.95 },
};

// Celebration animations (for wins, validations)
export const celebrationVariants = {
  initial: {
    scale: prefersReducedMotion ? 1 : 0,
    rotate: prefersReducedMotion ? 0 : -180,
  },
  animate: {
    scale: 1,
    rotate: 0,
    transition: prefersReducedMotion ? { duration: 0.1 } : { type: "spring", stiffness: 200, damping: 15 },
  },
};

// Helper to get reduced motion safe animation props
export const getMotionProps = (animate = true) => {
  if (prefersReducedMotion) {
    return {
      initial: false,
      animate: animate ? { opacity: 1 } : false,
      transition: { duration: 0.1 },
    };
  }
  return {};
};

export default {
  springConfig,
  modalVariants,
  cardVariants,
  fadeVariants,
  slideVariants,
  staggerContainer,
  staggerItem,
  scaleVariants,
  celebrationVariants,
  getMotionProps,
  prefersReducedMotion,
};
