import { useState, useEffect, type FC } from "react";
import { useFetcher, Form } from "react-router";
import { Search, UserPlus } from "lucide-react";
import { SteamPreviewCard } from "~/components/steam-preview-card";
import type { GroupMemberInfo } from "~/lib/clients/onebot/models";
import type { PlayerSummary } from "~/lib/modules/player/models";

interface BindFormTabProps {
  unboundMembers: GroupMemberInfo[];
  groupId: string;
}

export const BindFormTab: FC<BindFormTabProps> = ({ unboundMembers, groupId }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [steamId, setSteamId] = useState<string>("");
  const [previewData, setPreviewData] = useState<PlayerSummary | null>(null);

  const lookupFetcher = useFetcher();

  const lookupResult = lookupFetcher.data as { preview?: PlayerSummary; error?: string } | undefined;

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
    lookupFetcher.submit(
      { intent: "lookup", steamId: steamId.trim() },
      { method: "post", action: `/dashboard/group/${groupId}/edit` },
    );
  };

  const isLookingUp = lookupFetcher.state !== "idle";

  return (
    <div className="space-y-6">
      {/* Member Select */}
      <div>
        <label htmlFor="qq-user-select" className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">
          Select QQ User
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            id="qq-user-select"
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
        <label htmlFor="steam-id-input" className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">
          Steam ID (64-bit)
        </label>
        <input
          id="steam-id-input"
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
      {lookupResult?.error && (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
          {lookupResult?.error}
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

      {/* Bind Form */}
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
    </div>
  );
};
