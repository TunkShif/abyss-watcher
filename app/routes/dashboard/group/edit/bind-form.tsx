import { useState, useRef, useEffect, type FC } from "react";
import { useFetcher, Form } from "react-router";
import { Search, UserPlus } from "lucide-react";
import { SteamPreviewCard } from "~/components/steam-preview-card";
import { avatarUrl } from "~/lib/utils/avatar";
import type { GroupMemberInfo } from "~/lib/clients/onebot/models";
import type { PlayerSummary } from "~/lib/modules/player/models";

interface BindFormTabProps {
  unboundMembers: GroupMemberInfo[];
  groupId: string;
}

export const BindFormTab: FC<BindFormTabProps> = ({ unboundMembers, groupId }) => {
  const [memberSearch, setMemberSearch] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [steamId, setSteamId] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const lookupFetcher = useFetcher();
  const lookupResult = lookupFetcher.data as { preview?: PlayerSummary; error?: string } | undefined;

  const filteredMembers = memberSearch.trim()
    ? unboundMembers.filter(
        (m) =>
          (m.card || m.nickname).toLowerCase().includes(memberSearch.toLowerCase()) ||
          m.user_id.toString().includes(memberSearch),
      )
    : unboundMembers;

  const selectedMember = unboundMembers.find((m) => m.user_id.toString() === selectedUserId);
  const preview = lookupResult?.preview;

  const handlePreview = () => {
    if (!steamId.trim()) return;
    lookupFetcher.submit(
      { intent: "lookup", steamId: steamId.trim() },
      { method: "post", action: `/dashboard/group/${groupId}/edit` },
    );
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectMember = (userId: string) => {
    setSelectedUserId(userId);
    setMemberSearch("");
    setDropdownOpen(false);
    setFocusedIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, filteredMembers.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      selectMember(filteredMembers[focusedIndex].user_id.toString());
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
      setFocusedIndex(-1);
    }
  };

  const isLookingUp = lookupFetcher.state !== "idle";

  return (
    <div className="space-y-6">
      {/* Member Select — Combobox */}
      <div>
        <label
          htmlFor="qq-user-combobox"
          className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider"
        >
          Select QQ User
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            ref={inputRef}
            id="qq-user-combobox"
            type="text"
            value={memberSearch}
            onChange={(e) => {
              setMemberSearch(e.target.value);
              setDropdownOpen(true);
              setFocusedIndex(-1);
            }}
            onFocus={() => setDropdownOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search by name or ID..."
            className="w-full bg-abyss-950 border border-slate-700 rounded-lg py-2.5 pl-9 pr-4 text-slate-200 focus:outline-none focus:border-neon-blue transition-colors duration-200"
          />

          {/* Selected member badge */}
          {selectedMember && !dropdownOpen && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-6 h-6 rounded-full bg-slate-600 overflow-hidden">
                <img
                  src={avatarUrl("user", selectedMember.user_id, 40)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-neon-blue text-sm">{selectedMember.card || selectedMember.nickname}</span>
              <button
                type="button"
                onClick={() => setSelectedUserId("")}
                className="text-slate-500 hover:text-white transition-colors duration-200"
              >
                ×
              </button>
            </div>
          )}

          {/* Dropdown */}
          {dropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute z-10 w-full mt-1 bg-abyss-900 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
            >
              {filteredMembers.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500">No members found</div>
              ) : (
                filteredMembers.map((member, index) => (
                  <button
                    key={member.user_id}
                    type="button"
                    onClick={() => selectMember(member.user_id.toString())}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 ${
                      index === focusedIndex ? "bg-abyss-700 text-white" : "text-slate-300 hover:bg-abyss-800"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-600 overflow-hidden flex-shrink-0">
                      <img src={avatarUrl("user", member.user_id, 40)} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="flex-1 min-w-0">
                      <span className="text-left font-medium truncate block">{member.card || member.nickname}</span>
                    </span>
                    <span className="text-slate-500 font-mono text-xs flex-shrink-0">{member.user_id}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {selectedMember && (
          <p className="mt-2 text-sm text-slate-400">
            Selected: <span className="text-neon-blue">{selectedMember.card || selectedMember.nickname}</span>
          </p>
        )}
      </div>

      {/* Steam ID Input */}
      <div>
        <label
          htmlFor="steam-id-input"
          className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider"
        >
          Steam ID (64-bit)
        </label>
        <input
          id="steam-id-input"
          type="text"
          value={steamId}
          onChange={(e) => setSteamId(e.target.value)}
          placeholder="e.g. 76561198012345678"
          className="w-full bg-abyss-950 border border-slate-700 rounded-lg py-2.5 px-4 text-slate-200 font-mono focus:outline-none focus:border-neon-blue transition-colors duration-200"
        />
      </div>

      {/* Error Messages */}
      {lookupResult?.error && (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 animate-in fade-in duration-200">
          {lookupResult.error}
        </div>
      )}

      {/* Preview Card */}
      {preview ? (
        <div className="space-y-4">
          <SteamPreviewCard summary={preview} />
          <button
            type="button"
            onClick={handlePreview}
            disabled={isLookingUp || !steamId.trim()}
            className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors duration-200"
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
          if (!selectedUserId || !steamId.trim() || !preview) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="intent" value="bind" />
        <input type="hidden" name="userId" value={selectedUserId} />
        <input type="hidden" name="steamId" value={steamId} />
        <button
          type="submit"
          disabled={!selectedUserId || !steamId.trim() || !preview}
          className="w-full flex items-center justify-center gap-2 bg-neon-blue hover:bg-neon-blue/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
        >
          <UserPlus className="w-4 h-4" />
          Bind Player
        </button>
      </Form>
    </div>
  );
};
