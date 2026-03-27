import { data, redirect, useNavigate } from "react-router";
import type { Route } from "./+types/route";
import { useState } from "react";
import { GroupService } from "~/lib/modules/group";
import { PlayerService } from "~/lib/modules/player";
import { userContext } from "~/lib/modules/auth/context";
import { UserService } from "~/lib/modules/user";
import * as v from "valibot";
import { ActionSchema } from "./schema";
import { SlideOverPanel } from "~/components/slide-over-panel";
import { MemberListTab } from "./member-list";
import { BindFormTab } from "./bind-form";

// Loader: loads group info, members, bound users for this group
export async function loader({ params, context }: Route.LoaderArgs) {
  const { groupId } = params;
  const currentUser = context.get(userContext);

  // Permission check (defense in depth — layout already checks groupsPerms)
  const isAdmin = await UserService.isGroupAdmin(currentUser.user_id, groupId);
  if (!isAdmin) {
    throw data({ message: "Not authorized to manage this group" }, { status: 403 });
  }

  // Fetch in parallel: group list, all members, bound users for this group
  const [group, allMembers, boundUsers] = await Promise.all([
    GroupService.listGroups().then((groups) => groups.find((g) => g.group_id.toString() === groupId)),
    GroupService.listMembers(groupId),
    GroupService.listBoundUsersForGroup(groupId),
  ]);

  if (!group) {
    throw data({ message: "Group not found" }, { status: 404 });
  }

  // Compute unbound members (members without a binding)
  const boundUserIdSet = new Set(boundUsers.map((u) => u.userId));
  const unboundMembers = allMembers.filter((m) => !boundUserIdSet.has(m.user_id.toString()));

  return {
    group: { groupId: group.group_id.toString(), groupName: group.group_name, memberCount: group.member_count },
    boundUsers,
    unboundMembers,
  };
}

// Action: handles lookup, bind, unbind intents
// Uses Valibot schemas from schema.ts for input validation
export async function action({ request, params, context }: Route.ActionArgs) {
  const { groupId } = params;
  const currentUser = context.get(userContext);

  // Permission check
  const isAdmin = await UserService.isGroupAdmin(currentUser.user_id, groupId);
  if (!isAdmin) {
    throw data({ message: "Not authorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  // Validate form data with Valibot
  const parseResult = v.safeParse(ActionSchema, { intent, ...Object.fromEntries(formData) });
  if (!parseResult.success) {
    return { error: parseResult.issues.map((i) => i.message).join(", "), intent };
  }

  const parsed = parseResult.output;

  if (parsed.intent === "lookup") {
    const summaries = await PlayerService.fetchLatestSummaries([parsed.steamId]);
    if (summaries.length === 0) {
      return { error: "Steam player not found", intent };
    }
    return { preview: summaries[0], intent };
  }

  if (parsed.intent === "bind") {
    // Verify Steam ID exists
    const summaries = await PlayerService.fetchLatestSummaries([parsed.steamId]);
    if (summaries.length === 0) {
      return { error: "Steam player not found", intent };
    }

    // Create global binding (players_users) and group tracking (groups_users)
    await PlayerService.bind(parsed.userId, parsed.steamId);
    await GroupService.bindPlayerToGroup(parsed.userId, groupId);
    return redirect("/dashboard");
  }

  if (parsed.intent === "unbind") {
    // Unbind removes the user from this group's tracking context (groups_users),
    // NOT the global Steam binding (players_users). This way the user keeps
    // their Steam binding but stops being tracked in this group.
    // Use params.groupId (not parsed.groupId) for security — it's the URL source of truth.
    await GroupService.unbindPlayerFromGroup(parsed.userId, groupId);
    return { success: true, intent };
  }

  return { error: "Unknown intent", intent };
}

export default function GroupEditRoute({ loaderData }: Route.ComponentProps) {
  const { group, boundUsers, unboundMembers } = loaderData;
  const [activeTab, setActiveTab] = useState<"members" | "bind">("members");
  const navigate = useNavigate();

  return (
    <SlideOverPanel title={group.groupName} onClose={() => navigate("/dashboard")}>
      {/* Tabs */}
      <div className="flex border-b border-white/5">
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "members"
              ? "text-neon-blue border-b-2 border-neon-blue"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Members
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("bind")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "bind"
              ? "text-neon-blue border-b-2 border-neon-blue"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Bind Player
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "members" ? (
          <MemberListTab
            boundUsers={boundUsers}
            unboundMembers={unboundMembers}
            groupId={group.groupId}
          />
        ) : (
          <BindFormTab
            unboundMembers={unboundMembers}
            groupId={group.groupId}
          />
        )}
      </div>
    </SlideOverPanel>
  );
}
