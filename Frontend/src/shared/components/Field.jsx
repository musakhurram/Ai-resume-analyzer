import "./Field.scss";

export const Field = ({ label, htmlFor, hint, error, children }) => (
  <div className={`field ${error ? "field--error" : ""}`}>
    {label && (
      <label className="field__label" htmlFor={htmlFor}>
        {label}
      </label>
    )}
    {children}
    {error ? (
      <p className="field__message field__message--error">{error}</p>
    ) : hint ? (
      <p className="field__message">{hint}</p>
    ) : null}
  </div>
);

export const TextInput = (props) => <input className="field__control" {...props} />;

export const TextArea = ({ rows = 6, ...props }) => (
  <textarea className="field__control field__control--textarea" rows={rows} {...props} />
);
