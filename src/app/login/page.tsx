"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiError, login } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email, password }: FormValues) => {
    setFormError(null);
    try {
      const { user, accessToken } = await login(email, password);
      setAuth(user, accessToken);
      router.push("/");
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.status !== 500
          ? err.message
          : "Invalid email or password.",
      );
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <section className="w-full max-w-[440px] rounded-2xl bg-white p-10 shadow-[0_12px_32px_rgba(17,24,39,0.08)]">
        <header className="mb-6">
          <h1 className="text-[26px] font-bold tracking-tight text-gray-900">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Sign in to your account to continue
          </p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-[13px] font-medium text-gray-900">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
              className="h-[52px] rounded-[10px] border border-gray-300 bg-gray-50 px-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            {errors.email && (
              <span className="text-xs text-red-500">{errors.email.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-[13px] font-medium text-gray-900">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
              className="h-[52px] rounded-[10px] border border-gray-300 bg-gray-50 px-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            {errors.password && (
              <span className="text-xs text-red-500">{errors.password.message}</span>
            )}
          </div>

          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[52px] rounded-[10px] bg-indigo-600 text-[15px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-gray-500">
          Don&apos;t have an account?{" "}
          <span className="font-medium text-indigo-600">Sign up</span>
        </p>
      </section>
    </main>
  );
}
