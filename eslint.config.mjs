import next from "eslint-config-next";

export default [
  {
    ignores: ["drizzle/**/*"]
  },
  ...next({
    extends: ["next/core-web-vitals"]
  }),
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off"
    }
  }
];

