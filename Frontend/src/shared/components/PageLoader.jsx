import "./PageLoader.scss";

const PageLoader = ({ label = "Loading" }) => (
  <div className="page-loader">
    <span className="page-loader__mark" aria-hidden="true" />
    <p className="eyebrow">{label}</p>
  </div>
);

export default PageLoader;
