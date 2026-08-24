import { useEffect, useState } from "react";
import {
  Users,
  Loader2,
  ShieldCheck,
  User,
} from "lucide-react";

import {
  getWorkspaceMembers,
  type WorkspaceMember,
} from "../../services/workspace";

import {
  getMyWorkspaces,
  type Workspace,
} from "../../services/workspace";

export default function TeamMembers() {
  const [workspace, setWorkspace] =
    useState<Workspace | null>(null);

  const [members, setMembers] =
    useState<WorkspaceMember[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadMembers() {
      try {
        setLoading(true);
        setError("");

        const workspaces =
          await getMyWorkspaces();

        if (!workspaces.length) {
          setError("No workspace found.");
          return;
        }

        const currentWorkspace =
          workspaces[0];

        setWorkspace(currentWorkspace);

        const data =
          await getWorkspaceMembers(
            currentWorkspace.id,
          );

        setMembers(data);
      } catch (err) {
        console.error(err);
        setError(
          "Unable to load workspace members.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            size={28}
            className="animate-spin text-indigo-300"
          />

          <p className="text-sm text-white/40">
            Loading workspace members...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-8">

      {/* HEADER */}

      <div>
        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10">
            <Users
              size={20}
              className="text-indigo-300"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Workspace Members
            </h1>

            <p className="mt-1 text-sm text-white/40">
              Manage people who belong to this workspace.
            </p>
          </div>

        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* WORKSPACE */}

      {workspace && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
          <p className="text-xs uppercase tracking-wider text-white/30">
            Workspace
          </p>

          <p className="mt-2 text-lg font-semibold">
            {workspace.name}
          </p>
        </div>
      )}

      {/* MEMBERS */}

      <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6">

        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Members
          </h2>

          <p className="mt-1 text-sm text-white/30">
            People currently in this workspace.
          </p>
        </div>

        {members.length === 0 ? (

          <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10">

            <Users
              size={28}
              className="text-white/20"
            />

            <p className="mt-4 text-sm font-medium">
              No members found
            </p>

          </div>

        ) : (

          <div className="space-y-3">

            {members.map((member) => (

              <div
                key={member.id}
                className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"
              >

                <div className="flex items-center gap-4">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                    <User size={18} />
                  </div>

                  <div>
                    <p className="font-medium">
                      {member.email}
                    </p>

                    <p className="mt-1 text-xs text-white/30">
                      {member.role}
                    </p>
                  </div>

                </div>

                {member.role === "owner" && (
                  <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">
                    <ShieldCheck size={14} />
                    Owner
                  </div>
                )}

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}