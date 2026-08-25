
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  User,
} from "lucide-react";
import axios from "axios";

import { api } from "../../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await api.post(
        "/api/v1/auth/register",
        {
          full_name: fullName.trim(),
          email: email.trim(),
          password,
        },
      );

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Registration error:", error);

      if (axios.isAxiosError(error)) {
        if (!error.response) {
          setError(
            "Cannot connect to server. Please make sure backend API is running on http://127.0.0.1:8000.",
          );
        } else {
          const detail = error.response.data?.detail;
          if (typeof detail === "string") {
            setError(detail);
          } else if (Array.isArray(detail)) {
            const msgs = detail
              .map((item: { msg?: string }) => item.msg || "Invalid field")
              .join(". ");
            setError(msgs || "Validation error");
          } else if (detail && typeof detail === "object") {
            setError(JSON.stringify(detail));
          } else {
            setError(
              `Registration failed (Server status: ${error.response.status})`,
            );
          }
        }
      } else {
        setError("Unable to create your account.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050507] text-white">

      {/* Ambient premium lighting */}

      <div className="pointer-events-none absolute inset-0">

        <div className="absolute left-[5%] top-[10%] h-80 w-80 rounded-full bg-indigo-600/20 blur-[130px]" />

        <div className="absolute right-[5%] top-[15%] h-96 w-96 rounded-full bg-violet-600/15 blur-[140px]" />

        <div className="absolute bottom-[-10%] left-[30%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[170px]" />

      </div>

      {/* Premium grid */}

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">

        <div className="w-full max-w-md">

          {/* Brand */}

          <div className="mb-8 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-2xl shadow-indigo-500/20 backdrop-blur-xl">

              <Sparkles
                size={24}
                className="text-indigo-300"
              />

            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight">
              Intelligent Workspace
            </h1>

            <p className="mt-2 text-sm text-white/40">
              Build. Collaborate. Think smarter.
            </p>

          </div>

          {/* Registration card */}

          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] p-8 shadow-2xl shadow-black/50 backdrop-blur-2xl">

            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent" />

            <div className="mb-7">

              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300/80">
                Get started
              </p>

              <h2 className="text-2xl font-semibold">
                Create your account
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Enter your details to join Intelligent
                Workspace.
              </p>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Full name */}

              <div>

                <label className="mb-2 block text-sm font-medium text-white/70">
                  Full name
                </label>

                <div className="relative">

                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                  />

                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    placeholder="Your name"
                    className="h-[52px] w-full rounded-2xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-white/20 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
                  />

                </div>

              </div>

              {/* Email */}

              <div>

                <label className="mb-2 block text-sm font-medium text-white/70">
                  Email
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                  />

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    className="h-[52px] w-full rounded-2xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-white/20 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
                  />

                </div>

              </div>

              {/* Password */}

              <div>

                <label className="mb-2 block text-sm font-medium text-white/70">
                  Password
                </label>

                <div className="relative">

                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                  />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Minimum 8 characters"
                    className="h-[52px] w-full rounded-2xl border border-white/10 bg-black/20 pl-11 pr-12 text-sm outline-none transition-all placeholder:text-white/20 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current,
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>

              </div>

              {/* Error */}

              {error && (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* Submit */}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 font-semibold shadow-xl shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.01] hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Creating account..."
                  : "Create Account"}

                {!loading && (
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                )}
              </button>

            </form>

            <div className="mt-6 text-center text-sm text-white/40">

              Already have an account?{" "}

              <Link
                to="/login"
                className="font-medium text-indigo-300 transition hover:text-indigo-200"
              >
                Sign in
              </Link>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}
