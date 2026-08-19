export function TechnicalBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="technical-grid absolute inset-0 opacity-70" />
      <div className="absolute right-[-9rem] top-[-8rem] size-[25rem] rounded-full border border-[#0878d1]/8" />
      <div className="absolute right-[-5rem] top-[-4rem] size-[17rem] rounded-full border border-[#0878d1]/10" />
      <div className="scanner-line absolute left-0 top-[28%] h-px w-full opacity-50" />
    </div>
  );
}
