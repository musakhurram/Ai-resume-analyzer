// Minimal abstract mark inspired by a document page with a folded
// corner and two condensed text lines — no brains, no sparkles.
export const LogoMark = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M6.5 2.75h7.25L18.75 8.5v11.25a1.5 1.5 0 0 1-1.5 1.5h-10.75a1.5 1.5 0 0 1-1.5-1.5V4.25a1.5 1.5 0 0 1 1.5-1.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M13.75 2.75V8.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M8.25 13h7.5M8.25 16.25h4.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default LogoMark;
