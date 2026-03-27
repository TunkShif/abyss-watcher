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
          <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {summary.playerId}</div>
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
