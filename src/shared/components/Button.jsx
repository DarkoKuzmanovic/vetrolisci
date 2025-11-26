import React from "react";
import "./Button.css";

const Button = ({
  children,
  onClick,
  variant = "primary", // 'primary', 'secondary', 'success', 'danger', 'outline'
  size = "medium", // 'small', 'medium', 'large'
  disabled = false,
  loading = false,
  icon = null, // Optional icon (emoji or element) displayed before text
  tooltip = null, // Optional tooltip text shown on hover
  className = "",
  type = "button",
  ...props
}) => {
  const handleClick = (e) => {
    if (disabled || loading) return;
    onClick?.(e);
  };

  const buttonClass = [
    "button",
    `button--${variant}`,
    `button--${size}`,
    disabled && "button--disabled",
    loading && "button--loading",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={handleClick}
      disabled={disabled || loading}
      title={tooltip}
      {...props}
    >
      {loading && <span className="button-spinner"></span>}
      <span className={loading ? "button-text--hidden" : "button-text"}>
        {icon && <span className="button-icon">{icon}</span>}
        {children}
      </span>
    </button>
  );
};

export default Button;
