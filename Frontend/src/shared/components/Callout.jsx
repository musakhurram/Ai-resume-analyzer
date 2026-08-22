import "./Callout.scss";

const Callout = ({ tone = "info", title, children }) => (
  <div className={`callout callout--${tone}`} role={tone === "error" ? "alert" : "status"}>
    {title && <p className="callout__title">{title}</p>}
    {children && <div className="callout__body">{children}</div>}
  </div>
);

export default Callout;
