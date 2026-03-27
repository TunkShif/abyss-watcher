# Player Binding Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a slide-over panel for admin users to bind QQ group members to Steam IDs, with permission checks and Steam player preview before binding.

**Architecture:** Nested React Router 7 route at `/dashboard/group/:groupId/edit` renders a right-side slide-over panel overlaid on the dashboard. Three action intents: `lookup` (preview Steam player), `bind` (create binding), `unbind` (remove binding). All mutations via React Router `Form`/`useFetcher` conventions. Valibot schemas for action input validation. Service methods for all DB operations.

**Tech Stack:** React Router 7 (SSR), TailwindCSS, Valibot, Drizzle ORM, SQLite, OneBot API, Steam Web API.

---

## File Structure

```
app/routes.ts                                      [MODIFY] Add nested edit route
app/routes/layout.tsx                              [MODIFY] Render slide-over when groupId param present
app/routes/dashboard/route.tsx                     [MODIFY] Add navigation to cog button

app/routes/dashboard/group/edit/
  route.tsx                                       [CREATE] Loader + Action (uses service methods)
  schema.ts                                       [CREATE] Valibot action schemas (lookup, bind, unbind)
  components/
    member-list.tsx                                [CREATE] Members tab — bound/unbound list + unbind
    bind-form.tsx                                  [CREATE] Bind Player tab — search + steam id + preview

app/components/
  slide-over-panel.tsx                             [CREATE] Reusable right-side drawer
  steam-preview-card.tsx                          [CREATE] Steam player info card
  confirm-dialog.tsx                              [CREATE] Confirmation dialog
  group-edit-panel.tsx                            [CREATE] Tabbed panel wrapper using edit route loader
```

---

## Task 1: Add route to routes.ts

**Files:**
- Modify: `app/routes.ts`

- [ ] **Step 1: Read and modify routes.ts**

```typescript
import { index, layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("login", "routes/login/route.tsx"),
  route("logout", "routes/logout.tsx"),
  layout("routes/layout.tsx", [
    route("dashboard", "routes/dashboard/route.tsx"),
    route("dashboard/group/:groupId/edit", "routes/dashboard/group/edit/route.tsx"),
  ]),
] satisfies RouteConfig;
```

Note: The edit route is nested under the layout alongside the dashboard route. When URL matches `/dashboard/group/:groupId/edit`, both dashboard and edit route loaders run, and both components render — the dashboard shows normally while the edit route's panel overlays it.

- [ ] **Step 2: Commit**

```bash
git add app/routes.ts
git commit -m "feat: add dashboard group edit route"
```

---

## Task 2: Create SlideOverPanel component

**Files:**
- Create: `app/components/slide-over-panel.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { X } from "lucide-react";
import type { FC, PropsWithChildren } from "react";

interface SlideOverPanelProps {
  title: string;
  onClose: () => void;
}

export const SlideOverPanel: FC<PropsWithChildren<SlideOverPanelProps>> = ({ title, onClose, children }) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-[480px] max-w-full bg-abyss-900 border-l border-white/5 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-bold text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add app/components/slide-over-panel.tsx
git commit -m "feat: add SlideOverPanel component"
```

---

## Task 3: Add action schemas (Valibot)

**Files:**
- Create: `app/routes/dashboard/group/edit/schema.ts`

- [ ] **Step 1: Write the schema file**

```typescript
import * as v from "valibot";

// Lookup: just steamId
export const LookupSchema = v.object({
  intent: v.literal("lookup"),
  steamId: v.pipe(v.string(), v.nonEmpty("Steam ID is required")),
});

// Bind: userId + steamId
export const BindSchema = v.object({
  intent: v.literal("bind"),
  userId: v.pipe(v.string(), v.nonEmpty("User is required")),
  steamId: v.pipe(v.string(), v.nonEmpty("Steam ID is required")),
});

// Unbind: just userId
export const UnbindSchema = v.object({
  intent: v.literal("unbind"),
  userId: v.pipe(v.string(), v.nonEmpty("User is required")),
});

// Discriminated union for all intents
export const ActionSchema = v.discriminatedUnion("intent", [LookupSchema, BindSchema, UnbindSchema]);

export type LookupInput = v.InferOutput<typeof LookupSchema>;
export type BindInput = v.InferOutput<typeof BindSchema>;
export type UnbindInput = v.InferOutput<typeof UnbindSchema>;
export type ActionInput = v.InferOutput<typeof ActionSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add app/routes/dashboard/group/edit/schema.ts
git commit -m "feat: add Valibot action schemas for group edit"
```

---

## Task 4: Add service methods (reuse or create new)

**Files:**
- Modify: `app/lib/modules/player/index.ts` — add `bind`, `unbind` methods
- Modify: `app/lib/modules/group/index.ts` — add `listBoundUsersForGroup` method

- [ ] **Step 1: Add to PlayerService in player/index.ts**

Add these methods to the `PlayerService` interface and implementation:

```typescript
export interface PlayerService {
  // ... existing methods
  bind(userId: string, playerId: string): Promise<void>;
  unbind(userId: string): Promise<void>;
}

// Add to implementation:
async bind(userId: string, playerId: string) {
  await db
    .insert(playersUsers)
    .values({ userId, playerId })
    .onConflictDoNothing();
},

async unbind(userId: string) {
  await db.delete(playersUsers).where(eq(playersUsers.userId, userId));
},
```

Note: `playersUsers` import is already used in this file. `eq` is already imported.

- [ ] **Step 2: Add to GroupService in group/index.ts**

Add `listBoundUsersForGroup` to the interface and implementation:

```typescript
export interface GroupService {
  // ... existing methods
  listBoundUsersForGroup(groupId: GroupId): Promise<BoundUser[]>;
}

// Add to implementation:
// Uses existing listMembers() to get group members, then joins with DB to find bound ones
async listBoundUsersForGroup(groupId: GroupId): Promise<BoundUser[]> {
  const [members, boundRecords] = await Promise.all([
    this.listMembers(groupId),
    db
      .select({
        userId: playersUsers.userId,
        playerId: playersUsers.playerId,
      })
      .from(groupsUsers)
      .innerJoin(playersUsers, eq(groupsUsers.userId, playersUsers.userId))
      .where(eq(groupsUsers.groupId, groupId))
      .all(),
  ]);

  const memberMap = new Map(members.map((m) => [m.user_id.toString(), m]));
  const boundUserIds = new Set(boundRecords.map((r) => r.userId));

  // Fetch steam summaries for bound players
  const playerIds = boundRecords.map((r) => r.playerId);
  const summaries = playerIds.length > 0
    ? await PlayerService.fetchLatestSummaries(playerIds)
    : [];
  const summaryMap = new Map(summaries.map((s) => [s.playerId, s]));

  return boundRecords.map((r) => {
    const member = memberMap.get(r.userId);
    const summary = summaryMap.get(r.playerId);
    return {
      userId: r.userId,
      playerId: r.playerId,
      userName: summary?.name ?? member?.nickname ?? "Unknown",
      avatarUrl: summary?.avatarUrl,
    };
  });
},
```

Note: The `playersUsers` and `groupsUsers` imports need to be added to the file. Add:
```typescript
import { playersUsers, groupsUsers } from "~/lib/database/schema";
import { eq } from "drizzle-orm";
```

Also add `BoundUser` import from `~/lib/modules/group/models`.

- [ ] **Step 3: Commit**

```bash
git add app/lib/modules/player/index.ts app/lib/modules/group/index.ts
git commit -m "feat: add bind/unbind/listBoundUsersForGroup service methods"
```

---

## Task 5: Create the edit route (loader + action)

**Files:**
- Create: `app/routes/dashboard/group/edit/route.tsx`

- [ ] **Step 1: Write the edit route**

This route has no UI of its own — it only provides loader data and action handlers. The parent layout reads `params.groupId` and renders `GroupEditPanel` which uses `useRouteLoaderData` to access this route's data.

```tsx
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
    await PlayerService.unbind(parsed.userId);
    return { success: true, intent };
  }

  return { error: "Unknown intent", intent };
}
```

- [ ] **Step 2: Commit**

```bash
git add app/routes/dashboard/group/edit/route.tsx
git commit -m "feat: add group edit route with loader and action"
```

---

## Task 6: Create ConfirmDialog component

**Files:**
- Create: `app/components/confirm-dialog.tsx`

- [ ] **Step 1: Write the component**

```tsx
import type { FC } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  destructive = false,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative bg-abyss-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-slate-100 mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-6">{description}</p>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
              destructive
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-neon-blue hover:bg-neon-blue/80 text-white"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add app/components/confirm-dialog.tsx
git commit -m "feat: add ConfirmDialog component"
```

---

## Task 7: Create SteamPreviewCard component

**Files:**
- Create: `app/components/steam-preview-card.tsx`

- [ ] **Step 1: Write the component**

```tsx
import type { FC } from "react";
import type { PlayerSummary } from "~/lib/modules/player/models";
import { SteamPersonaState } from "~/lib/clients/steam/models";

interface SteamPreviewCardProps {
  summary: PlayerSummary;
}

export const SteamPreviewCard: FC<SteamPreviewCardProps> = ({ summary }) => {
  const isOnline = summary.state !== SteamPersonaState.Offline;
  const isInGame = Boolean(summary.gameId);

  return (
    <div className="bg-abyss-800/50 border border-neon-blue/30 rounded-xl p-4">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-neon-blue/50">
            <img src={summary.avatarUrl} alt={summary.name} className="w-full h-full object-cover" />
          </div>
          {/* Status dot */}
          <div
            className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-abyss-800 ${
              isInGame ? "bg-neon-green" : isOnline ? "bg-neon-blue" : "bg-slate-500"
            }`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-100 truncate">{summary.name}</div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">
            ID: {summary.playerId}
          </div>
          <div className="mt-1.5">
            {isInGame ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neon-green bg-neon-green/10 border border-neon-green/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                Playing {summary.gamePlaying}
              </span>
            ) : isOnline ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neon-blue bg-neon-blue/10 border border-neon-blue/30 px-2 py-0.5 rounded-full">
                Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-700/30 border border-slate-600/30 px-2 py-0.5 rounded-full">
                Offline
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add app/components/steam-preview-card.tsx
git commit -m "feat: add SteamPreviewCard component"
```

---

## Task 8: Create GroupEditPanel (tabbed wrapper)

**Files:**
- Create: `app/components/group-edit-panel.tsx`

- [ ] **Step 1: Write GroupEditPanel**

This component lives in `app/components/` (not in the edit route folder) so it can be rendered by the layout. It uses `useRouteLoaderData` to read the edit route's data.

```tsx
import { useState, type FC } from "react";
import { useRouteLoaderData } from "react-router";
import { SlideOverPanel } from "~/components/slide-over-panel";
import { MemberListTab } from "~/routes/dashboard/group/edit/components/member-list";
import { BindFormTab } from "~/routes/dashboard/group/edit/components/bind-form";
import type { Route } from "./+types/layout";

type EditRouteData = Route.ComponentProps;

interface GroupEditPanelProps {
  onClose: () => void;
}

export const GroupEditPanel: FC<GroupEditPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<"members" | "bind">("members");
  const data = useRouteLoaderData("routes/dashboard/group/edit/route") as EditRouteData | undefined;

  if (!data) {
    return (
      <SlideOverPanel title="Manage Group" onClose={onClose}>
        <div className="p-6 text-slate-500">Loading...</div>
      </SlideOverPanel>
    );
  }

  return (
    <SlideOverPanel title={data.group.groupName} onClose={onClose}>
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
          <MemberListTab data={data} />
        ) : (
          <BindFormTab data={data} />
        )}
      </div>
    </SlideOverPanel>
  );
};
```

Note: `Route` type comes from `./+types/layout` which is auto-generated by React Router's typegen. The `FC` import needs to be added.

- [ ] **Step 2: Commit**

```bash
git add app/components/group-edit-panel.tsx
git commit -m "feat: add GroupEditPanel component with tabs"
```

---

## Task 9: Update layout.tsx to render GroupEditPanel

**Files:**
- Modify: `app/routes/layout.tsx`

- [ ] **Step 1: Read current layout.tsx**

The file currently imports `Outlet, Link, NavLink, Form, href` from react-router. We need to add `useParams, useNavigate`.

- [ ] **Step 2: Modify layout.tsx**

In the import section, add `useParams, useNavigate` from react-router. Add import for `GroupEditPanel` from `~/components/group-edit-panel`.

In the `Layout` component function (after `loaderData` destructuring), add:

```tsx
const params = useParams();
const navigate = useNavigate();

const handlePanelClose = () => navigate("/dashboard");
```

In the return JSX, after the `<main>` block closing tag (but still inside the outer div), add:

```tsx
{params.groupId && <GroupEditPanel onClose={handlePanelClose} />}
```

The complete modified layout component should look like:

```tsx
export default function Layout({ loaderData }: Route.ComponentProps) {
  const params = useParams();
  const navigate = useNavigate();

  const handlePanelClose = () => navigate("/dashboard");

  return (
    <div className="min-h-screen text-slate-200 font-sans selection:bg-neon-purple/30 selection:text-white pb-20">
      <NavBar user={loaderData.user} />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <Outlet />
      </main>
      {params.groupId && <GroupEditPanel onClose={handlePanelClose} />}
    </div>
  );
}
```

Note: `NavBar`, `userContext`, `authMiddleware`, and other imports should remain unchanged.

- [ ] **Step 3: Commit**

```bash
git add app/routes/layout.tsx
git commit -m "feat: render GroupEditPanel in layout when editing group"
```

---

## Task 10: Create MemberList tab component

**Files:**
- Create: `app/routes/dashboard/group/edit/components/member-list.tsx`

- [ ] **Step 1: Write the MemberList tab**

```tsx
import { useState, type FC } from "react";
import { useFetcher } from "react-router";
import { ConfirmDialog } from "~/components/confirm-dialog";
import type { Route } from "../+types/route";

type EditRouteData = Route.ComponentProps;

interface MemberListTabProps {
  data: EditRouteData;
}

export const MemberListTab: FC<MemberListTabProps> = ({ data }) => {
  const { boundUsers, unboundMembers } = data;
  const [confirmUnbind, setConfirmUnbind] = useState<{ userId: string; userName: string } | null>(null);
  const unbindFetcher = useFetcher();

  const handleUnbind = (userId: string, userName: string) => {
    setConfirmUnbind({ userId, userName });
  };

  const confirmUnbindAction = () => {
    if (!confirmUnbind) return;
    unbindFetcher.submit(
      { intent: "unbind", userId: confirmUnbind.userId },
      { method: "post" },
    );
    setConfirmUnbind(null);
  };

  return (
    <div className="space-y-6">
      {/* Bound Users */}
      <section>
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
          Bound ({boundUsers.length})
        </h3>
        {boundUsers.length === 0 ? (
          <p className="text-slate-600 text-sm py-4 text-center">No players bound yet.</p>
        ) : (
          <div className="space-y-2">
            {boundUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center gap-3 bg-abyss-800/50 border border-white/5 rounded-lg p-3"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.userName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-600" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-100 truncate">{user.userName}</div>
                  <div className="text-xs text-slate-500 font-mono">{user.playerId}</div>
                </div>

                {/* Unbind button */}
                <button
                  type="button"
                  onClick={() => handleUnbind(user.userId, user.userName)}
                  className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded transition-colors"
                >
                  Unbind
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Unbound Members */}
      <section>
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
          Not Bound ({unboundMembers.length})
        </h3>
        {unboundMembers.length === 0 ? (
          <p className="text-slate-600 text-sm py-4 text-center">All members are bound.</p>
        ) : (
          <div className="space-y-2">
            {unboundMembers.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center gap-3 bg-abyss-800/30 border border-white/5 rounded-lg p-3 opacity-60"
              >
                <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-300 truncate">
                    {member.card || member.nickname}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">ID: {member.user_id}</div>
                </div>
                <span className="text-xs text-slate-600">Not Bound</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Confirm Unbind Dialog */}
      <ConfirmDialog
        open={Boolean(confirmUnbind)}
        title="Unbind Player"
        description={`Are you sure you want to remove the Steam binding for ${confirmUnbind?.userName}? This will stop tracking their activity.`}
        confirmLabel="Unbind"
        onConfirm={confirmUnbindAction}
        onCancel={() => setConfirmUnbind(null)}
        destructive
      />
    </div>
  );
};
```

Note: `Route` type comes from `../+types/route` which is auto-generated by React Router's typegen.

- [ ] **Step 2: Commit**

```bash
git add app/routes/dashboard/group/edit/components/member-list.tsx
git commit -m "feat: add MemberList tab component for group edit panel"
```

---

## Task 11: Create BindForm tab component

**Files:**
- Create: `app/routes/dashboard/group/edit/components/bind-form.tsx`

- [ ] **Step 1: Write the BindForm tab**

```tsx
import { useState, useEffect, type FC } from "react";
import { useFetcher } from "react-router";
import { Search, UserPlus } from "lucide-react";
import { SteamPreviewCard } from "~/components/steam-preview-card";
import type { Route } from "../+types/route";
import type { PlayerSummary } from "~/lib/modules/player/models";

type EditRouteData = Route.ComponentProps;

interface BindFormTabProps {
  data: EditRouteData;
}

export const BindFormTab: FC<BindFormTabProps> = ({ data }) => {
  const { unboundMembers } = data;
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [steamId, setSteamId] = useState<string>("");
  const [previewData, setPreviewData] = useState<PlayerSummary | null>(null);

  const lookupFetcher = useFetcher();
  const bindFetcher = useFetcher();

  const lookupResult = lookupFetcher.data as { preview?: PlayerSummary; error?: string } | undefined;
  const bindResult = bindFetcher.data as { success?: boolean; error?: string } | undefined;

  // Sync preview when lookup succeeds
  useEffect(() => {
    if (lookupResult?.preview) {
      setPreviewData(lookupResult.preview);
    }
  }, [lookupResult]);

  const selectedMember = unboundMembers.find((m) => m.user_id.toString() === selectedUserId);

  const handlePreview = () => {
    if (!steamId.trim()) return;
    setPreviewData(null);
    lookupFetcher.submit({ intent: "lookup", steamId: steamId.trim() }, { method: "post" });
  };

  const handleBind = () => {
    if (!selectedUserId || !steamId.trim()) return;
    bindFetcher.submit(
      { intent: "bind", userId: selectedUserId, steamId: steamId.trim() },
      { method: "post" },
    );
  };

  const isBinding = bindFetcher.state !== "idle";
  const isLookingUp = lookupFetcher.state !== "idle";

  return (
    <div className="space-y-6">
      {/* Member Select */}
      <div>
        <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">
          Select QQ User
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full bg-abyss-950 border border-slate-700 rounded-lg py-2.5 pl-9 pr-4 text-slate-200 focus:outline-none focus:border-neon-blue transition-colors appearance-none"
          >
            <option value="">Search and select a group member...</option>
            {unboundMembers.map((member) => (
              <option key={member.user_id} value={member.user_id.toString()}>
                {member.card || member.nickname} (ID: {member.user_id})
              </option>
            ))}
          </select>
        </div>
        {selectedMember && (
          <p className="mt-2 text-sm text-slate-400">
            Selected: <span className="text-neon-blue">{selectedMember.card || selectedMember.nickname}</span>
          </p>
        )}
      </div>

      {/* Steam ID Input */}
      <div>
        <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">
          Steam ID (64-bit)
        </label>
        <input
          type="text"
          value={steamId}
          onChange={(e) => {
            setSteamId(e.target.value);
            setPreviewData(null);
          }}
          placeholder="e.g. 76561198012345678"
          className="w-full bg-abyss-950 border border-slate-700 rounded-lg py-2.5 px-4 text-slate-200 font-mono focus:outline-none focus:border-neon-blue transition-colors"
        />
      </div>

      {/* Error Messages */}
      {(lookupResult?.error || bindResult?.error) && (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
          {lookupResult?.error || bindResult?.error}
        </div>
      )}

      {/* Preview Card */}
      {previewData ? (
        <div className="space-y-4">
          <SteamPreviewCard summary={previewData} />
          <button
            type="button"
            onClick={handlePreview}
            disabled={isLookingUp || !steamId.trim()}
            className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            {isLookingUp ? "Checking..." : "Re-check Steam ID"}
          </button>
        </div>
      ) : lookupFetcher.state === "idle" && steamId.trim() ? (
        <button
          type="button"
          onClick={handlePreview}
          className="w-full py-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-colors"
        >
          Preview Steam Player
        </button>
      ) : null}

      {/* Success Message */}
      {bindResult?.success && (
        <div className="text-neon-green text-sm bg-neon-green/10 border border-neon-green/30 rounded-lg px-4 py-2">
          Player bound successfully!
        </div>
      )}

      {/* Bind Button */}
      <button
        type="button"
        onClick={handleBind}
        disabled={!selectedUserId || !steamId.trim() || !previewData || isBinding}
        className="w-full flex items-center justify-center gap-2 bg-neon-blue hover:bg-neon-blue/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        {isBinding ? "Binding..." : "Bind Player"}
      </button>
    </div>
  );
};
```

Note: `Route` type comes from `../+types/route` which is auto-generated by React Router's typegen.

- [ ] **Step 2: Commit**

```bash
git add app/routes/dashboard/group/edit/components/bind-form.tsx
git commit -m "feat: add BindForm tab component with steam lookup and bind"
```

---

## Task 12: Update dashboard cog button to navigate

**Files:**
- Modify: `app/routes/dashboard/route.tsx`

- [ ] **Step 1: Find the cog button code (around line 178)**

The cog button currently has `disabled={!canManage}` and no click handler. We need to add navigation to `/dashboard/group/:groupId/edit` when clicked.

- [ ] **Step 2: Add useNavigate import and onClick handler**

Add to imports from react-router:
```tsx
import { href, useNavigate } from "react-router";
```

In the `GroupCard` component, add:
```tsx
const navigate = useNavigate();
```

In the cog button's `onClick` handler (inside the `canManage` branch):
```tsx
<button
  disabled={!canManage}
  type="button"
  onClick={() => navigate(href("/dashboard/group/:groupId/edit", { groupId: group.groupId }))}
  className={`p-1.5 rounded-md transition-all ${
    canManage
      ? "text-slate-500 hover:text-neon-blue hover:bg-neon-blue/10"
      : "text-slate-700 opacity-50 cursor-not-allowed"
  }`}
  title={canManage ? "Manage Group" : "Insufficient Permissions"}
>
  <Settings className="w-4 h-4" />
</button>
```

Note: `href()` from react-router generates the URL. The second argument is the params object.

- [ ] **Step 3: Commit**

```bash
git add app/routes/dashboard/route.tsx
git commit -m "feat: wire cog button to navigate to group edit route"
```

---

## Task 13: Run typecheck and fix any issues

- [ ] **Step 1: Run typecheck**

```bash
bun run typecheck 2>&1
```

Expected: TypeScript errors related to auto-generated route types and missing imports.

- [ ] **Step 2: Fix issues**

Common issues:
- `Route.ComponentProps` path — React Router auto-generates types in `.react-router/` folder. Run `bun run typecheck` to regenerate.
- Missing type imports — the `+types/route` files are auto-generated
- `GroupMemberInfo` type may need import from `~/lib/clients/onebot/models`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "fix: resolve TypeScript errors in player binding feature"
```

---

## Task 14: Test the feature

- [ ] **Step 1: Start dev server**

```bash
bun run dev
```

- [ ] **Step 2: Navigate to dashboard and test cog button**

Open http://localhost:5173/dashboard. Log in if needed. Click the cog icon on a group you have admin permissions for. The slide-over panel should appear from the right.

- [ ] **Step 3: Test Bind flow**

1. Go to "Bind Player" tab
2. Select a QQ member from dropdown
3. Enter a Steam ID
4. Click "Preview Steam Player" — should show player info card
5. Click "Bind Player" — should succeed and show success message
6. Switch to "Members" tab — should show the newly bound player

- [ ] **Step 4: Test Unbind flow**

1. In "Members" tab, click "Unbind" on a bound player
2. Confirm dialog appears
3. Click "Unbind" — player should be removed from bound list

- [ ] **Step 5: Test permission enforcement**

As a non-admin user, the cog button should be disabled. Directly navigating to `/dashboard/group/:groupId/edit` should return a 403 error page.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: verify player binding management feature"
```

---

## Spec Coverage Checklist

- [x] Route structure (`/dashboard/group/:groupId/edit`) — Task 1
- [x] Slide-over panel in layout when groupId present — Tasks 8, 9
- [x] Edit route loader (group info, members, bound users, permission check) — Task 5
- [x] Edit route action (lookup, bind, unbind) with Valibot validation — Tasks 3, 5
- [x] Service methods (bind, unbind, listBoundUsersForGroup) — Task 4
- [x] Members tab with bound/unbound sections + unbind — Task 10
- [x] Bind form tab with member select, steam ID input, preview, bind — Task 11
- [x] Steam preview card — Task 7
- [x] Confirmation dialog for unbind — Task 6
- [x] Cog button navigation from dashboard — Task 12
- [x] Permission enforcement (cog disabled + loader 403) — Tasks 5, 12
