// import React, { ReactNode } from "react";

// interface ButtonProps {
//   children: ReactNode; // Button text or content
//   size?: "sm" | "md"; // Button size
//   variant?: "primary" | "outline"; // Button variant
//   startIcon?: ReactNode; // Icon before the text
//   endIcon?: ReactNode; // Icon after the text
//   onClick?: () => void; // Click handler
//   disabled?: boolean; // Disabled state
//   className?: string; // Disabled state
// }

// const Button: React.FC<ButtonProps> = ({
//   children,
//   size = "md",
//   variant = "primary",
//   startIcon,
//   endIcon,
//   onClick,
//   className = "",
//   disabled = false,
// }) => {
//   // Size Classes
//   const sizeClasses = {
//     sm: "px-4 py-3 text-sm",
//     md: "px-5 py-3.5 text-sm",
//   };

//   // Variant Classes
//   const variantClasses = {
//     primary:
//       "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
//     outline:
//       "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300",
//   };

//   return (
//     <button
//       className={`inline-flex items-center justify-center font-medium gap-2 rounded-lg transition ${className} ${
//         sizeClasses[size]
//       } ${variantClasses[variant]} ${
//         disabled ? "cursor-not-allowed opacity-50" : ""
//       }`}
//       onClick={onClick}
//       disabled={disabled}
//     >
//       {startIcon && <span className="flex items-center">{startIcon}</span>}
//       {children}
//       {endIcon && <span className="flex items-center">{endIcon}</span>}
//     </button>
//   );
// };

// export default Button;

"use client";
import * as React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md" | "lg";
};

const sizeClass: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", size = "md", disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={[
          "inline-flex items-center justify-center rounded-lg bg-gray-900 text-white",
          "hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition",
          sizeClass[size],
          className,
        ].join(" ")}
        {...rest}
      />
    );
  },
);
Button.displayName = "Button";

export default Button;
