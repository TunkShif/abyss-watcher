import { LinkIcon, Settings } from "lucide-react";
import type { FC } from "react";
import { SteamPersonaState } from "~/lib/clients/steam/models";
import { GroupService } from "~/lib/modules/group";
import { PlayerService } from "~/lib/modules/player";
import type { PlayerSummary } from "~/lib/modules/player/models";
import type { Route } from "./+types/route";

export async function loader() {
  // Parallelize initial independent fetches
  const [players, allGroups] = await Promise.all([PlayerService.list(), GroupService.listGroups()]);

  const playerIds = players.map((p) => p.playerId);

  // Parallelize dependent fetches
  const [summaries, playerGroups] = await Promise.all([
    PlayerService.fetchLatestSummaries(playerIds),
    GroupService.listPlayerGroupIds(playerIds),
  ]);

  // Aggregate stats in a single pass
  const stats = summaries.reduce(
    (acc, s) => {
      acc.total++;
      if (s.state !== SteamPersonaState.Offline) acc.online++;
      if (s.gameId) acc.ingame++;
      return acc;
    },
    { online: 0, ingame: 0, total: 0 },
  );

  // efficient mapping
  const summaryMap = new Map(summaries.map((s) => [s.playerId, s]));
  const playerInfoMap = new Map(players.map((p) => [p.playerId, p]));
  const groupPlayers = new Map<string, Array<{ userId: string; userName: string; summary: PlayerSummary }>>();

  // Map players to groups
  for (const [playerId, groupIds] of Object.entries(playerGroups)) {
    const summary = summaryMap.get(playerId);
    const playerInfo = playerInfoMap.get(playerId);

    if (!summary || !playerInfo) continue;

    const enrichedPlayer = {
      userId: playerInfo.userId,
      userName: summary.name, // Use Steam Persona Name
      summary,
    };

    for (const groupId of groupIds) {
      if (!groupPlayers.has(groupId)) {
        groupPlayers.set(groupId, []);
      }
      groupPlayers.get(groupId)?.push(enrichedPlayer);
    }
  }

  // Construct final response with correct shape
  const groupsWithPlayers = allGroups.map((g) => ({
    groupId: g.group_id.toString(),
    groupName: g.group_name,
    memberCount: g.member_count,
    players: groupPlayers.get(g.group_id.toString()) || [],
  }));

  return {
    stats,
    groups: groupsWithPlayers,
  };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { stats, groups } = loaderData;

  return (
    <>
      {/* Stats & Actions Row */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <OnlineStatCard online={stats.online} total={stats.total} />
        <InGameStatCard inGame={stats.ingame} />
      </section>

      {/* Groups Grid */}
      <GroupSection groups={groups} />
    </>
  );
}

const OnlineStatCard: FC<{ online: number; total: number }> = ({ online, total }) => {
  return (
    <div className="bg-abyss-900/50 border border-white/5 rounded-2xl p-5 flex flex-col justify-between h-32 hover:border-neon-blue/30 transition-colors">
      <div className="text-slate-500 text-sm font-medium flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse"></div> ONLINE ENTITIES
      </div>
      <div className="text-4xl font-mono font-bold text-white">
        {online} <span className="text-lg text-slate-600 font-sans">/ {total}</span>
      </div>
    </div>
  );
};

const InGameStatCard: FC<{ inGame: number }> = ({ inGame }) => {
  return (
    <div className="bg-abyss-900/50 border border-white/5 rounded-2xl p-5 flex flex-col justify-between h-32 hover:border-neon-green/30 transition-colors">
      <div className="text-slate-500 text-sm font-medium flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-neon-green"></div> ACTIVE IN-GAME
      </div>
      <div className="text-4xl font-mono font-bold text-white">{inGame}</div>
    </div>
  );
};

interface EnrichedPlayer {
  userId: string;
  userName: string;
  summary: PlayerSummary;
}

interface GroupWithPlayers {
  groupId: string;
  groupName: string;
  memberCount: number;
  players: EnrichedPlayer[];
}

const GroupSection: FC<{ groups: GroupWithPlayers[] }> = ({ groups }) => {
  return (
    <section className="space-y-6">
      {groups.length === 0 ? (
        <div className="text-center py-20 text-slate-600">
          <p>No entities found in the void matching your query.</p>
        </div>
      ) : (
        groups.map((group) => <GroupCard key={group.groupId} group={group} />)
      )}
    </section>
  );
};

const GroupCard: FC<{ group: GroupWithPlayers }> = ({ group }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-baseline gap-4 mb-4 border-b border-white/5 pb-2">
        <h2 className="text-xl font-bold text-slate-200">{group.groupName}</h2>
        <span className="text-xs text-slate-500 font-mono uppercase tracking-widest leading-none">{group.groupId}</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-600 bg-abyss-900 px-2 py-1 rounded-full">
            {group.memberCount} members
          </span>
          <button
            type="button"
            className="p-1.5 text-slate-500 hover:text-neon-blue hover:bg-neon-blue/10 rounded-md transition-all"
            title="Manage Group"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {group.players.length === 0 ? (
        <div className="py-12 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-slate-500 bg-abyss-900/30">
          <span className="text-sm">The void is silent here.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {group.players.map((player) => (
            <UserCard key={player.userId} user={player} />
          ))}
        </div>
      )}
    </div>
  );
};

interface UserCardProps {
  user: EnrichedPlayer;
}

const getUserStatusColor = (summary: PlayerSummary) => {
  if (summary.gameId) return "bg-neon-green";
  switch (summary.state) {
    case SteamPersonaState.Online:
      return "bg-neon-blue";
    case SteamPersonaState.Away:
    case SteamPersonaState.Snooze:
      return "bg-yellow-500";
    case SteamPersonaState.Busy:
      return "bg-red-500";
    default:
      return "bg-slate-500";
  }
};

const getUserBorderStyle = (summary: PlayerSummary) => {
  if (summary.gameId) return "border-neon-green shadow-[0_0_10px_rgba(74,222,128,0.3)]";
  if (summary.state === SteamPersonaState.Online) return "border-neon-blue shadow-[0_0_10px_rgba(14,165,233,0.3)]";
  return "border-slate-600 grayscale";
};

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const { summary } = user;

  return (
    <div className="group relative bg-abyss-800/50 hover:bg-abyss-800 border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all duration-300 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        {/* Avatar Area */}
        <div className="relative">
          <div
            className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-colors ${getUserBorderStyle(summary)}`}
          >
            <img src={summary.avatarUrl} alt={summary.name} className="w-full h-full object-cover" />
          </div>
          {/* Status Indicator Dot */}
          <div
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-abyss-900 ${getUserStatusColor(
              summary,
            )}`}
          />
        </div>

        {/* Info Area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-slate-100 truncate">{user.userName}</h3>
          </div>

          <div className="mb-2">
            <StatusBadge state={summary.state} gameName={summary.gamePlaying} />
          </div>

          {/* Steam ID Binding / Display */}
          <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
            <span
              className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity cursor-help"
              title={`ID: ${summary.playerId}`}
            >
              <LinkIcon className="w-3 h-3" /> ID BOUND {summary.playerId}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatusBadgeProps {
  state: SteamPersonaState;
  gameName?: string;
}

const getStatusStyle = (state: SteamPersonaState, isIngame: boolean) => {
  if (isIngame) return "bg-neon-green/20 text-neon-green border-neon-green/50";
  switch (state) {
    case SteamPersonaState.Online:
      return "bg-neon-blue/20 text-neon-blue border-neon-blue/50";
    case SteamPersonaState.Away:
    case SteamPersonaState.Snooze:
      return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
    case SteamPersonaState.Busy:
      return "bg-red-500/20 text-red-500 border-red-500/50";
    default:
      return "bg-slate-700/20 text-slate-500 border-slate-700/50";
  }
};

const getStatusText = (state: SteamPersonaState, gameName?: string) => {
  if (gameName) return `Playing ${gameName}`;
  return SteamPersonaState[state] || "Offline";
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ state, gameName }) => {
  const isIngame = !!gameName;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-medium ${getStatusStyle(
        state,
        isIngame,
      )}`}
    >
      <span className={`relative flex h-2 w-2`}>
        {state !== SteamPersonaState.Offline && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isIngame ? "bg-neon-green" : "bg-current"
            }`}
          ></span>
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            state === SteamPersonaState.Offline ? "bg-slate-500" : "bg-current"
          }`}
        ></span>
      </span>
      <span className="truncate max-w-37.5">{getStatusText(state, gameName)}</span>
    </div>
  );
};
