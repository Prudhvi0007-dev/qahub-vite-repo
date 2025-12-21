import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const MENU_ITEMS = [
  {
    key: "testcases",
    label: "TestCases",
    path: "/testcases",
    color: "#2f66ff",
    desc: "Test case library and ownership.",
  },
  {
    key: "defects",
    label: "Defect Tracker",
    path: "/defect-tracker",
    color: "#ec4899",
    desc: "Log, triage, and track defects.",
  },
  {
    key: "automation",
    label: "Automation Metrics",
    path: "/automation-metrics",
    color: "#06b6d4",
    desc: "Stability, ROI, and trend metrics.",
  },
  {
    key: "suite",
    label: "TestSuiteManager",
    path: "/test-suite-manager",
    color: "#f59e0b",
    desc: "Suites, schedules, and versions.",
  },
  {
    key: "team",
    label: "TeamAnalytics",
    path: "/team-analytics",
    color: "#8b5cf6",
    desc: "Team-wise analytics and risks.",
  },
  {
    key: "work",
    label: "WorkPlanner",
    path: "/work-planer",
    color: "#22c55e",
    desc: "Sprint plan, checkpoints, capacity.",
  },
  {
    key: "users",
    label: "UserManagement",
    path: "/user-management",
    color: "#ef4444",
    desc: "Roles, access, and permissions.",
  },
] as const;

type MenuKey = (typeof MENU_ITEMS)[number]["key"];

type Hex = `#${string}`;

type Severity = "Critical" | "High" | "Medium" | "Low";

type DefectStatus =
  | "Open"
  | "In Progress"
  | "Blocked"
  | "Fixed"
  | "Verified"
  | "Closed";

type Defect = {
  id: string;
  title: string;
  severity: Severity;
  status: DefectStatus;
  owner: string;
  createdDaysAgo: number;
  slaDueDays: number;
  linkedTestCases: string[];
};

type ScenarioResult = {
  id: string;
  scenarioTitle: string;
  status: "PASS" | "FAIL";
  elapsedSeconds: number;
  checklist: Array<{ label: string; checked: boolean }>;
  createdAtIso: string;
  linkedTestCaseId?: string;
  defectId?: string;
};

type Task = {
  id: string;
  title: string;
  status: "PENDING" | "DONE" | "FAILED";
  dayKey: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function splitCamel(label: string) {
  return label.replace(/([a-z])([A-Z])/g, "$1​$2");
}

function LocalFonts() {
  return (
    <style>{`
      :root{
        --font-body: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        --font-condensed: QAHubCondensed, ui-sans-serif, system-ui;
      }
      html, body { font-family: var(--font-body); }

      @font-face {
        font-family: "QAHubCondensed";
        src: url("/fonts/QAHubCondensed.woff2") format("woff2"),
             url("/fonts/QAHubCondensed.woff") format("woff");
        font-weight: 300 900;
        font-style: normal;
        font-display: swap;
      }
    `}</style>
  );
}

function SplitBarsIcon({ open }: { open: boolean }) {
  return (
    <span className="relative inline-block h-4 w-6">
      <span
        className={cn(
          "absolute right-0 top-[2px] h-[3px] w-6 bg-current transition-transform duration-300",
          open ? "translate-y-[4px]" : ""
        )}
      />
      <span
        className={cn(
          "absolute right-0 top-[9px] h-[3px] w-4 bg-current transition-all duration-300",
          open ? "w-6" : "w-4"
        )}
      />
    </span>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-4">
      <div className="grid h-12 w-20 place-items-center rounded-full border-2 border-white/80">
        <div className="h-5 w-5 rounded-full border-2 border-white/80" />
      </div>
      <div className="flex items-baseline gap-2">
        <div
          className="text-6xl font-black tracking-tight"
          style={{ fontFamily: "var(--font-condensed)" }}
        >
          check
        </div>
      </div>
    </div>
  );
}

function TopNav({ onOpen, open }: { onOpen: () => void; open: boolean }) {
  return (
    <div className="fixed inset-x-0 top-0 z-40">
      <div className="mx-auto flex max-w-[min(1280px,calc(100vw-3rem))] items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full border border-neutral-900">
            <div className="h-4 w-4 rounded-full border-2 border-neutral-900" />
          </div>
          <div className="text-lg font-semibold tracking-tight">QAHub</div>
        </div>

        <button
          onClick={onOpen}
          className="group flex items-center gap-4 text-sm text-neutral-800 hover:text-black"
          aria-label="Open menu"
        >
          <span className="uppercase tracking-[0.25em]">Menu</span>
          <span className="text-neutral-900">
            <SplitBarsIcon open={open} />
          </span>
        </button>
      </div>
    </div>
  );
}

function PageHero({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-24">
      <div className="text-xs uppercase tracking-[0.35em] text-neutral-500">
        {subtitle}
      </div>
      <div
        className="mt-4 text-[clamp(40px,6vw,72px)] font-black leading-[0.95] tracking-tight"
        style={{
          fontFamily: "var(--font-condensed)",
          textWrap: "balance" as any,
        }}
      >
        {title}
      </div>
      <div className="mt-6 max-w-2xl text-base leading-relaxed text-neutral-600">
        Replace this placeholder with your real screen content.
      </div>

      {children ? <div className="mt-10">{children}</div> : null}
    </div>
  );
}

function useActiveItem() {
  const { pathname } = useLocation();
  return useMemo(() => {
    return MENU_ITEMS.find((x) => x.path === pathname) || MENU_ITEMS[0];
  }, [pathname]);
}

function blend(hexA: Hex, hexB: Hex, amountB: number): Hex {
  const a = hexA.replace("#", "");
  const b = hexB.replace("#", "");
  const ar = parseInt(a.slice(0, 2), 16);
  const ag = parseInt(a.slice(2, 4), 16);
  const ab = parseInt(a.slice(4, 6), 16);
  const br = parseInt(b.slice(0, 2), 16);
  const bg = parseInt(b.slice(2, 4), 16);
  const bb = parseInt(b.slice(4, 6), 16);
  const t = Math.max(0, Math.min(1, amountB));
  const rr = Math.round(ar * (1 - t) + br * t);
  const rg = Math.round(ag * (1 - t) + bg * t);
  const rb = Math.round(ab * (1 - t) + bb * t);
  return (`#${rr.toString(16).padStart(2, "0")}${rg
    .toString(16)
    .padStart(2, "0")}${rb.toString(16).padStart(2, "0")}`) as Hex;
}

function MenuOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const activeItem = useActiveItem();
  const [hoverKey, setHoverKey] = useState<MenuKey | null>(null);

  const hoveredItem = useMemo(() => {
    return MENU_ITEMS.find((x) => x.key === hoverKey) || null;
  }, [hoverKey]);

  const panelItem = hoveredItem || activeItem;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setHoverKey(null);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-[#0b0b0b] text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_20%_20%,rgba(255,255,255,0.06),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(900px_600px_at_80%_35%,rgba(255,255,255,0.05),transparent_60%)]" />
          </div>

          <div className="relative flex items-start justify-between px-6 sm:px-8 md:px-12 lg:px-24 pt-8 sm:pt-12 md:pt-14 lg:pt-16">
            <div
              className="text-4xl font-black tracking-tight"
              style={{ fontFamily: "var(--font-condensed)" }}
            >
              Menu
            </div>

            <button
              onClick={onClose}
              className="group flex items-center gap-3 text-sm text-neutral-200 hover:text-white"
              aria-label="Close menu"
            >
              <span className="uppercase tracking-[0.25em]">Close</span>
              <span className="text-white">
                <SplitBarsIcon open />
              </span>
            </button>
          </div>

          <div className="relative mx-auto grid max-w-[min(1280px,calc(100vw-3rem))] grid-cols-12 gap-x-10 md:gap-x-14 lg:gap-x-20 gap-y-10 px-6 sm:px-8 md:px-12 lg:px-24 pb-24 md:pb-28 lg:pb-32 pt-8 sm:pt-9 md:pt-10">
            <div className="col-span-12 lg:col-span-8 min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 sm:gap-y-12 md:gap-y-14 gap-x-12 md:gap-x-20 lg:gap-x-32">
                {MENU_ITEMS.map((item, idx) => {
                  const isActive = item.key === activeItem.key;
                  const isHovered = item.key === hoverKey;
                  const shouldAccent = isHovered || isActive;

                  const compactLen = item.label.split(" ").join("").length;
                  const isLong = compactLen >= 13;
                  const fontSize = isLong
                    ? "clamp(22px, 2.5vw, 50px)"
                    : "clamp(30px, 3.3vw, 72px)";
                  const minH = isLong ? 144 : 120;

                  return (
                    <motion.button
                      key={item.key}
                      onMouseEnter={() => setHoverKey(item.key)}
                      onFocus={() => setHoverKey(item.key)}
                      onMouseLeave={() => setHoverKey(null)}
                      onBlur={() => setHoverKey(null)}
                      onClick={() => {
                        navigate(item.path);
                        onClose();
                      }}
                      className="relative block text-left outline-none pr-10"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2 }}
                      transition={{
                        delay: 0.04 + idx * 0.03,
                        type: "spring",
                        stiffness: 420,
                        damping: 28,
                      }}
                      style={{ minHeight: minH }}
                    >
                      <div className="relative pl-14">
                        <span
                          className={cn(
                            "absolute left-0 top-4 inline-block rounded-md bg-white/10 px-2 py-1 text-[11px] font-semibold tracking-[0.2em]",
                            shouldAccent ? "bg-white/15" : "bg-white/10"
                          )}
                          style={{ transform: "rotate(-10deg)" }}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </span>

                        <span
                          className="block font-black uppercase leading-[0.92] tracking-[-0.03em]"
                          style={{
                            fontFamily: "var(--font-condensed)",
                            fontSize,
                            transition: "color 180ms ease",
                            color: shouldAccent ? item.color : "#ffffff",
                            maxWidth: 520,
                            overflowWrap: "anywhere",
                            whiteSpace: "normal",
                            overflow: "visible",
                            wordBreak: "break-word",
                          }}
                        >
                          {splitCamel(item.label)}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 flex lg:justify-end">
              <motion.div
                className="w-full lg:max-w-[420px] rounded-2xl p-8 sm:p-9 md:p-10"
                style={{
                  backgroundColor: blend(panelItem.color as Hex, "#1a1a1a", 0.72),
                  maxHeight: 360,
                  width: "100%",
                  alignSelf: "flex-start",
                  transition: "background-color 220ms ease",
                }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: 0.05 }}
              >
                <div
                  className="text-sm leading-relaxed text-white/80"
                  style={{ maxWidth: 220 }}
                >
                  {panelItem.desc}
                </div>
                <div className="mt-6 text-xs uppercase tracking-[0.25em] text-white/60">
                  Tip
                </div>
                <div className="mt-2 text-sm text-white/80">
                  Press <span className="rounded bg-white/15 px-2 py-1">Esc</span> to
                  close.
                </div>
              </motion.div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0">
            <div className="mx-auto flex max-w-[min(1280px,calc(100vw-3rem))] flex-col items-start gap-6 px-6 sm:px-8 md:px-12 lg:px-24 pb-8 sm:pb-9 md:pb-10 md:flex-row md:items-center md:gap-10">
              <div className="pointer-events-auto opacity-95">
                <BrandMark />
              </div>

              <div className="hidden md:block h-px flex-1 bg-white/15" />

              <div className="pointer-events-auto ml-auto">
                <button
                  onClick={() => {
                    navigate("/testcases");
                    onClose();
                  }}
                  className="group inline-flex w-full items-center justify-center gap-4 rounded-none bg-white px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-black shadow-sm md:w-auto md:px-10"
                >
                  Start a conversation
                  <span className="text-xl leading-none transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const TEST_CASES = [
  {
    id: "TC-101",
    title: "Login with valid credentials",
    module: "Auth",
    priority: "P0" as const,
  },
  {
    id: "TC-142",
    title: "Create invoice with tax",
    module: "Billing",
    priority: "P1" as const,
  },
  {
    id: "TC-155",
    title: "Search employees",
    module: "Directory",
    priority: "P1" as const,
  },
  {
    id: "TC-201",
    title: "Export report to CSV",
    module: "Reports",
    priority: "P2" as const,
  },
  {
    id: "TC-222",
    title: "Role-based access for QA",
    module: "RBAC",
    priority: "P0" as const,
  },
];

const BASE_DEFECTS: Defect[] = [
  {
    id: "BUG-431",
    title: "Login intermittently fails on Safari",
    severity: "High",
    status: "In Progress",
    owner: "Nixy",
    createdDaysAgo: 6,
    slaDueDays: 1,
    linkedTestCases: ["TC-101"],
  },
  {
    id: "BUG-452",
    title: "Invoice total mismatch when discount applied",
    severity: "Critical",
    status: "Open",
    owner: "Riku",
    createdDaysAgo: 2,
    slaDueDays: 0,
    linkedTestCases: ["TC-142"],
  },
  {
    id: "BUG-468",
    title: "Employee search returns duplicates",
    severity: "Medium",
    status: "Fixed",
    owner: "Asha",
    createdDaysAgo: 10,
    slaDueDays: -2,
    linkedTestCases: ["TC-155"],
  },
  {
    id: "BUG-471",
    title: "CSV export missing headers",
    severity: "Low",
    status: "Verified",
    owner: "Vikram",
    createdDaysAgo: 14,
    slaDueDays: 3,
    linkedTestCases: ["TC-201"],
  },
  {
    id: "BUG-488",
    title: "QA role sees admin-only menu",
    severity: "High",
    status: "Blocked",
    owner: "Meera",
    createdDaysAgo: 4,
    slaDueDays: 2,
    linkedTestCases: ["TC-222"],
  },
];

const LS = {
  scenarioRuns: "qahub.scenarioRuns.v1",
  defects: "qahub.defects.v1",
  tasks: "qahub.tasks.v1",
};

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadScenarioRuns(): ScenarioResult[] {
  if (typeof window === "undefined") return [];
  return safeJsonParse<ScenarioResult[]>(
    window.localStorage.getItem(LS.scenarioRuns),
    []
  );
}

function saveScenarioRuns(runs: ScenarioResult[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS.scenarioRuns, JSON.stringify(runs));
}

function appendScenarioRun(run: ScenarioResult) {
  const next = [run, ...loadScenarioRuns()].slice(0, 50);
  saveScenarioRuns(next);
}

function loadExtraDefects(): Defect[] {
  if (typeof window === "undefined") return [];
  return safeJsonParse<Defect[]>(window.localStorage.getItem(LS.defects), []);
}

function saveExtraDefects(defects: Defect[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS.defects, JSON.stringify(defects));
}

function appendExtraDefect(defect: Defect) {
  const next = [defect, ...loadExtraDefects()].slice(0, 100);
  saveExtraDefects(next);
}

function getAllDefects(): Defect[] {
  return [...loadExtraDefects(), ...BASE_DEFECTS];
}

function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  return safeJsonParse<Task[]>(window.localStorage.getItem(LS.tasks), []);
}

function saveTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS.tasks, JSON.stringify(tasks));
}

function getDayKeyInTimeZone(tz: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const d = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${y}-${m}-${d}`;
}

function ensureSeedTasksForToday(tz: string, desiredTotal = 13) {
  const dayKey = getDayKeyInTimeZone(tz);
  const existing = loadTasks();
  const todayCount = existing.filter((t) => t.dayKey === dayKey).length;
  if (todayCount >= desiredTotal) return;

  const need = desiredTotal - todayCount;
  const startIdx = todayCount;

  const seed: Task[] = Array.from({ length: need }).map((_, i) => ({
    id: `SCN-${String(startIdx + i + 1).padStart(3, "0")}`,
    title: `Scenario ${startIdx + i + 1}`,
    status: "PENDING",
    dayKey,
  }));

  saveTasks([...existing, ...seed]);
}

function getGreeting(name: string, tz: string) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );

  if (hour >= 5 && hour < 12) return `Good Morning ${name}`;
  if (hour >= 12 && hour < 17) return `Good Afternoon ${name}`;
  if (hour >= 17 && hour < 21) return `Good Evening ${name}`;
  return `Good Night ${name}`;
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-[11px] uppercase tracking-[0.22em] text-white/60">
        {label}
      </div>
      <div
        className="mt-2 text-3xl font-black"
        style={{ fontFamily: "var(--font-condensed)" }}
      >
        {value}
      </div>
      {hint ? <div className="mt-2 text-sm text-white/60">{hint}</div> : null}
    </div>
  );
}

function TestCasesPage() {
  const [selectedTc, setSelectedTc] = useState<string>(TEST_CASES[0].id);
  const allDefects = useMemo(() => getAllDefects(), []);
  const linkedDefects = useMemo(
    () => allDefects.filter((d) => d.linkedTestCases.includes(selectedTc)),
    [allDefects, selectedTc]
  );

  return (
    <PageHero title="TestCases" subtitle="Case library">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Test cases</div>
            <div className="text-xs text-neutral-500">
              Click a case to see linked defects
            </div>
          </div>
          <div className="mt-4 divide-y divide-neutral-200">
            {TEST_CASES.map((tc) => {
              const isActive = tc.id === selectedTc;
              const defectCount = allDefects.filter((d) =>
                d.linkedTestCases.includes(tc.id)
              ).length;
              return (
                <button
                  key={tc.id}
                  onClick={() => setSelectedTc(tc.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 py-4 text-left",
                    isActive ? "opacity-100" : "opacity-80 hover:opacity-100"
                  )}
                >
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">
                      {tc.title}
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                      <span className="font-semibold text-neutral-700">
                        {tc.id}
                      </span>{" "}
                      • {tc.module} • {tc.priority}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        defectCount
                          ? "bg-pink-50 text-pink-700"
                          : "bg-neutral-100 text-neutral-600"
                      )}
                    >
                      {defectCount} defects
                    </span>
                    <span className="text-neutral-400">→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
          <div className="text-sm font-semibold">Linked defects</div>
          <div className="mt-1 text-xs text-neutral-500">For {selectedTc}</div>

          <div className="mt-4 space-y-3">
            {linkedDefects.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
                No defects linked to this test case.
              </div>
            ) : (
              linkedDefects.map((d) => (
                <div
                  key={d.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-neutral-500">
                        {d.id}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-neutral-900">
                        {d.title}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-neutral-600">
                      {d.status}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-pink-50 px-2.5 py-1 text-[11px] font-semibold text-pink-700">
                      {d.severity}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        d.slaDueDays <= 0
                          ? "bg-red-50 text-red-700"
                          : "bg-emerald-50 text-emerald-700"
                      )}
                    >
                      SLA {d.slaDueDays <= 0 ? "breached" : `due in ${d.slaDueDays}d`}
                    </span>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                      Aging {d.createdDaysAgo}d
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
            Tip: In your real app, show a “Link defect” action here and deep-link
            into Defect Tracker.
          </div>
        </div>
      </div>
    </PageHero>
  );
}

function DefectTrackerPage() {
  const navigate = useNavigate();
  const [severity, setSeverity] = useState<Severity | "All">("All");
  const [status, setStatus] = useState<DefectStatus | "All">("All");

  const allDefects = useMemo(() => getAllDefects(), []);

  const filtered = useMemo(() => {
    return allDefects
      .filter((d) => (severity === "All" ? true : d.severity === severity))
      .filter((d) => (status === "All" ? true : d.status === status));
  }, [allDefects, severity, status]);

  const countsBy = <T extends string>(items: Defect[], key: (d: Defect) => T) => {
    const m = new Map<T, number>();
    for (const d of items) m.set(key(d), (m.get(key(d)) || 0) + 1);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  };

  const bySeverity = useMemo(() => countsBy(filtered, (d) => d.severity), [
    filtered,
  ]);
  const byStatus = useMemo(() => countsBy(filtered, (d) => d.status), [filtered]);
  const breached = useMemo(
    () => filtered.filter((d) => d.slaDueDays <= 0).length,
    [filtered]
  );
  const avgAging = useMemo(() => {
    if (!filtered.length) return 0;
    return Math.round(
      filtered.reduce((s, d) => s + d.createdDaysAgo, 0) / filtered.length
    );
  }, [filtered]);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-24">
      <div className="text-xs uppercase tracking-[0.35em] text-neutral-500">
        Bug lifecycle
      </div>
      <div
        className="mt-4 text-[clamp(40px,6vw,72px)] font-black leading-[0.95] tracking-tight"
        style={{ fontFamily: "var(--font-condensed)", textWrap: "balance" as any }}
      >
        Defect Tracker
      </div>
      <div className="mt-6 max-w-2xl text-base leading-relaxed text-neutral-600">
        Severity, status, SLA, and aging — plus visual links back to TestCases.
      </div>

      <div className="mt-10 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-semibold">Filters</div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold text-neutral-600">Severity</label>
            <select
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
            >
              {(["All", "Critical", "High", "Medium", "Low"] as const).map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>

            <label className="ml-2 text-xs font-semibold text-neutral-600">Status</label>
            <select
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              {(
                [
                  "All",
                  "Open",
                  "In Progress",
                  "Blocked",
                  "Fixed",
                  "Verified",
                  "Closed",
                ] as const
              ).map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>

            <div className="ml-auto text-xs text-neutral-500">
              Showing {filtered.length} defects
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-4 rounded-3xl border border-neutral-200 bg-[#0b0b0b] p-6 text-white">
          <div className="text-xs uppercase tracking-[0.22em] text-white/60">SLA</div>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <MetricCard
              label="Breached"
              value={String(breached)}
              hint="Due today or overdue"
            />
            <MetricCard label="Avg aging" value={`${avgAging}d`} hint="Across filtered set" />
          </div>
        </div>

        <div className="col-span-12 md:col-span-4 rounded-3xl border border-neutral-200 bg-white p-6">
          <div className="text-sm font-semibold">Severity</div>
          <div className="mt-4 space-y-3">
            {bySeverity.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <div className="text-sm text-neutral-700">{k}</div>
                <div className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 md:col-span-4 rounded-3xl border border-neutral-200 bg-white p-6">
          <div className="text-sm font-semibold">Status</div>
          <div className="mt-4 space-y-3">
            {byStatus.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <div className="text-sm text-neutral-700">{k}</div>
                <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 rounded-3xl border border-neutral-200 bg-white p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold">Defects</div>
              <div className="text-xs text-neutral-500">
                Includes SLA and linked test cases
              </div>
            </div>
            <div className="text-xs text-neutral-500">Aging = days since created</div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs uppercase tracking-[0.2em] text-neutral-500">
                  <th className="py-3 pr-4">Defect</th>
                  <th className="py-3 pr-4">Severity</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">SLA</th>
                  <th className="py-3 pr-4">Aging</th>
                  <th className="py-3 pr-4">Linked TestCases</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-b border-neutral-100">
                    <td className="py-4 pr-4">
                      <div className="text-xs font-semibold text-neutral-500">{d.id}</div>
                      <div className="mt-1 font-semibold text-neutral-900">{d.title}</div>
                      <div className="mt-1 text-xs text-neutral-500">Owner: {d.owner}</div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="rounded-full bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-700">
                        {d.severity}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                        {d.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          d.slaDueDays <= 0
                            ? "bg-red-50 text-red-700"
                            : "bg-emerald-50 text-emerald-700"
                        )}
                      >
                        {d.slaDueDays <= 0 ? "Breached" : `Due in ${d.slaDueDays}d`}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                        {d.createdDaysAgo}d
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        {d.linkedTestCases.map((tc) => (
                          <button
                            key={tc}
                            type="button"
                            onClick={() => navigate("/testcases")}
                            className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                            title="Open TestCases"
                          >
                            {tc}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
            Integration note: In a real app, clicking a test case chip should
            deep-link to <span className="font-semibold">/testcases?selected=TC-xxx</span>.
          </div>
        </div>
      </div>
    </div>
  );
}

function AutomationMetricsPage() {
  return <PageHero title="Automation Metrics" subtitle="Quality & ROI" />;
}

function TeamAnalyticsPage() {
  return <PageHero title="TeamAnalytics" subtitle="Performance" />;
}

function TestSuiteManagerPage() {
  return <PageHero title="TestSuiteManager" subtitle="Suites" />;
}

function UserManagementPage() {
  return <PageHero title="UserManagement" subtitle="Access control" />;
}

function formatMMSS(totalSeconds: number) {
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function useStopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      setElapsed((v) => v + 1);
    }, 1000);
    return () => window.clearInterval(t);
  }, [running]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => setElapsed(0);

  return {
    elapsed,
    label: formatMMSS(elapsed),
    running,
    start,
    pause,
    reset,
    stop: () => {
      setRunning(false);
    },
  };
}

function WorkPlannerFlashCard({
  accent = "#ff2b2b",
  onViewTestCase,
  linkedTestCaseId = "TC-142",
  onResultLocked,
}: {
  accent?: string;
  onViewTestCase: () => void;
  linkedTestCaseId?: string;
  onResultLocked?: (args: {
    status: "PASS" | "FAIL";
    elapsedSeconds: number;
    runId: string;
    linkedTestCaseId?: string;
  }) => void;
}) {
  const sw = useStopwatch();

  const checklistLabels = [
    "Verify pre-conditions & test data",
    "Run happy-path scenario",
    "Cover negative validations",
    "Capture logs / screenshots",
    "Update status & link defects",
  ];

  const [checked, setChecked] = useState<boolean[]>(
    checklistLabels.map(() => false)
  );
  const [showChecklist, setShowChecklist] = useState(false);
  const [result, setResult] = useState<null | "PASS" | "FAIL">(null);
  const [showDefectForm, setShowDefectForm] = useState(false);
  const [defectTitle, setDefectTitle] = useState("");
  const [defectSeverity, setDefectSeverity] = useState<Severity>("High");
  const [lastLoggedRunId, setLastLoggedRunId] = useState<string | null>(null);

  const scenarioTitle =
    "Validate end‑to‑end WorkPlanner flow (plan → execute → report)";

  const isLocked = result !== null;

  function toggleChecklist(i: number) {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }

  function stopAndLog(nextStatus: "PASS" | "FAIL") {
    sw.stop();

    const runId = `RUN-${Date.now()}`;
    const payload: ScenarioResult = {
      id: runId,
      scenarioTitle,
      status: nextStatus,
      elapsedSeconds: sw.elapsed,
      checklist: checklistLabels.map((label, idx) => ({
        label,
        checked: checked[idx],
      })),
      createdAtIso: new Date().toISOString(),
      linkedTestCaseId,
    };

    appendScenarioRun(payload);
    setLastLoggedRunId(runId);

    onResultLocked?.({
      status: nextStatus,
      elapsedSeconds: payload.elapsedSeconds,
      runId,
      linkedTestCaseId: payload.linkedTestCaseId,
    });

    setResult(nextStatus);

    if (nextStatus === "FAIL") setShowDefectForm(true);
  }

  function logDefectForRun() {
    const id = `BUG-${Math.floor(100 + Math.random() * 900)}`;
    const title = defectTitle.trim() || "(Untitled defect)";

    const defect: Defect = {
      id,
      title,
      severity: defectSeverity,
      status: "Open",
      owner: "QA",
      createdDaysAgo: 0,
      slaDueDays: 2,
      linkedTestCases: [linkedTestCaseId],
    };

    appendExtraDefect(defect);

    if (lastLoggedRunId) {
      const runs = loadScenarioRuns();
      const next = runs.map((r) =>
        r.id === lastLoggedRunId ? { ...r, defectId: id } : r
      );
      saveScenarioRuns(next);
    }

    setShowDefectForm(false);
  }

  const canMarkResult = sw.elapsed > 0 || sw.running;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as any }}
      className="w-full max-w-[520px] rounded-[28px] border border-black/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/60">
            Scenario Run
          </div>
          <div
            className="mt-2 text-5xl font-black leading-none"
            style={{ fontFamily: "var(--font-condensed)", color: accent }}
          >
            {sw.label}
          </div>
          <div className="mt-2 text-xs text-black/55">
            {result ? (
              <span>
                Result locked as <span className="font-semibold">{result}</span>. Run logged.
              </span>
            ) : sw.running ? (
              "Tracking manual execution time…"
            ) : (
              "Use Start/Pause/Stop to track this scenario."
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className="rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{ background: `${accent}22`, color: accent }}
          >
            Sprint • Today
          </span>
          <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-semibold text-black/70">
            Linked: {linkedTestCaseId}
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-black/10 bg-white/70 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/60">
          Daily Plan
        </div>
        <div className="mt-2 text-base font-semibold text-black/85">
          {scenarioTitle}
        </div>
        <div className="mt-2 text-sm text-black/60">
          Ensure checklist completion and link any defects back to test cases.
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => setShowChecklist((v) => !v)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black/80 hover:bg-white/80"
          >
            {showChecklist ? "Hide checklist" : "Show checklist"}
            <span
              className={cn(
                "transition-transform",
                showChecklist ? "rotate-180" : "rotate-0"
              )}
            >
              ▾
            </span>
          </button>

          <button
            onClick={onViewTestCase}
            className="inline-flex items-center justify-center gap-3 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm"
            style={{ background: accent }}
          >
            View test case
            <span className="text-lg leading-none">→</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <button
            onClick={() => sw.start()}
            className={cn(
              "rounded-2xl px-4 py-3 text-sm font-semibold",
              sw.running || isLocked
                ? "bg-black/10 text-black/40"
                : "bg-black text-white hover:bg-black/90"
            )}
            disabled={sw.running || isLocked}
          >
            Start
          </button>
          <button
            onClick={() => (sw.running ? sw.pause() : sw.start())}
            className={cn(
              "rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold",
              isLocked
                ? "bg-white/60 text-black/40"
                : "bg-white text-black/80 hover:bg-white/80"
            )}
            disabled={isLocked}
          >
            {sw.running ? "Pause" : "Resume"}
          </button>
          <button
            onClick={() => {
              sw.stop();
            }}
            className={cn(
              "rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold",
              isLocked
                ? "bg-white/60 text-black/40"
                : "bg-white text-black/80 hover:bg-white/80"
            )}
            disabled={isLocked}
          >
            Stop
          </button>
        </div>

        <div className="mt-1 grid grid-cols-2 gap-3">
          <button
            onClick={() => stopAndLog("PASS")}
            className={cn(
              "rounded-2xl px-4 py-3 text-sm font-semibold",
              isLocked
                ? "bg-emerald-500/20 text-emerald-900/40"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            )}
            disabled={isLocked || !canMarkResult}
            title={!canMarkResult ? "Start the timer before marking result" : undefined}
          >
            Pass
          </button>
          <button
            onClick={() => stopAndLog("FAIL")}
            className={cn(
              "rounded-2xl px-4 py-3 text-sm font-semibold",
              isLocked
                ? "bg-red-500/20 text-red-900/40"
                : "bg-red-600 text-white hover:bg-red-700"
            )}
            disabled={isLocked || !canMarkResult}
            title={!canMarkResult ? "Start the timer before marking result" : undefined}
          >
            Fail
          </button>
        </div>

        {lastLoggedRunId ? (
          <div className="mt-2 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm text-black/70">
            Logged run <span className="font-semibold">{lastLoggedRunId}</span> • Time:
            <span className="font-semibold"> {formatMMSS(sw.elapsed)}</span>
            {result === "FAIL" ? (
              <span>
                {" "}• <span className="font-semibold">Defect recommended</span>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {showChecklist ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as any }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-2xl border border-black/10 bg-white/70 p-4">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/60">
                  Checklist
                </div>
                <span className="text-[11px] font-semibold text-black/55">
                  {checked.filter(Boolean).length}/{checked.length}
                </span>
              </div>
              <ul className="mt-3 space-y-2">
                {checklistLabels.map((t, idx) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-black/70">
                    <button
                      onClick={() => toggleChecklist(idx)}
                      className={cn(
                        "mt-[3px] inline-flex h-5 w-5 items-center justify-center rounded-[8px] border border-black/20 bg-white transition",
                        checked[idx] ? "bg-black text-white" : "bg-white text-black"
                      )}
                      aria-label={`Toggle ${t}`}
                      type="button"
                    >
                      {checked[idx] ? "✓" : ""}
                    </button>
                    <span className={cn(checked[idx] ? "text-black/90" : "text-black/70")}>
                      {t}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showDefectForm && result === "FAIL" ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="mt-4 rounded-2xl border border-black/10 bg-white/80 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/60">
                  Defect Link
                </div>
                <div className="mt-1 text-sm font-semibold text-black/85">
                  Capture the failure and link it back to {linkedTestCaseId}
                </div>
              </div>
              <button
                onClick={() => setShowDefectForm(false)}
                className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-black/70 hover:bg-black/10"
              >
                Dismiss
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <input
                value={defectTitle}
                onChange={(e) => setDefectTitle(e.target.value)}
                placeholder="Defect title (e.g., Total mismatch when discount applied)"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="text-xs font-semibold text-black/60">Severity</label>
                <select
                  value={defectSeverity}
                  onChange={(e) => setDefectSeverity(e.target.value as Severity)}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                >
                  {(["Critical", "High", "Medium", "Low"] as const).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={logDefectForRun}
                  className="sm:ml-auto rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-black/90"
                >
                  Save defect
                </button>
              </div>
              <div className="text-xs text-black/55">
                (Demo) This will persist to localStorage and appear in Defect Tracker.
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function WorkPlanerPage() {
  const navigate = useNavigate();

  const TIME_ZONE = "Asia/Kolkata";
  const USER_NAME = "Prudhvi";

  const accent = "#ff2b2b";
  const paper = "#ead6d4";
  const grid = "rgba(255,43,43,0.14)";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [justLocked, setJustLocked] = useState<null | {
    status: "PASS" | "FAIL";
    runId: string;
  }>(null);

  const dayKey = useMemo(() => getDayKeyInTimeZone(TIME_ZONE), [TIME_ZONE]);

  useEffect(() => {
    ensureSeedTasksForToday(TIME_ZONE, 13);
    setTasks(loadTasks());
  }, [TIME_ZONE]);

  const todays = useMemo(() => tasks.filter((t) => t.dayKey === dayKey), [
    tasks,
    dayKey,
  ]);
  const totalAssigned = todays.length;
  const pending = useMemo(() => todays.filter((t) => t.status === "PENDING"), [
    todays,
  ]);
  const done = useMemo(() => todays.filter((t) => t.status === "DONE"), [todays]);
  const failed = useMemo(() => todays.filter((t) => t.status === "FAILED"), [
    todays,
  ]);

  const greeting = useMemo(() => getGreeting(USER_NAME, TIME_ZONE), [
    USER_NAME,
    TIME_ZONE,
  ]);

  function markNextTaskComplete(status: "PASS" | "FAIL") {
    const nextTasks = [...tasks];
    const idx = nextTasks.findIndex(
      (t) => t.dayKey === dayKey && t.status === "PENDING"
    );
    if (idx >= 0) {
      nextTasks[idx] = {
        ...nextTasks[idx],
        status: status === "PASS" ? "DONE" : "FAILED",
      };
      saveTasks(nextTasks);
      setTasks(nextTasks);
    }
  }

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: paper }}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, ${grid} 0 1px, transparent 1px 34px), repeating-linear-gradient(90deg, ${grid} 0 1px, transparent 1px 34px)`,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1100px 700px at 50% 10%, rgba(255,255,255,0.35), transparent 68%), radial-gradient(900px 600px at 50% 85%, rgba(0,0,0,0.06), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 pt-28 pb-16">
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 lg:col-span-7">
            <div
              className="text-[clamp(18px,2.1vw,34px)] font-semibold leading-tight"
              style={{
                color: accent,
                fontFamily: "ui-serif, Georgia, Times, serif",
              }}
            >
              What we do (when we stop thinking in circles):
            </div>

            <div
              className="mt-8 space-y-3 text-[clamp(44px,5.4vw,94px)] font-black leading-[0.94]"
              style={{
                color: accent,
                fontFamily: "ui-serif, Georgia, Times, serif",
              }}
            >
              <div>{greeting}</div>
              <div>
                You have{" "}
                <span className="underline decoration-transparent">&quot;{totalAssigned}&quot;</span>
              </div>
              <div>
                scenarios assigned today. <span className="font-black">{pending.length}</span> left.
              </div>
            </div>

            {justLocked ? (
              <div className="mt-8 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/50 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-black/60">
                  FINISHED {done.length + failed.length}
                </span>
                <span className="rounded-full bg-white/50 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-black/60">
                  PENDING {pending.length}
                </span>
                <span className="rounded-full bg-white/50 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-black/60">
                  PASS {done.length}
                </span>
                <span className="rounded-full bg-white/50 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-black/60">
                  FAIL {failed.length}
                </span>
              </div>
            ) : null}

            <div
              className="mt-10 max-w-[560px] text-sm leading-relaxed"
              style={{ color: "rgba(0,0,0,0.55)" }}
            >
              A focused execution board with a timer, scenario, and checklist — designed to connect outcomes back to
              <span className="font-semibold"> TestCases</span> and <span className="font-semibold">Defect Tracker</span>.
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/40 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-black/60">
                TODAY
              </span>
              <span className="rounded-full bg-white/40 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-black/60">
                SPRINT
              </span>
              <button
                onClick={() => navigate("/defect-tracker")}
                className="rounded-full bg-white/40 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-black/70 hover:bg-white/55"
              >
                OPEN DEFECTS
              </button>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 flex lg:justify-end">
            <div className="w-full lg:pt-6">
              <WorkPlannerFlashCard
                accent={accent}
                linkedTestCaseId="TC-142"
                onViewTestCase={() => navigate("/testcases")}
                onResultLocked={({ status, runId }) => {
                  setJustLocked({ status, runId });
                  markNextTaskComplete(status);
                }}
              />

              {justLocked ? (
                <div className="mt-4 rounded-2xl border border-black/10 bg-white/60 p-4 text-sm text-black/70">
                  Last result: <span className="font-semibold">{justLocked.status}</span> •
                  <span className="font-semibold"> {justLocked.runId}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const key = location.pathname;

  useEffect(() => {
    const prev = document.body.style.overflow;
    if (menuOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <TopNav onOpen={() => setMenuOpen(true)} open={menuOpen} />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-12%] top-[-10%] h-[420px] w-[420px] rounded-full bg-neutral-100 blur-3xl" />
        <div className="absolute right-[-10%] top-[10%] h-[520px] w-[520px] rounded-full bg-neutral-100 blur-3xl" />
      </div>

      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as any }}
          >
            <Routes location={location}>
              <Route path="/" element={<Navigate to="/testcases" replace />} />
              <Route path="/testcases" element={<TestCasesPage />} />
              <Route path="/automation-metrics" element={<AutomationMetricsPage />} />
              <Route path="/team-analytics" element={<TeamAnalyticsPage />} />
              <Route path="/work-planer" element={<WorkPlanerPage />} />
              <Route path="/test-suite-manager" element={<TestSuiteManagerPage />} />
              <Route path="/user-management" element={<UserManagementPage />} />
              <Route path="/defect-tracker" element={<DefectTrackerPage />} />
              <Route path="*" element={<Navigate to="/testcases" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}

function runSelfTests() {
  const colors = new Set(MENU_ITEMS.map((x) => x.color));
  console.assert(
    colors.size === MENU_ITEMS.length,
    "Each menu item must have a unique color"
  );

  const out = blend("#ffffff", "#000000", 0.5);
  console.assert(/^#[0-9a-f]{6}$/i.test(out), "blend() should return a hex color");

  console.assert(
    MENU_ITEMS[0].key === "testcases",
    "First menu item should be TestCases"
  );

  console.assert(
    MENU_ITEMS.some((x) => x.path === "/defect-tracker"),
    "MENU_ITEMS must include /defect-tracker"
  );

  console.assert(formatMMSS(0) === "00:00", "formatMMSS(0) should be 00:00");
  console.assert(formatMMSS(65) === "01:05", "formatMMSS(65) should be 01:05");

  try {
    const before = loadScenarioRuns().length;
    appendScenarioRun({
      id: "RUN-TEST",
      scenarioTitle: "t",
      status: "PASS",
      elapsedSeconds: 1,
      checklist: [{ label: "x", checked: true }],
      createdAtIso: new Date().toISOString(),
    });
    const after = loadScenarioRuns().length;
    console.assert(after >= before, "appendScenarioRun should add or keep size");
  } catch {
    console.assert(false, "Scenario run storage should not throw");
  }

  console.assert(
    getAllDefects().length >= BASE_DEFECTS.length,
    "getAllDefects should include base defects"
  );

  console.assert(
    /^\d{4}-\d{2}-\d{2}$/.test(getDayKeyInTimeZone("Asia/Kolkata")),
    "getDayKeyInTimeZone should return YYYY-MM-DD"
  );

  console.assert(
    getGreeting("Prudhvi", "Asia/Kolkata").includes("Prudhvi"),
    "Greeting should include user name"
  );

  try {
    ensureSeedTasksForToday("Asia/Kolkata", 13);
    const dayKey = getDayKeyInTimeZone("Asia/Kolkata");
    const todays = loadTasks().filter((t) => t.dayKey === dayKey);
    console.assert(todays.length >= 13, "Should seed at least 13 tasks for today");
  } catch {
    console.assert(false, "Task seeding should not throw");
  }
}

declare global {
  interface Window {
    __RUN_QAHUB_TESTS__?: boolean;
  }
}

function SelfTestRunner() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.__RUN_QAHUB_TESTS__) {
      runSelfTests();
    }
  }, []);
  return null;
}

export default function App() {
  return (
    <>
      <LocalFonts />
      <BrowserRouter>
        <SelfTestRunner />
        <Shell />
      </BrowserRouter>
    </>
  );
}
