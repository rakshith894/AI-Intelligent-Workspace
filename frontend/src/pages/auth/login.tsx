import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  Sparkles,
  X,
} from "lucide-react";

import {
  forgotPassword,
  login,
  resetPassword,
  saveAccessToken,
} from "../../services/auth";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* FORGOT PASSWORD MODAL STATE */
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetTokenInput, setResetTokenInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [resetStep, setResetStep] = useState<"request" | "reset">("request");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await login({
        email,
        password,
      });

      saveAccessToken(result.access_token);

      navigate("/");
    } catch (error: unknown) {
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
              .map((item: { msg?: string }) => item?.msg || "Invalid field")
              .join(". ");
            setError(msgs || "Validation error");
          } else {
            setError(
              `Sign in failed (Server status: ${error.response.status})`,
            );
          }
        }
      } else {
        setError("Unable to sign in. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  }

  /* FORGOT PASSWORD HANDLER */
  async function handleRequestReset(e: FormEvent) {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    try {
      setForgotLoading(true);
      setForgotError("");
      setForgotMessage("");
      const res = await forgotPassword(forgotEmail.trim());
      setForgotMessage(res.message);
      if (res.reset_token) {
        setResetTokenInput(res.reset_token);
      }
      setResetStep("reset");
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setForgotError(String(err.response.data.detail));
      } else {
        setForgotError("Failed to process reset request. Please check email address.");
      }
    } finally {
      setForgotLoading(false);
    }
  }

  /* RESET PASSWORD HANDLER */
  async function handleExecuteReset(e: FormEvent) {
    e.preventDefault();
    if (!forgotEmail.trim() || !resetTokenInput.trim() || !newPasswordInput) return;
    try {
      setForgotLoading(true);
      setForgotError("");
      setForgotMessage("");
      const res = await resetPassword(
        forgotEmail.trim(),
        resetTokenInput.trim(),
        newPasswordInput,
      );
      setForgotMessage(res.message);
      // Auto login user with new credentials
      try {
        const loginRes = await login({
          email: forgotEmail.trim(),
          password: newPasswordInput,
        });
        saveAccessToken(loginRes.access_token);
        setTimeout(() => navigate("/"), 1000);
      } catch {
        setForgotMessage("Password reset successfully! You can now log in.");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setForgotError(String(err.response.data.detail));
      } else {
        setForgotError("Failed to reset password. Please check your code and new password.");
      }
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050507] text-white">

      {/* Ambient background */}

      <div className="pointer-events-none absolute inset-0">

        <div className="absolute left-[10%] top-[10%] h-72 w-72 rounded-full bg-indigo-600/20 blur-[120px]" />

        <div className="absolute right-[10%] top-[25%] h-80 w-80 rounded-full bg-purple-600/15 blur-[130px]" />

        <div className="absolute bottom-[-10%] left-[40%] h-96 w-96 rounded-full bg-cyan-500/10 blur-[150px]" />

      </div>

      {/* Grid */}

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
              Your intelligent command center.
            </p>

          </div>

          {/* Card */}

          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] p-8 shadow-2xl shadow-black/50 backdrop-blur-2xl">

            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent" />

            <div className="mb-7">

              <h2 className="text-2xl font-semibold">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Sign in to continue to your workspace.
              </p>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

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
                    className="h-[52px] w-full rounded-2xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/20 focus:border-indigo-400/50 focus:bg-white/[0.06] focus:ring-4 focus:ring-indigo-500/10"
                  />

                </div>

              </div>

              {/* Password */}

              <div>

                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-white/70">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotError("");
                      setForgotMessage("");
                      setResetStep("request");
                      setForgotModalOpen(true);
                    }}
                    className="text-xs font-semibold text-indigo-300 transition hover:text-indigo-200 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

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
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    className="h-[52px] w-full rounded-2xl border border-white/10 bg-black/20 pl-11 pr-12 text-sm text-white outline-none transition-all placeholder:text-white/20 focus:border-indigo-400/50 focus:bg-white/[0.06] focus:ring-4 focus:ring-indigo-500/10"
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
                  ? "Signing in..."
                  : "Enter Workspace"}

                {!loading && (
                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                )}
              </button>

            </form>

            <div className="mt-6 text-center text-sm text-white/40">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-indigo-300 transition hover:text-indigo-200"
              >
                Register
              </Link>
            </div>

          </div>

          <p className="mt-6 text-center text-xs text-white/25">
            Secure workspace authentication
          </p>

        </div>

      </div>

      {/* FORGOT PASSWORD MODAL */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#0c0d18] p-7 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300">
                  <KeyRound size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Reset Password</h3>
                  <p className="text-xs text-white/40">Recover access to your account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="rounded-xl p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {forgotError && (
              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-3 text-xs text-red-300">
                {forgotError}
              </div>
            )}

            {forgotMessage && (
              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-xs text-emerald-300">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                <span>{forgotMessage}</span>
              </div>
            )}

            {resetStep === "request" ? (
              <form onSubmit={handleRequestReset} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/70">
                    Account Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 pl-11 pr-4 text-xs text-white outline-none transition focus:border-indigo-400/50"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-xs font-medium transition hover:bg-white/[0.08]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-xs font-semibold shadow-xl shadow-indigo-500/20 transition hover:scale-[1.02] disabled:opacity-50"
                  >
                    {forgotLoading ? "Sending..." : "Send Reset Code"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleExecuteReset} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/70">
                    Reset Token / Code
                  </label>
                  <input
                    type="text"
                    required
                    value={resetTokenInput}
                    onChange={(e) => setResetTokenInput(e.target.value)}
                    placeholder="RESET-123456"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-xs font-mono text-indigo-300 outline-none transition focus:border-indigo-400/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-white/70">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new 8+ character password"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-xs text-white outline-none transition focus:border-indigo-400/50"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetStep("request")}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-xs font-medium transition hover:bg-white/[0.08]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-semibold text-white shadow-xl shadow-emerald-500/20 transition hover:scale-[1.02] disabled:opacity-50"
                  >
                    {forgotLoading ? "Resetting..." : "Save & Sign In"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </main>
  );
}
