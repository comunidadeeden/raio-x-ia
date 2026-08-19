import { BrandMark } from "@/components/brand/brand-mark";
import { TechnicalBackdrop } from "@/components/brand/technical-backdrop";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-10">
      <TechnicalBackdrop />
      <div className="relative z-10 w-full max-w-[27rem]">
        <div className="mb-8 flex justify-center">
          <BrandMark />
        </div>
        {children}
      </div>
    </main>
  );
}
