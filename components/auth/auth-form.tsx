"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import type { AuthActionState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Field = { name: string; label: string; type: string; autoComplete: string };

export function AuthForm({
  action,
  fields,
  submitLabel,
  secondaryHref,
  secondaryLabel,
}: {
  action: (state: AuthActionState, data: FormData) => Promise<AuthActionState>;
  fields: Field[];
  submitLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-5">
      {fields.map((field) => (
        <div key={field.name}>
          <label htmlFor={field.name} className="mb-2 block text-sm font-medium text-[#323b39]">
            {field.label}
          </label>
          <Input
            id={field.name}
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            required
            minLength={field.type === "password" ? 8 : undefined}
          />
        </div>
      ))}

      {state.error && (
        <p role="alert" className="rounded-lg border border-[#f3c7c2] bg-[#fff5f4] px-3 py-2.5 text-sm text-[#9e2a20]">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-lg border border-[#b9ddf2] bg-[#f1f9fe] px-3 py-2.5 text-sm text-[#155e8d]">
          {state.success}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        {pending ? "Processando…" : submitLabel}
      </Button>

      {secondaryHref && secondaryLabel && (
        <Link href={secondaryHref} className="block text-center text-sm font-medium text-[#17699d] hover:underline">
          {secondaryLabel}
        </Link>
      )}
    </form>
  );
}
