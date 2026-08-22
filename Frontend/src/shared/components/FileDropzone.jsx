import { useCallback, useId, useRef, useState } from "react";
import "./FileDropzone.scss";

const MAX_BYTES = 3 * 1024 * 1024; // matches backend multer limit

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

const FileDropzone = ({ file, onChange, error, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);
  const inputId = useId();

  const validateAndSet = useCallback(
    (selected) => {
      if (!selected) return;
      if (selected.type !== "application/pdf") {
        onError?.("Only PDF files are accepted.");
        return;
      }
      if (selected.size > MAX_BYTES) {
        onError?.("File is larger than 3 MB — try a lighter export.");
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
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-describedby={inputId}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
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
          onChange={(e) => validateAndSet(e.target.files?.[0])}
        />

        {file ? (
          <div className="dropzone__file">
            <span className="dropzone__file-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path d="M14 2v5h5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="dropzone__file-meta">
              <span className="dropzone__file-name">{file.name}</span>
              <span className="dropzone__file-size">{formatSize(file.size)}</span>
            </div>
            <button
              type="button"
              className="dropzone__clear"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                onError?.(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              aria-label="Remove resume"
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <span className="dropzone__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 15V4m0 0 4 4m-4-4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <p className="dropzone__title">Drop your resume here</p>
            <p className="dropzone__hint">PDF, up to 3 MB — or click to browse</p>
          </>
        )}
      </div>
      {error && <p className="dropzone__error">{error}</p>}
    </div>
  );
};

export default FileDropzone;
