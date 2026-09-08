/**
 * React Doctor — Hercule.dev
 * @see https://react.doctor/schema/config.json
 * @see doctor.config baseline score: run `pnpm doctor:score` (ratchet REACT_DOCTOR_MIN_SCORE in CI)
 */
const config = {
  $schema: "https://react.doctor/schema/config.json",
  scope: "changed",
  blocking: "error",
  ignore: {
    files: [
      "app/streamlit_*/**",
      "emails/**",
      "**/*.py",
    ],
    overrides: [
      {
        // Marketing landings intentionally use inline #09090B — see hercule-ui skill.
        files: ["components/agence/**", "components/entreprise/**"],
        rules: [
          "react-doctor/no-low-contrast-inline-style",
          "react-doctor/no-decorative-blur-orb",
          "react-doctor/no-dark-mode-glow",
          "react-doctor/no-common-root-font",
        ],
      },
    ],
  },
  surfaces: {
    cli: {
      includeTags: ["design"],
    },
    score: {
      includeTags: ["design"],
    },
  },
  rules: {
    // shadcn / hercule-ui alignment (warn — adopt incrementally)
    "react-doctor/design-no-space-on-flex-children": "warn",
    "react-doctor/design-no-redundant-padding-axes": "warn",
    "react-doctor/design-no-redundant-size-axes": "warn",
    "react-doctor/no-outline-none": "warn",
    "react-doctor/no-undersized-icon-button": "warn",
    "react-doctor/no-smooth-scroll-without-reduced-motion": "warn",
    "react-doctor/dialog-has-accessible-name": "warn",
    "react-doctor/base-ui-dialog-popup-requires-title": "warn",
    "react-doctor/base-ui-field-requires-label": "warn",
  },
};

export default config;
