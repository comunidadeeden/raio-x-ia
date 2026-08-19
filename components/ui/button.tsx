import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "default" | "icon" | "sm";
};

const variants = {
  primary: "bg-[#0878d1] text-white hover:bg-[#0668b6] disabled:bg-[#8abde0]",
  secondary: "border border-[#d8dfdd] bg-white text-[#17201e] hover:bg-[#f4f6f5]",
  ghost: "text-[#4f5b58] hover:bg-[#edf1f0] hover:text-[#111615]",
  danger: "text-[#a1271d] hover:bg-[#fff0ee]",
};

const sizes = {
  default: "min-h-11 px-4 py-2.5",
  sm: "min-h-9 px-3 py-1.5 text-sm",
  icon: "size-10 p-0",
};

export function Button({
  className = "",
  variant = "primary",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-[0.7rem] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
