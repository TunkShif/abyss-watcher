# Player Binding Management — Route Architecture Refactor

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the route architecture so the group edit panel is rendered by the edit route's component (SSR), not by the layout with `useRouteLoaderData` (client fetch). Also correct bind submission to use `Form` + `redirect`, and fix file organization.

**Architecture:** The edit route (`dashboard/group/:groupId/edit/route.tsx`) becomes a proper route with a default component that renders the panel. Data flows from loader → component props (SSR). Bind uses `<Form>` + `redirect()`. Lookup/unbind use `useFetcher`. Files are reorganized to live at the correct nesting depth.

**Tech Stack:** React Router 7 (SSR mode), TypeScript, TailwindCSS v4

---

## File Changes Map

| Action | Path |
|--------|------|
| Move | `app/routes/dashboard/group/edit/components/member-list.tsx` → `app/routes/dashboard/group/edit/member-list.tsx` |
| Move | `app/routes/dashboard/group/edit/components/bind-form.tsx` → `app/routes/dashboard/group/edit/bind-form.tsx` |
| Modify | `app/routes/dashboard/group/edit/route.tsx` — add default component (merged GroupEditPanel) |
| Modify | `app/routes/layout.tsx` — remove panel, params, navigate, showEditPanel |
| Delete | `app/routes/dashboard/group/edit/components/` (entire folder) |
| Delete | `app/components/group-edit-panel.tsx` |

---

## Task 1: Move `member-list.tsx`

**Files:**
- Create: `app/routes/dashboard/group/edit/member-list.tsx`
- Delete: `app/routes/dashboard/group/edit/components/member-list.tsx`

- [ ] **Step 1: Create new file at correct depth**

Write the file to `app/routes/dashboard/group/edit/member-list.tsx` with identical contents from `app/routes/dashboard/group/edit/components/member-list.tsx`.

- [ ] **Step 2: Verify identical**

Read both files, confirm content is identical before deleting old one.

- [ ] **Step 3: Delete old file**

Delete `app/routes/dashboard/group/edit/components/member-list.tsx`.

- [ ] **Step 4: Commit**

```bash
git add app/routes/dashboard/group/edit/member-list.tsx app/routes/dashboard/group/edit/components/member-list.tsx
git mv app/routes/dashboard/group/edit/components/member-list.tsx app/routes/dashboard/group/edit/member-list.tsx
git commit -m "refactor: move member-list.tsx up from components/ subfolder"
```

---

## Task 2: Move `bind-form.tsx`

**Files:**
- Create: `app/routes/dashboard/group/edit/bind-form.tsx`
- Delete: `app/routes/dashboard/group/edit/components/bind-form.tsx`

- [ ] **Step 1: Read current bind-form.tsx**

Read `app/routes/dashboard/group/edit/components/bind-form.tsx` to understand its full contents.

- [ ] **Step 2: Create new file at correct depth**

Write to `app/routes/dashboard/group/edit/bind-form.tsx` — this file will be modified in Task 4, so for now write the same contents as the original.

- [ ] **Step 3: Delete old file**

Delete `app/routes/dashboard/group/edit/components/bind-form.tsx`.

- [ ] **Step 4: Commit**

```bash
git add app/routes/dashboard/group/edit/bind-form.tsx app/routes/dashboard/group/edit/components/bind-form.tsx
git mv app/routes/dashboard/group/edit/components/bind-form.tsx app/routes/dashboard/group/edit/bind-form.tsx
git commit -m "refactor: move bind-form.tsx up from components/ subfolder"
```

---

## Task 3: Clean up `layout.tsx`

**Files:**
- Modify: `app/routes/layout.tsx`

**Before (relevant lines):**
```typescript
import { ..., useNavigate, useParams } from "react-router";
import { GroupEditPanel } from "~/components/group-edit-panel";

export default function Layout({ loaderData }: Route.ComponentProps) {
  const params = useParams();
  const navigate = useNavigate();
  const showEditPanel = Boolean(params.groupId);
  // ...
  {showEditPanel && (
    <GroupEditPanel onClose={() => navigate("/dashboard")} />
  )}
}
```

- [ ] **Step 1: Remove GroupEditPanel import**

Remove: `import { GroupEditPanel } from "~/components/group-edit-panel";`

- [ ] **Step 2: Remove useParams, useNavigate, showEditPanel**

Remove from imports: `useNavigate, useParams`
Remove from component body: `const params = useParams();`, `const navigate = useNavigate();`, `const showEditPanel = Boolean(params.groupId);`

- [ ] **Step 3: Remove panel rendering**

Remove the conditional panel render block:
```typescript
{showEditPanel && (
  <GroupEditPanel onClose={() => navigate("/dashboard")} />
)}
```

- [ ] **Step 4: Verify layout.tsx is clean**

The default export should now just render `<NavBar>` and `<Outlet />` inside the container div, with no conditional panel rendering.

- [ ] **Step 5: Commit**

```bash
git add app/routes/layout.tsx
git commit -m "refactor: remove GroupEditPanel from layout, it now lives in edit route"
```

---

## Task 4: Merge GroupEditPanel into `route.tsx` + fix BindFormTab

**Files:**
- Modify: `app/routes/dashboard/group/edit/route.tsx`
- Modify: `app/routes/dashboard/group/edit/bind-form.tsx`
- Modify: `app/routes/dashboard/group/edit/member-list.tsx`

**This is the main task.** Read all three files first before making changes.

### Changes to `route.tsx`:

Add default component after the `action` function. The component renders the slide-over panel with tabs:

```typescript
import { useState } from "react";
import { redirect, useNavigate } from "react-router";
import { SlideOverPanel } from "~/components/slide-over-panel";
import { MemberListTab } from "./member-list";
import { BindFormTab } from "./bind-form";

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
```

### Changes to `bind-form.tsx`:

**Key change:** Remove `bindFetcher` entirely. Add `Form` from `react-router` for the bind submit. The action returns `redirect("/dashboard")` so no manual `onClose` is needed.

**Before (bind section):**
```typescript
const bindFetcher = useFetcher();
const bindSuccessHandled = useRef(false);
const bindResult = bindFetcher.data as { success?: boolean; error?: string } | undefined;

useEffect(() => {
  if (bindResult?.success && !bindSuccessHandled.current && onClose) {
    bindSuccessHandled.current = true;
    onClose();
  }
}, [bindResult, onClose]);

const handleBind = () => {
  bindFetcher.submit(
    { intent: "bind", userId: selectedUserId, steamId: steamId.trim() },
    { method: "post", action: `/dashboard/group/${groupId}/edit` }
  );
};
```

**After (bind section):**
```typescript
// No bindFetcher, no useEffect for success, no handleBind function
// Instead, use Form component — action returns redirect("/dashboard")
```

The bind button becomes:
```typescript
<Form
  method="post"
  action={`/dashboard/group/${groupId}/edit`}
  onSubmit={(e) => {
    if (!selectedUserId || !steamId.trim() || !previewData) {
      e.preventDefault();
    }
  }}
>
  <input type="hidden" name="intent" value="bind" />
  <input type="hidden" name="userId" value={selectedUserId} />
  <input type="hidden" name="steamId" value={steamId} />
  <button
    type="submit"
    disabled={!selectedUserId || !steamId.trim() || !previewData}
    className="w-full flex items-center justify-center gap-2 bg-neon-blue hover:bg-neon-blue/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
  >
    <UserPlus className="w-4 h-4" />
    Bind Player
  </button>
</Form>
```

Also remove `onClose` from `BindFormTabProps` interface since it's no longer needed.

### Changes to `member-list.tsx`:

No changes needed — `unbindFetcher` usage is correct as-is.

### Changes to `route.tsx` action:

In the `action` function, change the bind intent return from `{ success: true }` to `redirect("/dashboard")`:

**Before:**
```typescript
if (parsed.intent === "bind") {
  await PlayerService.bind(parsed.userId, parsed.steamId);
  await GroupService.bindPlayerToGroup(parsed.userId, groupId);
  return { success: true, intent };
}
```

**After:**
```typescript
if (parsed.intent === "bind") {
  await PlayerService.bind(parsed.userId, parsed.steamId);
  await GroupService.bindPlayerToGroup(parsed.userId, groupId);
  return redirect("/dashboard");
}
```

- [ ] **Step 1: Read all three files**

Read `app/routes/dashboard/group/edit/route.tsx`, `app/routes/dashboard/group/edit/bind-form.tsx`, and `app/routes/dashboard/group/edit/member-list.tsx` before making changes.

- [ ] **Step 2: Add imports to route.tsx**

Add to the imports at the top of `route.tsx`:
```typescript
import { useState } from "react";
import { redirect, useNavigate } from "react-router";
import { SlideOverPanel } from "~/components/slide-over-panel";
import { MemberListTab } from "./member-list";
import { BindFormTab } from "./bind-form";
```

- [ ] **Step 3: Add default component to route.tsx**

Add after the `action` function:
```typescript
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
```

- [ ] **Step 4: Update bind intent in action to return redirect**

Change:
```typescript
return { success: true, intent };
```
To:
```typescript
return redirect("/dashboard");
```

Add `redirect` to the import from `react-router` if not already there.

- [ ] **Step 5: Refactor BindFormTab**

Read the current `bind-form.tsx`. Apply these changes:

1. Remove `useRef` import (was used for `bindSuccessHandled`)
2. Remove `useFetcher` import (bindFetcher no longer needed)
3. Add `Form` to import from `react-router`
4. Remove `onClose` from `BindFormTabProps` interface
5. Remove `bindFetcher` declaration
6. Remove `bindSuccessHandled` ref
7. Remove `bindResult` and `lookupResult` fetcher data reads — keep only `lookupFetcher` for the lookup intent
8. Remove the `useEffect` that called `onClose` on bind success
9. Replace `handleBind` function and its button with a `<Form method="post">` block

The `lookupFetcher` stays as-is — it's still needed for the preview lookup.

- [ ] **Step 6: Update BindFormTabProps interface**

Change from:
```typescript
interface BindFormTabProps {
  unboundMembers: GroupMemberInfo[];
  groupId: string;
  onClose?: () => void;
}
```
To:
```typescript
interface BindFormTabProps {
  unboundMembers: GroupMemberInfo[];
  groupId: string;
}
```

- [ ] **Step 7: Remove onClose from MemberListTab if passed from route**

In `route.tsx`, the `MemberListTab` is called without `onClose`. Verify `member-list.tsx` does not use `onClose`.

- [ ] **Step 8: Run typecheck**

```bash
bun run typecheck
```

Expected: No TypeScript errors. If errors, fix them before proceeding.

- [ ] **Step 9: Commit**

```bash
git add app/routes/dashboard/group/edit/route.tsx app/routes/dashboard/group/edit/bind-form.tsx
git commit -m "feat: merge GroupEditPanel into edit route and fix bind to use Form+redirect"
```

---

## Task 5: Delete moved-from components folder and group-edit-panel

**Files:**
- Delete: `app/routes/dashboard/group/edit/components/` (entire directory)
- Delete: `app/components/group-edit-panel.tsx`

- [ ] **Step 1: Verify all files in components/ are moved**

Confirm `app/routes/dashboard/group/edit/components/` is empty or only contains files already moved.

- [ ] **Step 2: Delete components/ folder**

```bash
rm -rf app/routes/dashboard/group/edit/components/
```

- [ ] **Step 3: Delete group-edit-panel.tsx**

```bash
rm app/components/group-edit-panel.tsx
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove group-edit-panel and nested components/ folder"
```

---

## Task 6: Final verification

- [ ] **Step 1: Run typecheck**

```bash
bun run typecheck
```

Expected: PASS with no errors.

- [ ] **Step 2: Run lint**

```bash
npx @biomejs/biome lint ./app
```

Expected: PASS or only pre-existing warnings.

- [ ] **Step 3: Run dev server briefly to smoke test**

```bash
bun run dev &
sleep 5
# Visit /dashboard/group/123/edit in browser manually to verify panel renders
kill %1
```

Expected: Panel renders without "Loading..." flash, bind redirects to /dashboard on success.

- [ ] **Step 4: Commit any remaining changes**

---

## Spec Coverage Check

| Spec Section | Task |
|---------------|------|
| Route structure (panel in route not layout) | Tasks 3, 4 |
| File organization (flatten components/) | Tasks 1, 2, 5 |
| route.tsx default component | Task 4 |
| BindFormTab: Form + redirect for bind | Task 4 |
| MemberListTab: unbindFetcher unchanged | Task 4 |
| layout.tsx: remove panel/params/navigate | Task 3 |
| Action: bind returns redirect("/dashboard") | Task 4 |
| Delete group-edit-panel.tsx | Task 5 |
| Delete components/ folder | Task 5 |

All spec sections covered. No gaps.
