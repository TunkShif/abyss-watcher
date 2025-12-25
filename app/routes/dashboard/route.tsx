import { Edit2, LinkIcon, Save, Settings, X } from "lucide-react";
import { type FC, useState } from "react";
import type { Group } from "~/lib/clients/onebot/models";
import type { Route } from "./+types/route";

export async function loader({ context: { app } }: Route.LoaderArgs) {
  // fetch all groups(binded users (user stats))
}

export default function Dashboard() {
  const stats = {
    online: 4,
    inGame: 2,
    total: 6,
  };

  const users = MOCK_USERS;
  const filteredGroups = MOCK_GROUPS;

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
            <div key={group.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-baseline gap-4 mb-4 border-b border-white/5 pb-2">
                <h2 className="text-xl font-bold text-slate-200">{group.name}</h2>
                <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">{group.description}</span>
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-xs text-slate-600 bg-abyss-900 px-2 py-1 rounded-full">
                    {group.userIds.length} members
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
                {group.userIds.map((userId) => (
                  <UserCard key={userId} user={users[userId]} onUpdateSteamId={() => {}} />
                ))}
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

const GroupsGrid: FC<{ groups: Group[] }> = ({ groups }) => {
  if (groups.length === 0)
    return (
      <div className="text-center py-20 text-slate-600">
        <p>No entities found in the void.</p>
      </div>
    );
  return groups.map((group) => <GroupItem key={group.group_id} group={group} />);
};

// Group {
// all memeber
// binded member {
// status
// }
// }

const GroupItem: FC<{ group: Group }> = ({ group }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-baseline gap-4 mb-4 border-b border-white/5 pb-2">
        <h2 className="text-xl font-bold text-slate-200">{group.group_name}</h2>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-600 bg-abyss-900 px-2 py-1 rounded-full">
            {group.member_count} members
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
        {group.userIds.map((userId) => (
          <UserCard key={userId} user={users[userId]} onUpdateSteamId={() => {}} />
        ))}
      </div>
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
                <LinkIcon className="w-3 h-3" /> ID BOUND
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

const MOCK_GROUPS = [
  {
    id: "g1",
    name: "Raid Team Alpha",
    description: "Core raiding group for MMOs",
    userIds: ["u1", "u4", "u6"],
  },
  {
    id: "g2",
    name: "Late Night Crew",
    description: "Casual games after midnight",
    userIds: ["u2", "u3", "u5", "u7"],
  },
  {
    id: "g3",
    name: "AFK Legends",
    description: "People who are never online",
    userIds: ["u8"],
  },
];

const MOCK_ACTIVITY_DATA = [
  { time: "00:00", onlineCount: 2, inGameCount: 1 },
  { time: "04:00", onlineCount: 1, inGameCount: 0 },
  { time: "08:00", onlineCount: 3, inGameCount: 1 },
  { time: "12:00", onlineCount: 5, inGameCount: 2 },
  { time: "16:00", onlineCount: 6, inGameCount: 4 },
  { time: "20:00", onlineCount: 7, inGameCount: 5 },
  { time: "24:00", onlineCount: 4, inGameCount: 3 },
];

const MOCK_USERS: Record<string, SteamUser> = {
  u1: {
    id: "u1",
    name: "VoidWalker",
    avatarUrl: "https://picsum.photos/100/100?random=1",
    status: UserStatus.IN_GAME,
    gameName: "Elden Ring",
    steamId: "76561198000000001",
  },
  u2: {
    id: "u2",
    name: "Solaris",
    avatarUrl: "https://picsum.photos/100/100?random=2",
    status: UserStatus.ONLINE,
    steamId: "76561198000000002",
  },
  u3: {
    id: "u3",
    name: "NullPointer",
    avatarUrl: "https://picsum.photos/100/100?random=3",
    status: UserStatus.OFFLINE,
    lastOnline: "2 hours ago",
    steamId: "76561198000000003",
  },
  u4: {
    id: "u4",
    name: "AzureKnight",
    avatarUrl: "https://picsum.photos/100/100?random=4",
    status: UserStatus.IN_GAME,
    gameName: "Counter-Strike 2",
  },
  u5: {
    id: "u5",
    name: "PixelMage",
    avatarUrl: "https://picsum.photos/100/100?random=5",
    status: UserStatus.AWAY,
  },
  u6: {
    id: "u6",
    name: "ShadowBlade",
    avatarUrl: "https://picsum.photos/100/100?random=6",
    status: UserStatus.IN_GAME,
    gameName: "Baldur's Gate 3",
  },
  u7: {
    id: "u7",
    name: "Glitch",
    avatarUrl: "https://picsum.photos/100/100?random=7",
    status: UserStatus.BUSY,
  },
  u8: {
    id: "u8",
    name: "Echo",
    avatarUrl: "https://picsum.photos/100/100?random=8",
    status: UserStatus.OFFLINE,
    lastOnline: "5 days ago",
  },
};
