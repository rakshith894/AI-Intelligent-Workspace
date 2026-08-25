
import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  UserCheck,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

import { acceptInvitation } from "../../services/workspace";

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState("");

  const accessToken = localStorage.getItem("access_token");

  async function handleAccept() {
    if (!token) {
      setError("Invalid or missing invitation token.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await acceptInvitation(token);
      setSuccess(true);
      setRole(response.role);
    } catch (err: unknown) {
      console.error(err);
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(message || "Failed to accept workspace invitation. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#050508] px-4 text-white">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[20%] top-[15%] h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[140px]" />
        <div className="absolute right-[15%] bottom-[15%] h-[450px] w-[450px] rounded-full bg-purple-600/10 blur-[160px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-[32px] border border-white/10 bg-white/[0.035] p-8 shadow-2xl backdrop-blur-2xl md:p-10"
      >
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10 shadow-lg shadow-indigo-500/10">
            {success ? (
              <CheckCircle2 size={30} className="text-emerald-300" />
            ) : (
              <Sparkles size={30} className="text-indigo-300" />
            )}
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300/70">
            WORKSPACE INVITATION
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            {success ? "You're in!" : "Join the Workspace"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/45">
            {success
              ? `You have successfully joined as a ${role || "member"}. Your command center is ready.`
              : "You have been invited to collaborate on projects, tasks, and team analytics in Intelligent Workspace."}
          </p>

          {error && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-4 text-left text-xs text-rose-300">
              <AlertTriangle size={18} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {!accessToken && !success && (
            <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-500/[0.05] p-4 text-left text-xs text-amber-300">
              <p className="font-semibold">Authentication required</p>
              <p className="mt-1 text-white/50">
                Please log in or register before accepting this invitation.
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  to={`/login?redirect=/invite/${token}`}
                  className="rounded-xl bg-amber-400/20 px-3 py-1.5 font-medium text-amber-200 hover:bg-amber-400/30"
                >
                  Log In
                </Link>
                <Link
                  to={`/register?redirect=/invite/${token}`}
                  className="rounded-xl border border-white/10 px-3 py-1.5 font-medium text-white/70 hover:text-white"
                >
                  Register
                </Link>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-3">
            {success ? (
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-semibold text-white shadow-xl shadow-emerald-500/25 transition hover:scale-[1.01]"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={17} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAccept}
                disabled={loading || !accessToken}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 transition hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Joining workspace...</span>
                  </>
                ) : (
                  <>
                    <UserCheck size={18} />
                    <span>Accept & Join Workspace</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full text-center text-xs text-white/35 transition hover:text-white"
            >
              Back to Login
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
