import { Edit2, LinkIcon, Save, Settings, X } from "lucide-react";
import { type FC, useState } from "react";
import { StatsService } from "~/lib/modules/stats";
import type { Route } from "./+types/route";

export async function loader(_: Route.LoaderArgs) {
  const groups = await StatsService.getGroupStats();

  return { groups };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { groups } = loaderData;

  const totalPlayers = groups.reduce((acc, g) => acc + g.boundUsers.length, 0);
  const inGamePlayers = groups.reduce((acc, g) => acc + g.boundUsers.filter((p) => p.summary.gameextrainfo).length, 0);
  const onlinePlayers = groups.reduce(
    (acc, g) => acc + g.boundUsers.filter((p) => p.summary.personastate !== 0).length,
    0,
  );

  const stats = {
    online: onlinePlayers,
    inGame: inGamePlayers,
    total: totalPlayers,
  };

  const filteredGroups = groups;

  return (
    <>
      {/* Stats & Actions Row */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <OnlineStatCard online={stats.online} total={stats.total} />
        <InGameStatCard inGame={stats.inGame} />
      </section>

      {/* Groups Grid */}
      <section className="space-y-6">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-20 text-slate-600">
            <p>No entities found in the void matching your query.</p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.groupId} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-baseline gap-4 mb-4 border-b border-white/5 pb-2">
                <h2 className="text-xl font-bold text-slate-200">{group.groupName}</h2>
                <span className="text-xs text-slate-500 font-mono uppercase tracking-widest leading-none">
                  {group.groupId}
                </span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.boundUsers.map((player) => {
                  const steam = player.summary;
                  const status = steam.gameextrainfo
                    ? UserStatus.IN_GAME
                    : steam.personastate === 1
                      ? UserStatus.ONLINE
                      : steam.personastate === 2
                        ? UserStatus.BUSY
                        : steam.personastate === 3 || steam.personastate === 4
                          ? UserStatus.AWAY
                          : UserStatus.OFFLINE;

                  const user: SteamUser = {
                    id: player.userId,
                    name: player.userName,
                    avatarUrl: steam.avatarfull,
                    status,
                    gameName: steam.gameextrainfo,
                    steamId: steam.steamid,
                  };

                  return <UserCard key={player.userId} user={user} onUpdateSteamId={() => {}} />;
                })}
              </div>
            </div>
          ))
        )}
      </section>
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

enum UserStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  IN_GAME = "IN_GAME",
  AWAY = "AWAY",
  BUSY = "BUSY",
}

interface SteamUser {
  id: string;
  name: string;
  avatarUrl: string;
  status: UserStatus;
  gameName?: string;
  lastOnline?: string;
  steamId?: string; // Bound Steam ID
}

interface UserCardProps {
  user: SteamUser;
  onUpdateSteamId: (userId: string, newSteamId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onUpdateSteamId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [steamIdInput, setSteamIdInput] = useState(user.steamId || "");

  const handleSave = () => {
    onUpdateSteamId(user.id, steamIdInput);
    setIsEditing(false);
  };

  return (
    <div className="group relative bg-abyss-800/50 hover:bg-abyss-800 border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all duration-300 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        {/* Avatar Area */}
        <div className="relative">
          <div
            className={`w-12 h-12 rounded-full overflow-hidden border-2 ${
              user.status === UserStatus.ONLINE || user.status === UserStatus.IN_GAME
                ? "border-neon-blue shadow-[0_0_10px_rgba(14,165,233,0.3)]"
                : "border-slate-600 grayscale"
            }`}
          >
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          </div>
          {/* Status Indicator Dot */}
          <div
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-abyss-900 ${
              user.status === UserStatus.ONLINE
                ? "bg-neon-blue"
                : user.status === UserStatus.IN_GAME
                  ? "bg-neon-green"
                  : user.status === UserStatus.AWAY
                    ? "bg-yellow-500"
                    : user.status === UserStatus.BUSY
                      ? "bg-red-500"
                      : "bg-slate-500"
            }`}
          ></div>
        </div>

        {/* Info Area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-slate-100 truncate">{user.name}</h3>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-neon-cyan p-1"
                title="Bind Steam ID"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="mb-2">
            <StatusBadge status={user.status} gameName={user.gameName} />
          </div>

          {/* Steam ID Binding / Display */}
          <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
            {isEditing ? (
              <div className="flex items-center gap-1 w-full animate-in fade-in slide-in-from-left-2">
                <input
                  type="text"
                  value={steamIdInput}
                  onChange={(e) => setSteamIdInput(e.target.value)}
                  placeholder="Enter SteamID64..."
                  className="bg-abyss-950 border border-slate-700 rounded px-2 py-1 w-full text-slate-200 focus:border-neon-blue focus:outline-none"
                />
                <button type="button" onClick={handleSave} className="text-green-500 hover:text-green-400 p-1">
                  <Save className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-red-500 hover:text-red-400 p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : user.steamId ? (
              <span
                className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity cursor-help"
                title={`ID: ${user.steamId}`}
              >
                <LinkIcon className="w-3 h-3" /> ID BOUND {user.steamId}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-600">
                <LinkIcon className="w-3 h-3" /> NO ID
              </span>
            )}
            {!isEditing && user.lastOnline && user.status === UserStatus.OFFLINE && (
              <span className="ml-auto text-slate-600 truncate">Last: {user.lastOnline}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatusBadgeProps {
  status: UserStatus;
  gameName?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, gameName }) => {
  const getStatusStyle = () => {
    switch (status) {
      case UserStatus.ONLINE:
        return "bg-neon-blue/20 text-neon-blue border-neon-blue/50";
      case UserStatus.IN_GAME:
        return "bg-neon-green/20 text-neon-green border-neon-green/50";
      case UserStatus.AWAY:
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
      case UserStatus.BUSY:
        return "bg-red-500/20 text-red-500 border-red-500/50";
      case UserStatus.OFFLINE:
      default:
        return "bg-slate-700/20 text-slate-500 border-slate-700/50";
    }
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-medium ${getStatusStyle()}`}
    >
      <span className={`relative flex h-2 w-2`}>
        {status !== UserStatus.OFFLINE && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              status === UserStatus.IN_GAME ? "bg-neon-green" : "bg-current"
            }`}
          ></span>
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            status === UserStatus.OFFLINE ? "bg-slate-500" : "bg-current"
          }`}
        ></span>
      </span>
      <span>
        {status === UserStatus.IN_GAME ? <span className="truncate max-w-37.5">Playing {gameName}</span> : status}
      </span>
    </div>
  );
};
