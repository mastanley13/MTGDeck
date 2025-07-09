import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  to, 
  href, 
  onClick, 
  disabled = false, 
  className = '', 
  type = 'button',
  loading = false,
  ...props 
}) => {
  // Base styles that apply to all buttons
  const baseStyles = `
    inline-flex items-center justify-center font-semibold
    transition-all duration-300 transform 
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    relative overflow-hidden group
  `;

  // Size variants
  const sizeStyles = {
    xs: 'px-3 py-1.5 text-xs rounded-lg',
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-sm rounded-xl',
    lg: 'px-8 py-4 text-base rounded-xl',
    xl: 'px-10 py-5 text-lg rounded-2xl',
  };

  // Variant styles with modern effects
  const variantStyles = {
    primary: `
      bg-gradient-to-r from-primary-500 to-blue-500 text-white 
      shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 
      border border-primary-400/30 hover:border-primary-300/50
      hover:from-primary-600 hover:to-blue-600 hover:scale-105
      focus:ring-primary-500
    `,
    secondary: `
      bg-gradient-to-r from-slate-700/80 via-slate-600/80 to-slate-700/80 text-slate-100 
      shadow-lg shadow-slate-900/25 hover:shadow-slate-900/40 
      border border-slate-500/30 hover:border-slate-400/50
      hover:from-slate-600/80 hover:via-slate-500/80 hover:to-slate-600/80 hover:scale-105
      focus:ring-slate-500
    `,
    outline: `
      bg-transparent text-primary-500 border-2 border-primary-500
      hover:bg-primary-500 hover:text-white hover:scale-105
      focus:ring-primary-500 shadow-sm hover:shadow-lg
    `,
    ghost: `
      bg-transparent text-slate-300 hover:text-white 
      hover:bg-slate-700/60 border border-transparent 
      hover:border-slate-600/50 hover:scale-105
      focus:ring-slate-500
    `,
    premium: `
      bg-gradient-to-r from-primary-600/90 via-blue-600/90 to-primary-700/90 text-white 
      shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 
      border border-primary-400/30 hover:border-primary-300/50
      hover:scale-105 focus:ring-primary-500
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-600 text-white 
      shadow-lg shadow-red-500/25 hover:shadow-red-500/40 
      border border-red-400/30 hover:border-red-300/50
      hover:from-red-600 hover:to-red-700 hover:scale-105
      focus:ring-red-500
    `,
    success: `
      bg-gradient-to-r from-green-500 to-emerald-500 text-white 
      shadow-lg shadow-green-500/25 hover:shadow-green-500/40 
      border border-green-400/30 hover:border-green-300/50
      hover:from-green-600 hover:to-emerald-600 hover:scale-105
      focus:ring-green-500
    `,
  };

  // Combine all styles
  const buttonStyles = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${className}
  `;

  // Loading spinner component
  const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  // Animated background overlay for hover effects
  const AnimatedOverlay = () => {
    const overlayColor = variant === 'primary' ? 'from-primary-500/20 via-blue-500/20 to-primary-600/20' :
                        variant === 'premium' ? 'from-primary-500/20 via-blue-500/20 to-primary-600/20' :
                        variant === 'secondary' ? 'from-slate-500/20 via-slate-400/20 to-slate-500/20' :
                        variant === 'danger' ? 'from-red-500/20 via-red-400/20 to-red-600/20' :
                        variant === 'success' ? 'from-green-500/20 via-emerald-400/20 to-green-600/20' :
                        'from-slate-500/20 via-slate-400/20 to-slate-500/20';

    return (
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${overlayColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
    );
  };

  // Glow effect for premium variant
  const GlowEffect = () => {
    if (variant !== 'premium') return null;
    
    return (
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-600/20 to-blue-600/20 blur-xl group-hover:blur-2xl transition-all duration-300 opacity-60 group-hover:opacity-80 -z-10"></div>
    );
  };

  // Button content with relative positioning
  const ButtonContent = () => (
    <span className="relative z-10 flex items-center">
      {loading && <LoadingSpinner />}
      {children}
    </span>
  );

  // Props to pass to the underlying element
  const elementProps = {
    className: buttonStyles,
    disabled: disabled || loading,
    type: type,
    onClick: onClick,
    ...props
  };

  // Render as Link if 'to' prop is provided
  if (to) {
    return (
      <Link to={to} {...elementProps}>
        <AnimatedOverlay />
        <GlowEffect />
        <ButtonContent />
      </Link>
    );
  }

  // Render as anchor if 'href' prop is provided
  if (href) {
    return (
      <a href={href} {...elementProps}>
        <AnimatedOverlay />
        <GlowEffect />
        <ButtonContent />
      </a>
    );
  }

  // Render as button by default
  return (
    <button {...elementProps}>
      <AnimatedOverlay />
      <GlowEffect />
      <ButtonContent />
    </button>
  );
};

// Export some preset button components for common use cases
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;
export const OutlineButton = (props) => <Button variant="outline" {...props} />;
export const GhostButton = (props) => <Button variant="ghost" {...props} />;
export const PremiumButton = (props) => <Button variant="premium" {...props} />;
export const DangerButton = (props) => <Button variant="danger" {...props} />;
export const SuccessButton = (props) => <Button variant="success" {...props} />;

export default Button; 