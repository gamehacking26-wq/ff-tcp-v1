import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Gamepad2,
  Image as ImageIcon,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Shirt,
  Sparkles,
  Swords,
  UserRound,
  UsersRound,
  X,
  Zap,
} from "lucide-react";

type JsonRecord = Record<string, unknown>;
type Workspace = "intel" | "outfit";
type IntelMode = "info" | "stats" | "search";

type AuthUser = {
  username: string;
  subscription?: string;
  expiry?: number;
};

type KeyAuthResponse = {
  success?: boolean;
  message?: string;
  sessionid?: string;
  info?: {
    username?: string;
    subscriptions?: Array<{ subscription?: string; expiry?: number }>;
  };
};

type IntelResult = {
  mode: IntelMode;
  payload: unknown;
  banStatus?: unknown;
  uid?: string;
  region: string;
};

const KEYAUTH_ENDPOINT = "https://keyauth.win/api/1.3/";
const KEYAUTH_APP = {
  name: "FAISAL 1",
  ownerid: "vkxjxEMf9r",
  version: "1.0",
};

const FF_API = "https://ff-multipurpose-api.onrender.com";
const FF_API_KEY = "codespecter";
const REGIONS = ["IND", "PK", "BD", "SG", "BR", "US", "TH", "VN", "ID", "RU", "ME"];

let keyAuthSessionPromise: Promise<string> | null = null;

function asRecord(value: unknown): JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function readValue(record: JsonRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
      return record[key];
    }
  }
  return undefined;
}

function getMessage(payload: unknown, fallback: string) {
  const record = asRecord(payload);
  return String(readValue(record, "message", "error", "detail") ?? fallback);
}

function formatNumber(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value === undefined || value === null ? "--" : String(value);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(numeric);
}

function formatDate(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "Not available";
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(numeric * 1000));
}

function formatLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function getDeviceId() {
  const storageKey = "faisal-one-device";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;
  const generated = `web-${crypto.randomUUID()}-${Date.now().toString(36)}`;
  window.localStorage.setItem(storageKey, generated);
  return generated;
}

async function keyAuthRequest(data: Record<string, string>) {
  const response = await fetch(KEYAUTH_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(data).toString(),
  });

  if (!response.ok) throw new Error(`Secure service returned ${response.status}.`);
  return (await response.json()) as KeyAuthResponse;
}

function initializeKeyAuth() {
  if (!keyAuthSessionPromise) {
    keyAuthSessionPromise = keyAuthRequest({
      type: "init",
      name: KEYAUTH_APP.name,
      ownerid: KEYAUTH_APP.ownerid,
      version: KEYAUTH_APP.version,
    }).then((response) => {
      if (!response.success || !response.sessionid) {
        throw new Error(response.message || "Secure access could not be initialized.");
      }
      return response.sessionid;
    });
    keyAuthSessionPromise.catch(() => {
      keyAuthSessionPromise = null;
    });
  }
  return keyAuthSessionPromise;
}

async function authenticate(username: string, password: string, code?: string) {
  const sessionid = await initializeKeyAuth();
  const response = await keyAuthRequest({
    type: "login",
    name: KEYAUTH_APP.name,
    ownerid: KEYAUTH_APP.ownerid,
    sessionid,
    username,
    pass: password,
    hwid: getDeviceId(),
    ...(code ? { code } : {}),
  });

  if (!response.success) throw new Error(response.message || "Sign in failed. Check your details.");
  return {
    sessionid,
    user: {
      username: response.info?.username || username,
      subscription: response.info?.subscriptions?.[0]?.subscription,
      expiry: response.info?.subscriptions?.[0]?.expiry,
    } satisfies AuthUser,
  };
}

async function ffRequest(path: string, params: Record<string, string>) {
  const url = new URL(path, FF_API);
  Object.entries({ ...params, key: FF_API_KEY }).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  const response = await fetch(url.toString());
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) throw new Error(getMessage(payload, `Player service returned ${response.status}.`));
  const record = asRecord(payload);
  if (record.success === false) throw new Error(getMessage(payload, "The player request failed."));
  return payload;
}

function createFfUrl(path: string, params: Record<string, string>) {
  const url = new URL(path, FF_API);
  Object.entries({ ...params, key: FF_API_KEY }).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M32 3.5 55 12v17.2C55 44 45.7 55.3 32 60.5 18.3 55.3 9 44 9 29.2V12L32 3.5Z"
        fill="url(#mark-fill)"
      />
      <path d="M41.8 17H24.2L18 32.1h9.2L23.4 47l22.4-23.4H34.6L41.8 17Z" fill="#101113" />
      <path
        d="M32 3.5 55 12v17.2C55 44 45.7 55.3 32 60.5 18.3 55.3 9 44 9 29.2V12L32 3.5Z"
        stroke="rgba(255,255,255,.55)"
        strokeWidth="1.4"
      />
      <defs>
        <linearGradient id="mark-fill" x1="12" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFD36A" />
          <stop offset=".48" stopColor="#FF8A36" />
          <stop offset="1" stopColor="#FF4D2E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function LoginScreen({ onLogin }: { onLogin: (user: AuthUser, sessionid: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("Enter your username and password to continue.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const result = await authenticate(username.trim(), password, code.trim() || undefined);
      onLogin(result.user, result.sessionid);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to sign in.";
      if (message.toLowerCase().includes("2fa") || message.toLowerCase().includes("two factor")) {
        setNeedsCode(true);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell min-h-screen overflow-hidden bg-[#0d0f11] text-white">
      <div className="auth-noise" />
      <motion.div
        className="auth-glow auth-glow-one"
        animate={{ x: [0, 35, -10, 0], y: [0, -20, 15, 0], scale: [1, 1.14, 1.04, 1] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="auth-glow auth-glow-two"
        animate={{ x: [0, -20, 25, 0], y: [0, 25, -12, 0], scale: [1, 1.08, 1.16, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[1.15fr_.85fr]">
        <section className="relative flex min-h-[38vh] flex-col justify-between px-6 pb-10 pt-6 sm:px-10 lg:min-h-screen lg:px-16 lg:pb-16 lg:pt-10">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <BrandMark className="h-10 w-10" />
            <div>
              <div className="brand-wordmark text-lg font-black tracking-[0.16em]">FAISAL ONE</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/38">Player Suite</div>
            </div>
          </motion.div>

          <motion.div
            className="max-w-2xl py-10 lg:py-0"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-orange-300">
              <span className="h-px w-8 bg-orange-400" />
              Private player intelligence
            </div>
            <h1 className="auth-title max-w-xl text-5xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl lg:text-[5.5rem]">
              Know the player.
              <span className="block text-white/28">See the loadout.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/48 sm:text-lg">
              Search Free Fire profiles, inspect match data, and reveal equipped outfits from one focused workspace.
            </p>
          </motion.div>

          <div className="hidden items-center gap-4 text-xs text-white/34 lg:flex">
            <ShieldCheck className="h-4 w-4 text-orange-400" />
            <span>Protected member access</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>Version 1.0</span>
          </div>

          <motion.div
            className="absolute bottom-[13%] right-[8%] hidden h-40 w-40 items-center justify-center lg:flex"
            animate={{ rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            aria-hidden="true"
          >
            <div className="radar-ring absolute inset-0 rounded-full" />
            <div className="radar-ring absolute inset-7 rounded-full opacity-60" />
            <div className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_25px_#ff783d]" />
          </motion.div>
        </section>

        <section className="flex items-center border-t border-white/[0.07] bg-black/20 px-5 py-10 backdrop-blur-xl sm:px-10 lg:border-l lg:border-t-0 lg:px-14">
          <motion.div
            className="mx-auto w-full max-w-md"
            initial={{ opacity: 0, x: 26 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-9">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-300/20 bg-orange-400/10 text-orange-300">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <h2 className="text-3xl font-bold tracking-[-0.04em]">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-white/42">Sign in with your member credentials to enter the suite.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="field-label block">
                <span>Username</span>
                <div className="field-control mt-2">
                  <UserRound className="h-[18px] w-[18px] text-white/30" />
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Enter username"
                    autoComplete="username"
                    disabled={loading}
                  />
                </div>
              </label>

              <label className="field-label block">
                <span>Password</span>
                <div className="field-control mt-2">
                  <LockKeyhole className="h-[18px] w-[18px] text-white/30" />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="rounded-lg p-1 text-white/35 transition hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </label>

              <AnimatePresence initial={false}>
                {needsCode && (
                  <motion.label
                    className="field-label block"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <span>Authenticator code</span>
                    <div className="field-control mt-2">
                      <ShieldCheck className="h-[18px] w-[18px] text-white/30" />
                      <input
                        value={code}
                        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))}
                        placeholder="6-digit code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        disabled={loading}
                      />
                    </div>
                  </motion.label>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key={error}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-3 border-l-2 border-red-400 bg-red-400/[0.07] px-4 py-3 text-sm leading-5 text-red-200"
                    role="alert"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={loading}
                className="primary-button group mt-2 flex w-full items-center justify-between px-5 py-4 text-sm font-extrabold uppercase tracking-[0.13em] disabled:cursor-not-allowed disabled:opacity-60"
                whileTap={{ scale: 0.985 }}
              >
                <span>{loading ? "Verifying access" : "Enter workspace"}</span>
                {loading ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                )}
              </motion.button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/25 lg:hidden">
              <ShieldCheck className="h-3.5 w-3.5" />
              Protected access / v1.0
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0 py-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{label}</div>
      <div className="mt-1.5 truncate text-xl font-bold tracking-tight text-white">{formatNumber(value)}</div>
    </div>
  );
}

function EmptyResult({ mode }: { mode: IntelMode }) {
  const copy = {
    info: ["Player profile", "Enter a UID to reveal identity, rank, guild, and account data."],
    stats: ["Match statistics", "Choose a game mode and inspect career or ranked performance."],
    search: ["Player search", "Search by nickname to find the right player UID."],
  }[mode];

  return (
    <motion.div
      key={mode}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="empty-stage flex min-h-[330px] flex-col items-center justify-center px-6 text-center"
    >
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.025]">
        <div className="absolute inset-2 animate-[spin_12s_linear_infinite] rounded-full border border-dashed border-orange-400/25" />
        {mode === "info" && <UserRound className="h-7 w-7 text-orange-300" />}
        {mode === "stats" && <BarChart3 className="h-7 w-7 text-orange-300" />}
        {mode === "search" && <Search className="h-7 w-7 text-orange-300" />}
      </div>
      <h3 className="text-xl font-bold tracking-tight">{copy[0]}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-white/38">{copy[1]}</p>
    </motion.div>
  );
}

function InfoView({ result }: { result: IntelResult }) {
  const root = asRecord(result.payload);
  const account = asRecord(readValue(root, "AccountInfo", "accountInfo", "basicInfo"));
  const profile = asRecord(readValue(root, "AccountProfileInfo", "accountProfileInfo", "profileInfo"));
  const guild = asRecord(readValue(root, "GuildInfo", "guildInfo", "clanBasicInfo"));
  const ban = asRecord(result.banStatus);
  const uid = result.uid || String(readValue(account, "AccountID", "accountId", "uid") ?? "");
  const name = String(readValue(account, "AccountName", "nickname", "name") ?? "Unknown player");
  const region = String(readValue(account, "AccountRegion", "region") ?? result.region);
  const isBanned = ban.is_banned === true || String(ban.status || "").toUpperCase() === "BANNED";
  const bannerUrl = createFfUrl("/banner/profile", { uid });

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <div className="profile-visual relative min-h-[220px] overflow-hidden sm:min-h-[260px]">
        <img src={bannerUrl} alt={`${name} profile banner`} className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,14,16,.96)_0%,rgba(12,14,16,.68)_53%,rgba(12,14,16,.22)_100%)]" />
        <div className="relative flex min-h-[220px] flex-col justify-end p-6 sm:min-h-[260px] sm:p-8">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-300">
            <span className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_12px_#ff7a3d]" />
            Profile located
          </div>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <h3 className="max-w-xl break-words text-3xl font-black tracking-[-0.045em] sm:text-4xl">{name}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/48">
                <span>UID {uid}</span>
                <span className="h-1 w-1 rounded-full bg-white/25" />
                <span>{region} server</span>
              </div>
            </div>
            <div className={`status-flag ${isBanned ? "status-flag-danger" : "status-flag-safe"}`}>
              {isBanned ? <AlertCircle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              {isBanned ? "Banned" : "Clear status"}
            </div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-white/[0.07] px-2 sm:px-6">
        <div className="grid grid-cols-2 divide-x divide-white/[0.07] sm:grid-cols-4">
          <div className="px-4"><Metric label="Level" value={readValue(account, "AccountLevel", "level")} /></div>
          <div className="px-4"><Metric label="Likes" value={readValue(account, "AccountLikes", "liked", "likes")} /></div>
          <div className="px-4"><Metric label="BR points" value={readValue(profile, "BrRankPoint", "rankingPoints", "brRankPoint")} /></div>
          <div className="px-4"><Metric label="CS points" value={readValue(profile, "CsRankPoint", "csRankingPoints", "csRankPoint")} /></div>
        </div>
        <div className="grid gap-0 md:grid-cols-3 md:divide-x md:divide-white/[0.07]">
          <div className="px-4 py-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/45">
              <Swords className="h-4 w-4 text-orange-300" /> Rank profile
            </div>
            <p className="text-sm text-white/45">Best BR rank</p>
            <p className="mt-1 font-bold">{formatNumber(readValue(profile, "BrMaxRank", "maxRank"))}</p>
            <p className="mt-3 text-sm text-white/45">Best CS rank</p>
            <p className="mt-1 font-bold">{formatNumber(readValue(profile, "CsMaxRank", "csMaxRank"))}</p>
          </div>
          <div className="px-4 py-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/45">
              <UsersRound className="h-4 w-4 text-orange-300" /> Guild
            </div>
            <p className="truncate text-lg font-bold">{String(readValue(guild, "GuildName", "clanName") ?? "No guild")}</p>
            <p className="mt-2 text-sm leading-6 text-white/42">
              Level {formatNumber(readValue(guild, "GuildLevel", "clanLevel"))} / {formatNumber(readValue(guild, "GuildMember", "memberNum"))} members
            </p>
          </div>
          <div className="px-4 py-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/45">
              <Zap className="h-4 w-4 text-orange-300" /> Account timeline
            </div>
            <p className="text-sm text-white/45">Created</p>
            <p className="mt-1 font-bold">{formatDate(readValue(account, "AccountCreateTime", "createAt"))}</p>
            <p className="mt-3 text-sm text-white/45">Last active</p>
            <p className="mt-1 font-bold">{formatDate(readValue(account, "AccountLastLogin", "lastLoginAt"))}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getStatGroups(payload: unknown) {
  const root = asRecord(payload);
  const candidates = [asRecord(root.data), asRecord(root.stats), root];
  for (const candidate of candidates) {
    const groups = Object.entries(candidate).filter(([, value]) => {
      const record = asRecord(value);
      return ["gamesplayed", "gamesPlayed", "kills", "wins", "detailedstats"].some((key) => key in record);
    });
    if (groups.length) return groups;
  }
  return [];
}

function StatsView({ result }: { result: IntelResult }) {
  const groups = getStatGroups(result.payload);
  const root = asRecord(result.payload);
  const fallback = asRecord(readValue(root, "data", "stats"));
  const numericFallback = Object.entries(Object.keys(fallback).length ? fallback : root).filter(([, value]) =>
    Number.isFinite(Number(value)),
  );

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.07] p-6 sm:p-8">
        <div>
          <div className="section-kicker">Performance report</div>
          <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">UID {result.uid}</h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/35">
          <BarChart3 className="h-4 w-4 text-orange-300" /> {result.region} server
        </div>
      </div>

      {groups.length > 0 ? (
        <div className="divide-y divide-white/[0.07]">
          {groups.map(([groupName, value]) => {
            const stats = asRecord(value);
            const detailed = asRecord(readValue(stats, "detailedstats", "detailedStats"));
            const metrics = [
              ["Games", readValue(stats, "gamesplayed", "gamesPlayed")],
              ["Wins", readValue(stats, "wins")],
              ["Kills", readValue(stats, "kills")],
              ["Headshots", readValue(detailed, "headshots", "headshotKills")],
              ["Damage", readValue(detailed, "damage")],
              ["Top finishes", readValue(detailed, "topNTimes", "topntimes", "top10")],
            ];
            return (
              <section key={groupName} className="px-6 py-5 sm:px-8">
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-400/10 text-orange-300">
                    <Gamepad2 className="h-4 w-4" />
                  </span>
                  <h4 className="font-bold capitalize">{formatLabel(groupName.replace("stats", ""))}</h4>
                </div>
                <div className="grid grid-cols-2 divide-x divide-white/[0.06] sm:grid-cols-3 lg:grid-cols-6">
                  {metrics.map(([label, value]) => (
                    <div className="px-3 first:pl-0" key={String(label)}>
                      <Metric label={String(label)} value={value} />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : numericFallback.length > 0 ? (
        <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.07] p-4 sm:grid-cols-4 sm:p-6">
          {numericFallback.slice(0, 12).map(([label, value]) => (
            <div className="px-4" key={label}><Metric label={formatLabel(label)} value={value} /></div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
          <BarChart3 className="h-8 w-8 text-white/20" />
          <p className="mt-4 font-semibold">No match totals were returned for this player.</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-white/38">Try a different game mode, match type, or region.</p>
        </div>
      )}
    </motion.div>
  );
}

function extractSearchRows(payload: unknown) {
  if (Array.isArray(payload)) return payload;
  const root = asRecord(payload);
  const keys = ["players", "results", "accounts", "infos", "data"];
  for (const key of keys) {
    const candidate = root[key];
    if (Array.isArray(candidate)) return candidate;
    const nested = asRecord(candidate);
    for (const nestedKey of keys) {
      if (Array.isArray(nested[nestedKey])) return nested[nestedKey] as unknown[];
    }
  }
  return [];
}

function SearchView({ result, onUseUid }: { result: IntelResult; onUseUid: (uid: string) => void }) {
  const rows = extractSearchRows(result.payload);
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div className="border-b border-white/[0.07] p-6 sm:p-8">
        <div className="section-kicker">Search results</div>
        <h3 className="mt-2 text-2xl font-black tracking-[-0.035em]">{rows.length} players found</h3>
      </div>
      {rows.length > 0 ? (
        <div className="divide-y divide-white/[0.07]">
          {rows.slice(0, 20).map((item, index) => {
            const player = asRecord(item);
            const uid = String(readValue(player, "accountId", "accountid", "uid", "id") ?? "");
            const name = String(readValue(player, "nickname", "name", "AccountName") ?? `Player ${index + 1}`);
            const level = readValue(player, "level", "AccountLevel");
            const region = readValue(player, "region", "server", "AccountRegion") ?? result.region;
            return (
              <button
                key={`${uid}-${index}`}
                onClick={() => uid && onUseUid(uid)}
                disabled={!uid}
                className="group flex w-full items-center gap-4 px-6 py-5 text-left transition hover:bg-white/[0.025] sm:px-8"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] font-black text-orange-300">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-white">{name}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-white/35">
                    <span>UID {uid || "Unavailable"}</span>
                    <span>{String(region)}</span>
                    {level !== undefined && <span>Level {formatNumber(level)}</span>}
                  </div>
                </div>
                <span className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white/25 transition group-hover:text-orange-300 sm:flex">
                  View profile <ChevronRight className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
          <Search className="h-8 w-8 text-white/20" />
          <p className="mt-4 font-semibold">No matching players were returned.</p>
          <p className="mt-2 text-sm text-white/38">Try another spelling or switch the selected server.</p>
        </div>
      )}
    </motion.div>
  );
}

function PlayerIntel({ onOpenOutfit }: { onOpenOutfit: (uid: string) => void }) {
  const [mode, setMode] = useState<IntelMode>("info");
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("IND");
  const [gameMode, setGameMode] = useState("br");
  const [matchMode, setMatchMode] = useState("CAREER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<IntelResult | null>(null);

  function changeMode(nextMode: IntelMode) {
    setMode(nextMode);
    setResult(null);
    setError("");
    setQuery("");
  }

  async function runSearch(event?: FormEvent) {
    event?.preventDefault();
    const cleaned = query.trim();
    if ((mode === "search" && cleaned.length < 3) || (mode !== "search" && !/^\d{5,15}$/.test(cleaned))) {
      setError(mode === "search" ? "Enter at least 3 characters of the player name." : "Enter a valid numeric player UID.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    try {
      if (mode === "info") {
        const [payload, banStatus] = await Promise.all([
          ffRequest("/info/get", { uid: cleaned, region }),
          ffRequest("/bancheck/check", { uid: cleaned }).catch(() => undefined),
        ]);
        setResult({ mode, payload, banStatus, uid: cleaned, region });
      } else if (mode === "stats") {
        const payload = await ffRequest("/infov2/stats", {
          uid: cleaned,
          server: region,
          gamemode: gameMode,
          matchmode: matchMode,
        });
        setResult({ mode, payload, uid: cleaned, region });
      } else {
        const payload = await ffRequest("/infov2/search", { keyword: cleaned, server: region });
        setResult({ mode, payload, region });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to complete the player request.");
    } finally {
      setLoading(false);
    }
  }

  function useSearchUid(uid: string) {
    setMode("info");
    setQuery(uid);
    setResult(null);
    setError("");
  }

  return (
    <motion.section
      key="intel"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
      className="mx-auto w-full max-w-6xl"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="section-kicker">Player intelligence</div>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Find the signal.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/42 sm:text-base">Search public player data, rank history, and performance from one UID.</p>
        </div>
        {result?.uid && result.mode === "info" && (
          <button onClick={() => onOpenOutfit(result.uid!)} className="secondary-button flex items-center gap-2 px-4 py-3 text-sm font-bold">
            <Shirt className="h-4 w-4" /> View this outfit
          </button>
        )}
      </div>

      <div className="workspace-panel overflow-hidden">
        <div className="flex overflow-x-auto border-b border-white/[0.08] px-2 pt-2 sm:px-4">
          {([
            ["info", UserRound, "Player info"],
            ["stats", BarChart3, "Stats"],
            ["search", Search, "Name search"],
          ] as const).map(([value, Icon, label]) => (
            <button
              key={value}
              onClick={() => changeMode(value)}
              className={`tab-button relative flex shrink-0 items-center gap-2 px-4 py-4 text-sm font-bold ${mode === value ? "text-white" : "text-white/35 hover:text-white/70"}`}
            >
              <Icon className={`h-4 w-4 ${mode === value ? "text-orange-300" : ""}`} />
              {label}
              {mode === value && <motion.span layoutId="intel-tab" className="absolute inset-x-3 bottom-0 h-0.5 bg-orange-400" />}
            </button>
          ))}
        </div>

        <form onSubmit={runSearch} className="border-b border-white/[0.07] p-4 sm:p-6">
          <div className="grid gap-3 lg:grid-cols-[1fr_130px_auto]">
            <label className="search-control flex items-center gap-3 px-4">
              <Search className="h-5 w-5 shrink-0 text-white/28" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={mode === "search" ? "Search player nickname" : "Enter player UID"}
                inputMode={mode === "search" ? "text" : "numeric"}
                aria-label={mode === "search" ? "Player nickname" : "Player UID"}
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="text-white/25 hover:text-white" aria-label="Clear search">
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
            <label className="search-control px-3">
              <span className="sr-only">Region</span>
              <select value={region} onChange={(event) => setRegion(event.target.value)} aria-label="Server region">
                {REGIONS.map((item) => <option value={item} key={item}>{item} server</option>)}
              </select>
            </label>
            <motion.button whileTap={{ scale: 0.98 }} disabled={loading} className="primary-button flex min-h-14 items-center justify-center gap-2 px-6 text-sm font-extrabold uppercase tracking-[0.11em] disabled:opacity-60">
              {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Zap className="h-4 w-4" />}
              {loading ? "Scanning" : mode === "search" ? "Find player" : "Run scan"}
            </motion.button>
          </div>

          <AnimatePresence initial={false}>
            {mode === "stats" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 flex flex-wrap gap-3">
                  <label className="mini-select">
                    <span>Game mode</span>
                    <select value={gameMode} onChange={(event) => setGameMode(event.target.value)}>
                      <option value="br">Battle Royale</option>
                      <option value="cs">Clash Squad</option>
                    </select>
                  </label>
                  <label className="mini-select">
                    <span>Match type</span>
                    <select value={matchMode} onChange={(event) => setMatchMode(event.target.value)}>
                      <option value="CAREER">Career</option>
                      <option value="RANKED">Ranked</option>
                      <option value="NORMAL">Normal</option>
                    </select>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-start gap-2 text-sm text-red-300" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex min-h-[330px] flex-col items-center justify-center">
              <div className="scan-loader relative flex h-20 w-20 items-center justify-center rounded-full">
                <Search className="h-6 w-6 text-orange-300" />
              </div>
              <p className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-white/38">Reading player signal</p>
            </motion.div>
          ) : result?.mode === "info" ? (
            <InfoView key={`info-${result.uid}`} result={result} />
          ) : result?.mode === "stats" ? (
            <StatsView key={`stats-${result.uid}`} result={result} />
          ) : result?.mode === "search" ? (
            <SearchView key="search-results" result={result} onUseUid={useSearchUid} />
          ) : (
            <EmptyResult key={`empty-${mode}`} mode={mode} />
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

function OutfitStudio({ initialUid = "" }: { initialUid?: string }) {
  const [uid, setUid] = useState(initialUid);
  const [region, setRegion] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [activeUid, setActiveUid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function loadOutfit(event: FormEvent) {
    event.preventDefault();
    const cleaned = uid.trim();
    if (!/^\d{5,15}$/.test(cleaned)) {
      setError("Enter a valid numeric player UID.");
      return;
    }
    setError("");
    setLoading(true);
    setActiveUid(cleaned);
    const params: Record<string, string> = region ? { uid: cleaned, region } : { uid: cleaned };
    setImageUrl(`${createFfUrl("/outfit/image", params)}&_=${Date.now()}`);
  }

  async function copyUid() {
    await navigator.clipboard.writeText(activeUid);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <motion.section
      key="outfit"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
      className="mx-auto w-full max-w-6xl"
    >
      <div className="mb-8">
        <div className="section-kicker">Outfit visualizer</div>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Reveal the loadout.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/42 sm:text-base">Render a clean image of the outfit currently equipped on any public player UID.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <div className="workspace-panel h-fit p-5 sm:p-6">
          <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-300/15 bg-orange-400/[0.08] text-orange-300">
            <Shirt className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Loadout request</h2>
          <p className="mt-2 text-sm leading-6 text-white/38">Enter a UID and select the player's server region.</p>

          <form onSubmit={loadOutfit} className="mt-7 space-y-4">
            <label className="field-label block">
              <span>Player UID</span>
              <div className="field-control field-control-light mt-2">
                <UserRound className="h-[18px] w-[18px] text-white/28" />
                <input value={uid} onChange={(event) => setUid(event.target.value)} placeholder="e.g. 1679601311" inputMode="numeric" />
              </div>
            </label>
            <label className="field-label block">
              <span>Server region</span>
              <div className="field-control field-control-light mt-2">
                <select value={region} onChange={(event) => setRegion(event.target.value)} className="w-full" aria-label="Outfit server region">
                  <option value="">Auto detect</option>
                  {REGIONS.map((item) => <option value={item} key={item}>{item} server</option>)}
                </select>
              </div>
            </label>

            {error && <div className="flex gap-2 text-sm text-red-300"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}</div>}

            <motion.button whileTap={{ scale: 0.98 }} disabled={loading} className="primary-button flex w-full items-center justify-center gap-2 px-5 py-4 text-sm font-extrabold uppercase tracking-[0.11em] disabled:opacity-60">
              {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Rendering" : "Show outfit"}
            </motion.button>
          </form>

          <div className="mt-6 border-t border-white/[0.07] pt-5 text-xs leading-5 text-white/30">
            The renderer uses the player's live public equipment data. Some profiles may not expose every item.
          </div>
        </div>

        <div className="outfit-stage workspace-panel relative min-h-[520px] overflow-hidden">
          <div className="stage-grid absolute inset-0" />
          <AnimatePresence mode="wait">
            {!imageUrl ? (
              <motion.div key="outfit-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative flex min-h-[520px] flex-col items-center justify-center px-7 text-center">
                <motion.div
                  className="relative flex h-28 w-28 items-center justify-center"
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="absolute inset-0 rounded-full border border-dashed border-orange-300/20" />
                  <div className="absolute inset-5 rounded-full border border-white/[0.07]" />
                  <Shirt className="h-10 w-10 text-orange-300/75" />
                </motion.div>
                <h3 className="mt-7 text-2xl font-bold tracking-tight">Your outfit will appear here</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/35">Ready for a UID. The generated image will preserve the full loadout card.</p>
              </motion.div>
            ) : (
              <motion.div key={imageUrl} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative flex min-h-[520px] flex-col">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-6">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Rendered loadout</div>
                    <div className="mt-1 font-bold">UID {activeUid}</div>
                  </div>
                  {!loading && (
                    <div className="flex gap-2">
                      <button onClick={copyUid} className="icon-action" aria-label="Copy player UID">
                        {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                      </button>
                      <a href={imageUrl} target="_blank" rel="noreferrer" className="secondary-button flex items-center gap-2 px-3 py-2 text-xs font-bold">
                        <ImageIcon className="h-4 w-4" /> Full size
                      </a>
                    </div>
                  )}
                </div>

                <div className="relative flex flex-1 items-center justify-center p-4 sm:p-7">
                  {loading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#111316]/90 backdrop-blur-sm">
                      <div className="scan-loader relative flex h-20 w-20 items-center justify-center rounded-full">
                        <Shirt className="h-6 w-6 text-orange-300" />
                      </div>
                      <span className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-white/35">Building outfit card</span>
                    </div>
                  )}
                  <motion.img
                    src={imageUrl}
                    alt={`Equipped outfit for player ${activeUid}`}
                    className="max-h-[680px] w-full max-w-[680px] object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,.48)]"
                    onLoad={() => setLoading(false)}
                    onError={() => {
                      setLoading(false);
                      setImageUrl("");
                      setError("The outfit image could not be generated. Check the UID and region, then try again.");
                    }}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: loading ? 0 : 1, scale: loading ? 0.97 : 1 }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}

function Dashboard({ user, sessionid, onLogout }: { user: AuthUser; sessionid: string; onLogout: () => void }) {
  const [workspace, setWorkspace] = useState<Workspace>("intel");
  const [outfitUid, setOutfitUid] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const initials = useMemo(() => user.username.slice(0, 2).toUpperCase(), [user.username]);

  async function logOut() {
    onLogout();
    try {
      await keyAuthRequest({
        type: "logout",
        name: KEYAUTH_APP.name,
        ownerid: KEYAUTH_APP.ownerid,
        sessionid,
      });
    } catch {
      // Local sign-out should not be blocked by a remote session error.
    }
  }

  function openOutfit(uid: string) {
    setOutfitUid(uid);
    setWorkspace("outfit");
  }

  function chooseWorkspace(next: Workspace) {
    setWorkspace(next);
    setMobileMenu(false);
  }

  return (
    <main className="dashboard-shell min-h-screen bg-[#0d0f11] text-white">
      <div className="dashboard-ambient" />
      <header className="fixed inset-x-0 top-0 z-40 flex h-20 items-center border-b border-white/[0.07] bg-[#0d0f11]/85 px-5 backdrop-blur-xl lg:left-64 lg:px-8">
        <button onClick={() => setMobileMenu(true)} className="mr-4 rounded-xl p-2 text-white/60 hover:bg-white/5 hover:text-white lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/28">Active workspace</div>
          <div className="mt-1 truncate text-sm font-bold">{workspace === "intel" ? "Player intelligence" : "Outfit visualizer"}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-bold">{user.username}</div>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300/70">Session active</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-300/20 bg-orange-400/10 text-xs font-black text-orange-200">{initials}</div>
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-white/[0.07] bg-[#101214] px-4 pb-5 pt-6 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <BrandMark className="h-10 w-10" />
          <div>
            <div className="brand-wordmark text-base font-black tracking-[0.15em]">FAISAL ONE</div>
            <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">Player Suite</div>
          </div>
        </div>

        <nav className="mt-12 space-y-2">
          <button onClick={() => chooseWorkspace("intel")} className={`nav-item ${workspace === "intel" ? "nav-item-active" : ""}`}>
            <Search className="h-5 w-5" />
            <span>Player intel</span>
            <ChevronRight className="ml-auto h-4 w-4 opacity-35" />
          </button>
          <button onClick={() => chooseWorkspace("outfit")} className={`nav-item ${workspace === "outfit" ? "nav-item-active" : ""}`}>
            <Shirt className="h-5 w-5" />
            <span>Outfit studio</span>
            <ChevronRight className="ml-auto h-4 w-4 opacity-35" />
          </button>
        </nav>

        <div className="mt-auto">
          <div className="mb-4 border-l-2 border-orange-400/50 px-4 py-2">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/28">Connected as</div>
            <div className="mt-1 truncate text-sm font-bold">{user.username}</div>
            {user.subscription && <div className="mt-1 text-xs text-orange-300/65">{user.subscription} access</div>}
          </div>
          <button onClick={logOut} className="nav-item text-white/38 hover:text-red-200">
            <LogOut className="h-5 w-5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {mobileMenu && (
          <>
            <motion.button
              aria-label="Close menu"
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenu(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-[60] flex w-[290px] flex-col border-r border-white/10 bg-[#111315] p-5 lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BrandMark className="h-10 w-10" />
                  <div className="brand-wordmark text-sm font-black tracking-[0.14em]">FAISAL ONE</div>
                </div>
                <button onClick={() => setMobileMenu(false)} className="rounded-xl p-2 text-white/45 hover:bg-white/5 hover:text-white" aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-10 space-y-2">
                <button onClick={() => chooseWorkspace("intel")} className={`nav-item ${workspace === "intel" ? "nav-item-active" : ""}`}><Search className="h-5 w-5" /> Player intel</button>
                <button onClick={() => chooseWorkspace("outfit")} className={`nav-item ${workspace === "outfit" ? "nav-item-active" : ""}`}><Shirt className="h-5 w-5" /> Outfit studio</button>
              </nav>
              <button onClick={logOut} className="nav-item mt-auto text-white/40"><LogOut className="h-5 w-5" /> Sign out</button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="relative z-10 px-4 pb-12 pt-28 sm:px-7 lg:ml-64 lg:px-9 lg:pt-28">
        <AnimatePresence mode="wait">
          {workspace === "intel" ? <PlayerIntel onOpenOutfit={openOutfit} /> : <OutfitStudio initialUid={outfitUid} />}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionid, setSessionid] = useState("");

  return (
    <AnimatePresence mode="wait">
      {user ? (
        <Dashboard
          key="dashboard"
          user={user}
          sessionid={sessionid}
          onLogout={() => {
            setUser(null);
            setSessionid("");
            keyAuthSessionPromise = null;
          }}
        />
      ) : (
        <motion.div key="login" exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <LoginScreen
            onLogin={(authenticatedUser, activeSession) => {
              setUser(authenticatedUser);
              setSessionid(activeSession);
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}