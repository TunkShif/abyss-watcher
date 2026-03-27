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
          <MemberListTab data={data} groupId={data.group.groupId} />
        ) : (
          <BindFormTab data={data} />
        )}
      </div>
    </SlideOverPanel>
  );
};
