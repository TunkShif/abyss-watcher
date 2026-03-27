import { data } from "react-router";
import type { Route } from "./+types/route";
import { GroupService } from "~/lib/modules/group";
import type { BoundUser } from "~/lib/modules/group/models";
import { PlayerService } from "~/lib/modules/player";
import { userContext } from "~/lib/modules/auth/context";
import { UserService } from "~/lib/modules/user";
import { v } from "valibot";
import { ActionSchema } from "./schema";

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

    await PlayerService.bind(parsed.userId, parsed.steamId);
    return { success: true, intent };
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
