# Player Binding Management — Route Architecture Refactor

**Date:** 2026-03-27
**Status:** Approved
**Replaces:** `2026-03-27-player-binding-management-design.md` (superseded by this refactor)

## Overview

Fix the incorrect route architecture from the original player binding management implementation. The original design placed `GroupEditPanel` in `layout.tsx` and used `useRouteLoaderData` to fetch loader data client-side, causing a "Loading..." flash. This refactor moves the panel into the edit route's component where it belongs, uses loader data as component props (SSR-first), and uses `Form` + `redirect` for the bind action.

---

## Problems Fixed

1. **Panel in wrong place** — `GroupEditPanel` lived in `layout.tsx`, should be in the edit route component
2. **Client-side fetch pattern** — `useRouteLoaderData` on a route with no component fetched data client-side after render
3. **Wrong submit pattern** — `useFetcher.submit` for bind action instead of `Form` + `redirect`
4. **File organization** — components nested in `components/` subfolder inside the route folder; `group-edit-panel.tsx` lived in `app/components/` instead of the edit route

---

## Route Structure

```
layout.tsx
└── <Outlet />                           (renders dashboard OR edit route)

dashboard/route.tsx
└── Dashboard component                   (unchanged)

dashboard/group/:groupId/edit/route.tsx   ← NEW: has default component
└── GroupEditPanel (merged into route.tsx)
    ├── MemberListTab
    └── BindFormTab
```

The panel is rendered by the edit route's default component, not by the layout. Data flows from loader → component props (SSR), not via `useRouteLoaderData`.

---

## File Organization

**Before:**
```
app/
  components/
    slide-over-panel.tsx
    confirm-dialog.tsx
    group-edit-panel.tsx              ← route-specific, should not be here
  routes/
    dashboard/
      route.tsx
      group/
        edit/
          route.tsx                  (loader + action only, no component)
          components/
            member-list.tsx          (nested one level too deep)
            bind-form.tsx            (nested one level too deep)
```

**After:**
```
app/
  components/
    slide-over-panel.tsx              (reusable)
    confirm-dialog.tsx                 (reusable)
  routes/
    dashboard/
      route.tsx
      group/
        edit/
          route.tsx                  (loader + action + panel component)
          member-list.tsx            (moved up)
          bind-form.tsx              (moved up)
```

Deleted: `app/routes/dashboard/group/edit/components/` folder

---

## `route.tsx` Exports

```typescript
// 1. loader — unchanged from current implementation
export async function loader({ params, context }: Route.LoaderArgs) {
  // Returns: { group, boundUsers, unboundMembers }
}

// 2. action — unchanged except bind returns redirect()
export async function action({ request, params, context }: Route.ActionArgs) {
  if (parsed.intent === "bind") {
    await PlayerService.bind(parsed.userId, parsed.steamId);
    await GroupService.bindPlayerToGroup(parsed.userId, groupId);
    return redirect("/dashboard");  // ← Not { success: true }
  }
  // lookup: returns { preview, intent }
  // unbind: returns { success: true, intent }
}

// 3. default component — the entire panel rendered here
export default function GroupEditRoute({ loaderData }: Route.ComponentProps) {
  return (
    <SlideOverPanel title={loaderData.group.groupName} onClose={() => navigate("/dashboard")}>
      <Tabs>
        <MemberListTab ... />
        <BindFormTab ... />
      </Tabs>
    </SlideOverPanel>
  );
}
```

---

## Data Flow

| Operation | Pattern | Why |
|-----------|---------|-----|
| Initial load | Loader → `loaderData` prop (SSR) | No client fetch, data available on first render |
| `lookup` intent | `useFetcher.submit` | No navigation needed, reads from `fetcher.data` |
| `bind` intent | `<Form>` + `redirect("/dashboard")` | Success requires navigation to dashboard |
| `unbind` intent | `useFetcher.submit` | No navigation needed, updates list in-place |

---

## `BindFormTab` Changes

**Before:**
```typescript
const bindFetcher = useFetcher();
const handleBind = () => {
  bindFetcher.submit({ intent: "bind", userId, steamId }, { action: `/dashboard/group/${groupId}/edit` });
};
useEffect(() => {
  if (bindFetcher.data?.success) onClose();
}, [bindFetcher.data]);
```

**After:**
```typescript
// No bindFetcher needed
// onClose is still passed as prop but NOT called imperatively after bind
// Instead: action returns redirect("/dashboard") and React Router navigates

const lookupFetcher = useFetcher({ key: "lookup" });
const handlePreview = () => {
  lookupFetcher.submit({ intent: "lookup", steamId }, { method: "post", action: `/dashboard/group/${groupId}/edit` });
};
```

---

## `MemberListTab` Changes

**Before:**
```typescript
const unbindFetcher = useFetcher();
```

**After:** No change — `unbind` correctly uses `useFetcher` since it doesn't navigate.

---

## `layout.tsx` Changes

Remove the panel rendering and `params.groupId` check:

```typescript
// BEFORE (with panel in layout)
export default function Layout({ loaderData }: Route.ComponentProps) {
  const params = useParams();
  const showEditPanel = Boolean(params.groupId);
  return (
    <div>
      <Outlet />
      {showEditPanel && <GroupEditPanel onClose={() => navigate("/dashboard")} />}
    </div>
  );
}

// AFTER (layout just renders outlet)
export default function Layout({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <NavBar user={loaderData.user} />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

---

## Error Handling

- **Loader 403/404** — `throw data(..., { status: 403/404 })` → React Router error boundary
- **Action validation errors** — `{ error: string, intent }` returned, displayed inline
- **lookup not found** — `{ error: "...", intent: "lookup" }` returned
- **bind/unbind success** — bind returns `redirect("/dashboard")`, unbind returns `{ success: true, intent: "unbind" }`

No new error handling infrastructure needed — existing patterns are preserved.

---

## Implementation Steps

1. Move `member-list.tsx` and `bind-form.tsx` up from `components/` subfolder
2. Merge `group-edit-panel.tsx` contents into `route.tsx` as the default export
3. Delete `app/routes/dashboard/group/edit/components/` folder
4. Remove `GroupEditPanel` import and panel rendering from `layout.tsx`
5. Remove `useRouteLoaderData` and `params`/`navigate`/`showEditPanel` from `layout.tsx`
6. Change `BindFormTab` — remove `useFetcher` for bind, use `Form` component
7. Change action — `bind` intent returns `redirect("/dashboard")` instead of `{ success: true }`
8. Delete `app/components/group-edit-panel.tsx`
