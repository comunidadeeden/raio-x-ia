type BrandMarkProps = { compact?: boolean; className?: string };

export function BrandMark({ compact = false, className = "" }: BrandMarkProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`} aria-label="Raio X IA" role="img">
      <span
        className="relative grid size-9 place-items-center border border-[#a9cfe7] bg-white text-[0.72rem] font-semibold tracking-[0.08em] text-[#0878d1]"
        data-brand-placeholder="symbol-x"
        aria-hidden="true"
      >
        <span className="absolute -left-1 -top-1 size-2 border-l border-t border-[#0878d1]" />
        <span className="absolute -bottom-1 -right-1 size-2 border-b border-r border-[#0878d1]" />
        RX
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#0878d1]">
            Mentoria
          </span>
          <span className="mt-1 block text-[1rem] font-semibold tracking-[-0.02em] text-[#111615]">
            Raio X IA
          </span>
        </span>
      )}
    </div>
  );
}
