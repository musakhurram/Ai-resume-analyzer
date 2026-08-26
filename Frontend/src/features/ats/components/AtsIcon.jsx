const ICONS = {
  briefcase: <path d="M7 7V5.8C7 5.05 7.6 4.45 8.35 4.45h3.3c.75 0 1.35.6 1.35 1.35V7M4.3 7h11.4v7.25c0 .75-.6 1.35-1.35 1.35H5.65c-.75 0-1.35-.6-1.35-1.35V7Z M4.3 10.1h11.4M9.2 10.1v1.1h1.6v-1.1" />,
  spark: <path d="m10 3 1.2 3.8L15 8l-3.8 1.2L10 13l-1.2-3.8L5 8l3.8-1.2L10 3Zm4.25 8 .55 1.7 1.7.55-1.7.55-.55 1.7-.55-1.7-1.7-.55 1.7-.55.55-1.7Z" />,
  document: <path d="M6.2 3.7h5l2.6 2.6v8.1c0 .66-.54 1.2-1.2 1.2H6.2c-.66 0-1.2-.54-1.2-1.2V4.9c0-.66.54-1.2 1.2-1.2Zm4.8.3v2.65h2.65M7.4 10h5.2M7.4 12.6h3.8" />,
  ruler: <path d="m5.05 14.95 9.9-9.9 1.2 1.2-9.9 9.9-1.2-1.2Zm3.1-6.2 1.05 1.05m.65-2.8 1.05 1.05m.65-2.8 1.05 1.05m-7.05 6.4 1.05 1.05" />,
  contact: <path d="M5.7 4.25h8.6c.75 0 1.35.6 1.35 1.35v8.8c0 .75-.6 1.35-1.35 1.35H5.7c-.75 0-1.35-.6-1.35-1.35V5.6c0-.75.6-1.35 1.35-1.35Zm2.1 4.05a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Zm-1.8 4.2c.36-1.1 1.1-1.65 1.8-1.65.7 0 1.44.55 1.8 1.65M11.2 7.2h2.25m-2.25 2.5h2.25m-2.25 2.5h1.35" />,
  graduation: <path d="m3.5 7.4 6.5-3.1 6.5 3.1L10 10.5 3.5 7.4Zm2.15 1.03v3.15c1.55 1.55 7.15 1.55 8.7 0V8.43M15.15 8.2v3.3" />,
  checkCircle: <path d="M10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm-2.7-6 1.75 1.75 3.65-3.65" />,
  arrowRight: <path d="M4.5 10h10m-3.5-3.5L14.5 10 11 13.5" />,
  file: <path d="M6.2 3.5h5.1l2.5 2.5v8.35c0 .64-.51 1.15-1.15 1.15H6.2c-.64 0-1.15-.51-1.15-1.15V4.65c0-.64.51-1.15 1.15-1.15ZM11 3.8v2.7h2.7M7.55 10h4.9m-4.9 2.55h3.2" />,
};

const AtsIcon = ({ name, className = "", size = 16, title }) => (
  <svg
    className={`ats-icon ${className}`}
    viewBox="0 0 20 20"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.55"
    strokeLinecap="round"
    strokeLinejoin="round"
    role={title ? "img" : undefined}
    aria-hidden={title ? undefined : true}
  >
    {title && <title>{title}</title>}
    {ICONS[name] || ICONS.document}
  </svg>
);

export default AtsIcon;
