import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-12 w-full rounded-[0.7rem] border border-[#d6dddb] bg-white px-3.5 text-[0.95rem] text-[#111615] shadow-[0_1px_1px_rgba(0,0,0,0.02)] transition placeholder:text-[#8b9491] hover:border-[#b9c4c1] focus:border-[#0878d1] focus:outline-none focus:ring-3 focus:ring-[#0878d1]/10 ${className}`}
      {...props}
    />
  );
}
