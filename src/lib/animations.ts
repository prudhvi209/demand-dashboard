import { Variants } from 'framer-motion';

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.99
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.25,
      ease: 'easeIn'
    }
  }
};

export const containerStaggerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

export const cardRevealVariants: Variants = {
  initial: {
    opacity: 0,
    y: 16,
    filter: 'blur(4px)'
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.45,
      ease: [0.25, 1, 0.5, 1]
    }
  }
};

export const hoverLiftVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.04)'
  },
  hover: {
    y: -4,
    scale: 1.01,
    boxShadow: '0 20px 40px -12px rgba(37, 99, 235, 0.12)',
    transition: {
      duration: 0.25,
      ease: 'easeOut'
    }
  }
};

export const buttonTapVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.97 }
};
