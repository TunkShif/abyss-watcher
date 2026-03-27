import { useState, type FC } from "react";
import { useFetcher } from "react-router";
import { ConfirmDialog } from "~/components/confirm-dialog";
import type { BoundUser } from "~/lib/modules/group/models";
import type { GroupMemberInfo } from "~/lib/clients/onebot/models";

interface MemberListTabProps {
  boundUsers: BoundUser[];
  unboundMembers: GroupMemberInfo[];
  groupId: string;
}

export const MemberListTab: FC<MemberListTabProps> = ({ boundUsers, unboundMembers, groupId }) => {
  const [confirmUnbind, setConfirmUnbind] = useState<{ userId: string; userName: string } | null>(null);
  const unbindFetcher = useFetcher();

  const handleUnbind = (userId: string, userName: string) => {
    setConfirmUnbind({ userId, userName });
  };

  const confirmUnbindAction = () => {
    if (!confirmUnbind) return;
    unbindFetcher.submit(
      { intent: "unbind", userId: confirmUnbind.userId, groupId },
      { method: "post", action: `/dashboard/group/${groupId}/edit` },
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
            {boundUsers.map((user: BoundUser) => (
              <div
                key={user.userId}
                className="flex items-center gap-3 bg-abyss-800/50 border border-white/5 rounded-lg p-3 hover:bg-abyss-800/70 transition-colors duration-200"
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
                  onClick={() => handleUnbind(user.userId.toString(), user.userName)}
                  className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded transition-colors duration-200"
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
                className="flex items-center gap-3 bg-abyss-800/30 border border-white/5 rounded-lg p-3 opacity-60 hover:opacity-80 transition-opacity duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-300 truncate">{member.card || member.nickname}</div>
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
