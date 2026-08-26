import { useEffect, useId, useRef, useState } from "react";
import "./SortDropdown.scss";

/**
 * A small, accessible listbox-style dropdown used for sort/filter controls.
 * Renders as a pill trigger + floating menu, matching the app's design
 * tokens — a plain native <select> can't be styled consistently across
 * browsers, so this owns its own open/close and keyboard behavior.
 *
 * options: [{ value, label, icon? }]
 */
const SortDropdown = ({
  label = "Sort",
  value,
  options,
  onChange,
  align = "right",
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const menuId = useId();

  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const openMenu = () => {
    setActiveIndex(options.findIndex((o) => o.value === value));
    setOpen(true);
  };

  const handleTriggerKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openMenu();
    }
  };

  const handleMenuKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (activeIndex >= 0) {
        onChange(options[activeIndex].value);
        setOpen(false);
      }
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className={`sort-dropdown ${className}`} ref={containerRef}>
      <button
        type="button"
        className={`sort-dropdown__trigger ${open ? "is-open" : ""}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className="sort-dropdown__icon"
          aria-hidden="true"
        >
          <path
            d="M4 5h8M5.5 8h5M7 11h2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span className="sort-dropdown__label-prefix">{label}</span>
        <span className="sort-dropdown__value">{selected?.label}</span>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className="sort-dropdown__chevron"
          aria-hidden="true"
        >
          <path
            d="M4.5 6.5 8 10l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul
          id={menuId}
          className={`sort-dropdown__menu sort-dropdown__menu--${align}`}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          ref={(el) => el?.focus()}
        >
          {options.map((option, i) => (
            <li key={option.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={`sort-dropdown__option ${
                  option.value === value ? "is-selected" : ""
                } ${i === activeIndex ? "is-active" : ""}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.icon && (
                  <span className="sort-dropdown__option-icon" aria-hidden="true">
                    {option.icon}
                  </span>
                )}
                <span className="sort-dropdown__option-label">{option.label}</span>
                {option.value === value && (
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    className="sort-dropdown__check"
                    aria-hidden="true"
                  >
                    <path
                      d="M3.5 8.5l3 3 6-6.5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SortDropdown;
