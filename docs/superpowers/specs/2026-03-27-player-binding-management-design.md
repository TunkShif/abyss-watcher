# Player Binding Management Feature — Design

**Date:** 2026-03-27
**Status:** Approved

## Overview

Add the ability for admin users to manage Steam player bindings from the dashboard. Each group has a cog icon that opens a slide-over panel where admins can bind QQ group members to Steam IDs and view/remove existing bindings.

---

## Route Structure

```
/dashboard                              → dashboard/route.tsx
/dashboard/group/:groupId/edit          → dashboard/group/edit/route.tsx
```

### Routes Config Change (`app/routes.ts`)

Add a new route alongside the dashboard layout route:

```typescript
route("dashboard/group/:groupId/edit", "routes/dashboard/group/edit/route.tsx")
```

The dashboard layout (`routes/layout.tsx`) renders both the dashboard content (`<Outlet />`) and the slide-over panel when the `groupId` param is present. This means the panel overlays the dashboard without unmounting it.

---

## Slide-Over Panel

**Dimensions:** Width ~480px, full viewport height, slides in from right.

**Header:** Shows group name and close button.

**Tabs:**
- **Members** — List of all group QQ members with their current bind status
- **Bind Player** — Form to search/select a QQ member and enter a Steam ID

**Panel state is URL-driven** — navigating to `/dashboard/group/:groupId/edit` opens the panel. Navigating away (back button, close button, or outside click) closes it. This makes the panel state shareable and back-button friendly.

---

## Edit Route Loader

**Route:** `app/routes/dashboard/group/edit/route.tsx`

**Loads:**
1. Group info (name, member count) — from `GroupService.listGroups()`
2. Group QQ members — from `GroupService.listMembers(groupId)` (OneBot API)
3. Bound users for this group — from DB join of `players_users` + `groups_users`
4. Current user's admin permission for this group — via `UserService.isGroupAdmin(userId, groupId)`

**Permission check:** If current user is not admin of the group, throw a 403 response.

**Returns:**
```typescript
{
  group: { groupId, groupName, memberCount },
  members: GroupMemberInfo[],          // All QQ group members from OneBot
  boundUsers: BoundUser[],            // Those with Steam bindings
  unboundMembers: GroupMemberInfo[],  // Members without bindings
}
```

---

## Edit Route Action

Three intents handled by a single action function:

### `lookup` Intent
- **Input:** `steamId` (string)
- **Process:** Calls `PlayerService.fetchLatestSummaries([steamId])`
- **Result:** Returns Steam player preview (avatar, name, online state) or error if not found
- **No DB write**

### `bind` Intent
- **Input:** `userId` (QQ user ID), `steamId` (string)
- **Process:**
  1. Verify Steam ID exists via `PlayerService.fetchLatestSummaries([steamId])`
  2. Insert into `players_users` table
  3. Insert into `groups_users` table if not already present
- **Result:** Success or error message
- **Validation:** Prevent duplicate bindings for same `userId`

### `unbind` Intent
- **Input:** `userId` (string)
- **Process:** Delete from `players_users` table (the binding only, not the group membership)
- **Result:** Success or error message

---

## Permission Flow

1. Dashboard loader returns `groupsPerms` — a map of `groupId → boolean` indicating if current user is admin
2. In `GroupCard`, the cog button is disabled if `!groupsPerms[groupId]`
3. If user clicks enabled cog → navigate to `/dashboard/group/:groupId/edit`
4. Edit route loader **re-checks** `isGroupAdmin` (defense in depth) and throws 403 if not admin

---

## UI Components

### `SlideOverPanel`
Right-side drawer component. Renders in the dashboard layout when `groupId` param exists. Uses React Router `useParams` to know which group is open. CSS: `fixed inset-y-0 right-0 w-[480px] bg-abyss-900 border-l border-white/5 shadow-2xl z-50`.

### `MemberList` (Members Tab)
- Shows all group members, split into "Bound" and "Not Bound" sections
- Each bound user shows: QQ nickname/card, Steam name, avatar, unbind button
- Each unbound user shows: QQ nickname/card, "Not Bound" label
- Unbind button triggers a `ConfirmDialog`

### `BindForm` (Bind Player Tab)
- **Step 1:** Searchable select dropdown of unbound group members
- **Step 2:** Text input for Steam ID (with validation format)
- **Step 3:** "Preview" button → calls `lookup` action → shows `SteamPreviewCard`
- **Step 4:** "Bind" button → calls `bind` action → on success, refresh member list

### `SteamPreviewCard`
Displays after successful lookup:
- Avatar image
- Steam persona name
- Online state badge (Online/Offline/In-Game)
- Current game name if playing

### `ConfirmDialog`
Simple confirmation for unbinding:
- "Are you sure you want to unbind [SteamName] from [QQNickname]?"
- Cancel / Confirm buttons
- Confirm triggers `unbind` action

---

## Existing Code Integration

- **`app/routes/dashboard/route.tsx`** — Already has `groupsPerms` logic; cog button already exists (needs `disabled` check and `onClick` navigation)
- **`app/lib/modules/group/index.ts`** — Already has `listMembers()` and `listPlayerGroupIds()`
- **`app/lib/modules/user/index.ts`** — Already has `isGroupAdmin()`
- **`app/lib/modules/player/index.ts`** — Already has `fetchLatestSummaries()`
- **`app/lib/database/schema.ts`** — `players_users` and `groups_users` tables already exist

---

## New Files to Create

1. `app/routes/dashboard/group/edit/route.tsx` — Edit route with loader/action
2. `app/components/slide-over-panel.tsx` — Reusable slide-over component (if extracted)
3. `app/components/steam-preview-card.tsx` — Steam info preview component
4. `app/components/confirm-dialog.tsx` — Confirmation dialog component
5. `app/routes/dashboard/group/edit/components/member-list.tsx` — Member list tab
6. `app/routes/dashboard/group/edit/components/bind-form.tsx` — Bind player tab

---

## Conventions

- Prefer React Router `Form` / `useFetcher` conventions over client-side fetch
- All data mutations go through route actions
- Use existing TailwindCSS utility classes and theme (dark cyberpunk style)
- UI components live close to their route (`routes/dashboard/group/edit/components/`)
