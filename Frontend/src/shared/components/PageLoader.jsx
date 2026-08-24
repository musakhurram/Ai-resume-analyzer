import "./PageLoader.scss";

const PageLoader = ({ label = "Loading", sublabel, className = "" }) => (
  <div className={`page-loader ${className}`} role="status" aria-live="polite">
    <div className="page-loader__spinner-box">
      <div className="page-loader__ring" aria-hidden="true" />
      <div className="page-loader__core" aria-hidden="true" />
    </div>
    <div className="page-loader__text">
      <p className="page-loader__label">{label}</p>
      {sublabel && <p className="page-loader__sublabel">{sublabel}</p>}
    </div>
  </div>
);

export default PageLoader;

