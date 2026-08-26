import { useCallback, useId, useRef, useState } from "react";
import "./FileDropzone.scss";

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const FileDropzone = ({ file, onChange, error, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);
  const inputId = useId();

  const validateAndSet = useCallback(
    (selected) => {
      if (!selected) return;
      if (selected.type !== "application/pdf") {
        onError?.("Only PDF documents (.pdf) are supported.");
        return;
      }
      if (selected.size > MAX_BYTES) {
        onError?.("File size exceeds 3 MB limit. Please compress or upload a smaller PDF.");
        return;
      }
      onError?.(null);
      onChange(selected);
    },
    [onChange, onError],
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    validateAndSet(dropped);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    onError?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="dropzone-wrap">
      <div
        className={`dropzone ${isDragging ? "is-dragging" : ""} ${error ? "is-error" : ""} ${file ? "has-file" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        role="button"
        tabIndex={file ? -1 : 0}
        aria-describedby={inputId}
        onKeyDown={(e) => {
          if (!file && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="application/pdf"
          className="visually-hidden"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => validateAndSet(e.target.files?.[0])}
        />

        {file ? (
          <div className="dropzone__file-card">
            <div className="dropzone__file-icon-box" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" className="dropzone__pdf-icon">
                <path
                  d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 2v6h6M10 13v4M8 15h4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="dropzone__file-badge">PDF</span>
            </div>

            <div className="dropzone__file-info">
              <p className="dropzone__file-name" title={file.name}>
                {file.name}
              </p>
              <div className="dropzone__file-meta">
                <span className="dropzone__file-size">{formatSize(file.size)}</span>
                <span className="dropzone__file-dot" />
                <span className="dropzone__file-status">Ready to analyze</span>
              </div>
            </div>

            <div className="dropzone__file-actions">
              <button
                type="button"
                className="dropzone__action-btn"
                onClick={() => inputRef.current?.click()}
                title="Change PDF"
              >
                Replace
              </button>
              <button
                type="button"
                className="dropzone__action-btn dropzone__action-btn--remove"
                onClick={handleClear}
                title="Remove PDF"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="dropzone__empty">
            <div className="dropzone__icon-circle" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" className="dropzone__upload-icon">
                <path
                  d="M4 16.242V17a3 3 0 003 3h10a3 3 0 003-3v-.758M12 3v13m0-13l-4 4m4-4l4 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="dropzone__text">
              <p className="dropzone__title">
                <span>Upload your resume</span> or drag & drop
              </p>
              <p className="dropzone__hint">PDF format only (up to 3 MB)</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="dropzone__error" role="alert">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 4.5v4.5M8 11.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export default FileDropzone;

