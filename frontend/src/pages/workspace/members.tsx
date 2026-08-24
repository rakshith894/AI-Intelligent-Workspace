import { useEffect, useState } from "react";
import {
  Crown,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  getMyWorkspaces,
  type Workspace,
} from "../../services/workspace";

import {
  getWorkspaceMembers,
  isWorkspaceOwner,
  type WorkspaceMember,
} from "../../services/workspace-members";

export default function WorkspaceMembers() {
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

        if (!workspaces || workspaces.length === 0) {
          setWorkspace(null);
          setMembers([]);
          setError("No workspace found.");
          return;
        }

        // Currently using the first workspace.
        // Later this can be replaced with the selected workspace.
        const currentWorkspace =
          workspaces[0];

        setWorkspace(currentWorkspace);

        const workspaceMembers =
          await getWorkspaceMembers(
            currentWorkspace.id,
          );

        setMembers(
          Array.isArray(workspaceMembers)
            ? workspaceMembers
            : [],
        );
      } catch (err) {
        console.error(
          "Failed to load workspace members:",
          err,
        );

        const responseError =
          (
            err as {
              response?: {
                status?: number;
                data?: {
                  detail?: string;
                };
              };
            }
          )?.response;

        if (responseError?.status === 403) {
          setError(
            "You do not have permission to view this workspace's members.",
          );
        } else {
          setError(
            responseError?.data?.detail ||
              "Unable to load workspace members.",
          );
        }
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
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
            <Loader2
              size={24}
              className="animate-spin text-indigo-300"
            />
          </div>

          <p className="text-sm text-white/40">
            Loading workspace members...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-4">
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="mx-auto max-w-[1200px]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center">
          <Users
            size={28}
            className="mx-auto text-white/20"
          />

          <h2 className="mt-4 text-lg font-semibold">
            No workspace found
          </h2>

          <p className="mt-2 text-sm text-white/30">
            Create a workspace before managing members.
          </p>
        </div>
      </div>
    );
  }

  const owner =
    isWorkspaceOwner(workspace.role);

  return (
    <div className="mx-auto max-w-[1500px] space-y-8">

      {/* HEADER */}

      <section>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10">
            <Users
              size={22}
              className="text-indigo-300"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Workspace Members
            </h1>

            <p className="mt-1 text-sm text-white/40">
              View members and their workspace roles.
            </p>
          </div>
        </div>
      </section>

      {/* WORKSPACE INFO */}

      <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 backdrop-blur-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-xs uppercase tracking-wider text-white/30">
              Workspace
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              {workspace.name}
            </h2>

            <p className="mt-1 text-xs text-white/30">
              {workspace.slug}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2">
            {owner ? (
              <>
                <Crown
                  size={16}
                  className="text-amber-300"
                />

                <span className="text-sm text-amber-200">
                  Owner
                </span>
              </>
            ) : (
              <>
                <ShieldCheck
                  size={16}
                  className="text-indigo-300"
                />

                <span className="text-sm capitalize text-white/60">
                  {workspace.role || "Member"}
                </span>
              </>
            )}
          </div>

        </div>
      </section>

      {/* MEMBERS */}

      <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 backdrop-blur-2xl">

        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Members
          </h2>

          <p className="mt-1 text-sm text-white/30">
            {members.length} member
            {members.length === 1 ? "" : "s"} in this workspace.
          </p>
        </div>

        {members.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
              <Users
                size={24}
                className="text-white/20"
              />
            </div>

            <h3 className="mt-4 text-sm font-medium">
              No members found
            </h3>

            <p className="mt-2 text-xs text-white/30">
              No members are currently available.
            </p>

          </div>
        ) : (
          <div className="space-y-3">

            {members.map((member) => {
              const memberIsOwner =
                isWorkspaceOwner(member.role);

              const displayName =
                member.name ||
                member.email ||
                member.user_id ||
                "User";

              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-sm font-semibold text-indigo-200 ring-1 ring-white/10">
                      {displayName
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white/90">
                        {displayName}
                      </p>

                      {member.email && (
                        <p className="mt-1 truncate text-xs text-white/30">
                          {member.email}
                        </p>
                      )}
                    </div>

                  </div>

                  <div className="flex shrink-0 items-center gap-2">

                    {memberIsOwner && (
                      <Crown
                        size={15}
                        className="text-amber-300"
                      />
                    )}

                    <span
                      className={`rounded-lg border px-3 py-1.5 text-xs capitalize ${
                        memberIsOwner
                          ? "border-amber-400/20 bg-amber-400/[0.05] text-amber-200"
                          : "border-white/10 bg-white/[0.04] text-white/60"
                      }`}
                    >
                      {member.role || "member"}
                    </span>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </section>

      {/* OWNER INFORMATION */}

      {owner && (
        <section className="rounded-[28px] border border-indigo-400/10 bg-indigo-500/[0.04] p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10">
              <ShieldCheck
                size={19}
                className="text-indigo-300"
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold">
                Owner access
              </h3>

              <p className="mt-1 text-xs leading-5 text-white/35">
                You are the owner of this workspace.
                Owner-only member management features
                can be enabled here.
              </p>
            </div>

          </div>

        </section>
      )}

    </div>
  );
}