// Server-side logger utility that respects NODE_ENV
const isDev = process.env.NODE_ENV !== "production";

export const logger = {
  log: (...args) => {
    if (isDev) console.log(...args);
  },
  warn: (...args) => {
    if (isDev) console.warn(...args);
  },
  error: (...args) => {
    // Always log errors, even in production
    console.error(...args);
  },
  debug: (...args) => {
    if (isDev) console.debug(...args);
  },
};

export default logger;
