import React from 'react';

// A retro pixelated button
export const PixelButton: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
}> = ({ onClick, children, variant = 'primary', className = '', disabled = false }) => {
  const baseStyles = "font-pixel-body text-xl px-6 py-2 border-2 transition-all duration-75 active:translate-y-1 relative group uppercase tracking-wider";
  
  let colors = "";
  if (variant === 'primary') {
    colors = "border-white bg-black text-white hover:bg-white hover:text-black";
  } else if (variant === 'secondary') {
    colors = "border-gray-500 text-gray-400 hover:border-white hover:text-white";
  } else if (variant === 'danger') {
    colors = "border-red-500 text-red-500 hover:bg-red-500 hover:text-white";
  }

  if (disabled) {
    colors = "border-gray-800 text-gray-800 cursor-not-allowed hover:bg-black hover:text-gray-800";
  }

  return (
    <button onClick={disabled ? undefined : onClick} className={`${baseStyles} ${colors} ${className}`}>
      {children}
      {!disabled && (
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 pointer-events-none" />
      )}
    </button>
  );
};

// A retro container card
export const PixelCard: React.FC<{
  children: React.ReactNode;
  title?: string;
  className?: string;
}> = ({ children, title, className = '' }) => {
  return (
    <div className={`border-2 border-white bg-black p-1 relative ${className}`}>
      {/* Decorative corners */}
      <div className="absolute -top-1 -left-1 w-2 h-2 bg-white"></div>
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-white"></div>
      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white"></div>
      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white"></div>
      
      {title && (
        <div className="absolute -top-4 left-4 bg-black px-2 border-2 border-white">
          <span className="font-pixel-body text-white uppercase text-lg tracking-widest">{title}</span>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

// Retro Input field
export const PixelInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
  return (
    <input
      {...props}
      className={`bg-black border-b-2 border-white text-white font-pixel-body text-xl p-2 w-full outline-none focus:bg-gray-900 placeholder-gray-600 ${props.className}`}
    />
  );
};
