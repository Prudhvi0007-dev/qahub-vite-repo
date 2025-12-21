import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { saveTestPlanToFolder, generatePlanId, formatDate, loadFolders, saveFolders, type Folder } from "./testPlanStorage";

/**
 * Single-file React UI that mimics the referenced yellow MindMarket video style.
 * - Bright yellow stage
 * - Top nav with pill actions
 * - Huge headline with green squiggle underline (animated)
 * - "Create new Test plan" opens a full-screen (or window) create form
 * - Top outline (tabs) auto-highlights while scrolling (scroll-spy)
 */

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/**
 * Calculate end date by adding business days to start date
 * Excludes weekends (Saturday = 6, Sunday = 0)
 */
function addBusinessDays(startDate: Date, numberOfDays: number): Date {
  const result = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < numberOfDays) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }

  return result;
}

/**
 * Format date to YYYY-MM-DD for input[type="date"]
 */
function formatDateToInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const WaveUnderline = ({ className = "" }: { className?: string }) => (
  <span aria-hidden className={clsx("underline-wave", className)} />
);

const IconArrow = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M7 10L12 15L17 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconCheck = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M20 6L9 17L4 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Section = ({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="scroll-mt-32">
    <div className="flex items-start justify-between gap-6">
      <div>
        <h3 className="text-[18px] font-semibold tracking-tight text-neutral-900">{title}</h3>
        {hint ? (
          <p className="mt-1 text-[12px] leading-5 text-neutral-600 max-w-[64ch]">{hint}</p>
        ) : null}
      </div>
    </div>
    <div className="mt-3">{children}</div>
  </section>
);

const Field = ({
  label,
  required,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) => (
  <label className="block">
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold text-neutral-700">{label}</span>
      {required ? <span className="text-[11px] text-rose-500">*</span> : null}
    </div>
    <div className="relative mt-2">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[10px] bg-white px-4 py-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_0_rgba(0,0,0,0.08)] outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#76D85B] focus:ring-offset-2 focus:ring-offset-transparent transition"
        style={type === "date" ? {
          colorScheme: "light",
        } : undefined}
      />
      {type === "date" && (
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      )}
    </div>
  </label>
);

const Select = ({
  label,
  required,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  options?: string[];
  placeholder?: string;
}) => (
  <label className="block">
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold text-neutral-700">{label}</span>
      {required ? <span className="text-[11px] text-rose-500">*</span> : null}
    </div>
    <div className="relative mt-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-[10px] bg-white px-4 py-3 pr-10 text-[13px] text-neutral-900 shadow-[0_1px_0_rgba(0,0,0,0.08)] outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#76D85B] focus:ring-offset-2 focus:ring-offset-transparent transition"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <IconArrow className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" />
    </div>
  </label>
);

function CheckboxRow({
  checked,
  onChange,
  label,
  sub,
  days,
  onDaysChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub?: string;
  days?: number;
  onDaysChange?: (days: number) => void;
}) {
  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers
    if (value === '' || /^\d+$/.test(value)) {
      onDaysChange?.(value === '' ? 0 : parseInt(value, 10));
    }
  };

  return (
    <div className="group rounded-[10px] px-3 py-2 hover:bg-black/5 transition">
      <label className="flex items-start gap-3 cursor-pointer">
        <span
          className={clsx(
            "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-[6px] ring-1 ring-black/15 bg-white shadow-[0_1px_0_rgba(0,0,0,0.08)] transition",
            checked ? "bg-[#76D85B] text-black ring-black/10" : "text-transparent"
          )}
          onClick={(e) => {
            e.preventDefault();
            onChange(!checked);
          }}
        >
          <IconCheck className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium text-neutral-900">{label}</span>
          {sub ? <span className="block text-[12px] text-neutral-600 leading-5">{sub}</span> : null}
        </span>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      </label>
      {onDaysChange !== undefined && (
        <div className="mt-2 ml-8 flex items-center gap-2">
          <span className="text-[11px] text-neutral-700">Days:</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={days || 0}
            onChange={handleDaysChange}
            onClick={(e) => e.stopPropagation()}
            className="w-20 rounded-[8px] bg-white px-2 py-1 text-[12px] text-neutral-900 shadow-[0_1px_0_rgba(0,0,0,0.08)] outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#76D85B] transition"
          />
        </div>
      )}
    </div>
  );
}

const PillButton = ({
  children,
  onClick,
  variant = "dark",
  className = "",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "dark" | "green" | "ghost";
  className?: string;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={clsx(
      "inline-flex items-center gap-2 rounded-[999px] px-4 py-2 text-[12px] font-semibold tracking-tight transition active:scale-[0.98]",
      variant === "dark" &&
        "bg-white text-neutral-900 ring-1 ring-black/10 shadow-[0_1px_0_rgba(0,0,0,0.08)] hover:bg-black/5",
      variant === "green" &&
        "bg-[#76D85B] text-neutral-900 ring-1 ring-black/10 shadow-[0_1px_0_rgba(0,0,0,0.08)] hover:brightness-[0.98]",
      variant === "ghost" && "bg-transparent text-neutral-900 hover:bg-black/5",
      disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      className
    )}
  >
    {children}
  </button>
);

type ModalMode = "fullscreen" | "window";

function Modal({
  open,
  onClose,
  children,
  titleId = "modal-title",
  mode = "fullscreen",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  titleId?: string;
  mode?: ModalMode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => panelRef.current?.focus());
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/35"
        onClick={() => {
          // Fullscreen feels like a dedicated page (disable outside click close)
          if (mode !== "fullscreen") onClose();
        }}
      />

      <div
        className={clsx(
          "absolute inset-0",
          mode === "fullscreen" ? "p-0" : "flex items-center justify-center px-3 py-4 sm:px-4 sm:py-5"
        )}
      >
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={clsx(
            mode === "fullscreen"
              ? "relative w-full h-full rounded-none bg-[#F4F2E6] overflow-hidden flex flex-col"
              : "relative w-full max-w-[1400px] rounded-[24px] bg-[#F4F2E6] shadow-[0_24px_90px_rgba(0,0,0,0.35)] ring-1 ring-black/10 overflow-hidden max-h-[calc(100vh-40px)] flex flex-col",
            "outline-none",
            "animate-[popIn_.22s_ease-out]"
          )}
        >
          <button
            onClick={onClose}
            className={clsx(
              "absolute right-5 top-5 z-20 h-14 w-14 rounded-full bg-[#F2EA14] ring-1 ring-black/10 shadow-[0_1px_0_rgba(0,0,0,0.08)] grid place-items-center hover:bg-white active:scale-[0.98] transition-all duration-300"
            )}
            aria-label="Close"
          >
            <span className="text-[24px] font-black leading-none text-neutral-900">×</span>
          </button>

          {children}
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { transform: translateY(10px) scale(.985); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const NAV_LINKS = [
  { label: "Suite Builder" },
  { label: "Suite Manager" },
  { label: "Test Execution" },
];

const STORAGE_KEY = "create-test-plan-draft";

type SavedDraft = {
  meta: any;
  scope: any;
  masterChecks: any;
  qaChecks: any;
  qaResources?: any;
  timeline: any;
  comments?: string;
  reviewDays?: number;
  savedAt: string;
};

function loadDraft(): SavedDraft | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error("Failed to load draft:", err);
  }
  return null;
}

function saveDraft(draft: Omit<SavedDraft, "savedAt">) {
  try {
    const toSave: SavedDraft = {
      ...draft,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    return true;
  } catch (err) {
    console.error("Failed to save draft:", err);
    return false;
  }
}

// --- Test Execution Components ---

type TestRun = {
  id: string;
  status: "STARTED" | "IN-PROGRESS" | "COMPLETED";
  date: string;
};

const testRunsData: TestRun[] = [
  { id: "run-1", status: "COMPLETED", date: "2025-12-19" },
  { id: "run-2", status: "IN-PROGRESS", date: "2025-12-20" },
  { id: "run-3", status: "STARTED", date: "2025-12-21" },
];

function TestExecutionFlow({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedTestRun, setSelectedTestRun] = useState<TestRun | null>(null);

  if (!open) {
    return null;
  }

  return (
    <>
      {!selectedTestRun ? (
        <TestRunSelectionScreen
          onClose={onClose}
          onSelectTestRun={(run) => setSelectedTestRun(run)}
        />
      ) : (
        <TestExecutionDetailScreen
          onClose={() => {
            setSelectedTestRun(null);
            onClose();
           }}
          testRun={selectedTestRun}
        />
      )}
    </>
  );
}

function TestRunSelectionScreen({
  onClose,
  onSelectTestRun,
}: {
  onClose: () => void;
  onSelectTestRun: (testRun: TestRun) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full h-full overflow-hidden bg-[#1c1c1c] text-[#e8e6dc] antialiased selection:bg-[#ff2b06] selection:text-white flex flex-col"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-start shrink-0">
          <div>
            <h3 className="text-2xl text-white font-light">Test Executions</h3>
            <p className="text-gray-400 text-sm mt-1">Select a test run to view details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {testRunsData.map((run) => (
              <motion.div
                key={run.id}
                onClick={() => onSelectTestRun(run)}
                className="bg-[#252525] border border-white/10 rounded-2xl shadow-lg p-6 cursor-pointer hover:bg-white/5 transition-colors h-fit"
                whileHover={{ y: -5 }}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-lg font-bold text-white">{run.id}</h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      run.status === "COMPLETED"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : run.status === "IN-PROGRESS"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    }`}
                  >
                    {run.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-2">{run.date}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const DETAIL_DAYS = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6"];

const DETAIL_SECTIONS = [
    { 
    id: 0, 
    title: "Planning", 
    subtitle: "Day 1 • Kickoff & Scope", 
    days: [0],
    manualCount: 8,
    autoCount: 0,
    qaResource: "Sarah Jenkins",
    testCases: [
      { 
        id: "TC-101", title: "Review PRD and Tech Spec", priority: "P0", tags: ["Doc", "Process"], 
        day: "Day 1", status: "Pass", time: "2h 30m", executedBy: "Sarah J." 
      },
      { 
        id: "TC-102", title: "Create Test Plan Document", priority: "P1", tags: ["Doc"], 
        day: "Day 1", status: "Pass", time: "4h 00m", executedBy: "Sarah J." 
      },
      { 
        id: "TC-103", title: "Setup Test Environment", priority: "P0", tags: ["Env", "DevOps"], 
        day: "Day 1", status: "Pass", time: "1h 15m", executedBy: "Mike C." 
      },
    ]
  },
  { 
    id: 1, 
    title: "Unit Tests", 
    subtitle: "Day 2 • Component Logic", 
    days: [1],
    manualCount: 0,
    autoCount: 42,
    qaResource: "Mike Chen",
    testCases: [
      { 
        id: "TC-201", title: "Unit: Auth Hook validation", priority: "P0", tags: ["Auth", "Unit"], 
        day: "Day 2", status: "Pass", time: "45ms", executedBy: "CI/CD" 
      },
      { 
        id: "TC-202", title: "Unit: Date formatting utilities", priority: "P2", tags: ["Utils", "Unit"], 
        day: "Day 2", status: "Pass", time: "12ms", executedBy: "CI/CD" 
      },
      { 
        id: "TC-203", title: "Unit: State management reducers", priority: "P1", tags: ["Redux", "Unit"], 
        day: "Day 2", status: "Pass", time: "89ms", executedBy: "CI/CD" 
      },
    ]
  },
  {
    id: 2,
    title: "Integration",
    subtitle: "Day 3 • API & Data Flow",
    days: [2],
    manualCount: 12,
    autoCount: 28,
    qaResource: "Mike Chen",
    testCases: [
      {
        id: "TC-301", title: "API: POST /login returns token", priority: "P0", tags: ["API", "Auth"],
        day: "Day 3", status: "Pass", time: "120ms", executedBy: "Postman"
      },
      {
        id: "TC-302", title: "API: User Profile sync", priority: "P1", tags: ["API", "Data"],
        day: "Day 3", status: "Fail", time: "5.2s", executedBy: "Postman"
      },
      {
        id: "TC-303", title: "Integration: Payment Gateway", priority: "P0", tags: ["Payment", "Ext"],
        day: "Day 3", status: "Pending", time: "-", executedBy: "-"
      },
    ]
  },
  {
    id: 3,
    title: "UI Validation",
    subtitle: "Day 4 • Frontend & Responsive",
    days: [3],
    manualCount: 35,
    autoCount: 15,
    qaResource: "Sarah Jenkins",
    testCases: [
      {
        id: "TC-401", title: "UI: Mobile Navigation Menu", priority: "P1", tags: ["UI", "Mobile"],
        day: "Day 4", status: "Fail", time: "15m", executedBy: "Sarah J."
      },
      {
        id: "TC-402", title: "UI: Dark Mode contrast check", priority: "P2", tags: ["UI", "A11y"],
        day: "Day 4", status: "Pass", time: "10m", executedBy: "Sarah J."
      },
      {
        id: "TC-403", title: "E2E: User Signup Flow", priority: "P0", tags: ["E2E", "Cypress"],
        day: "Day 4", status: "Pass", time: "45s", executedBy: "Cypress"
      },
    ]
  },
  {
    id: 4,
    title: "Non-Functional",
    subtitle: "Day 5 • Security & Load",
    days: [4],
    manualCount: 6,
    autoCount: 12,
    qaResource: "Alex Ro",
    testCases: [
      {
        id: "TC-501", title: "Sec: SQL Injection vulnerabilities", priority: "P0", tags: ["Sec", "OWASP"],
        day: "Day 5", status: "Pass", time: "1h", executedBy: "ZAP"
      },
      {
        id: "TC-502", title: "Perf: 10k concurrent users", priority: "P1", tags: ["Load", "k6"],
        day: "Day 5", status: "Pending", time: "-", executedBy: "-"
      },
      {
        id: "TC-503", title: "Sec: XSS header validation", priority: "P1", tags: ["Sec"],
        day: "Day 5", status: "Pass", time: "30m", executedBy: "Alex R."
      },
    ]
  },
  {
    id: 5,
    title: "Release",
    subtitle: "Day 6 • Final Regression",
    days: [5],
    manualCount: 14,
    autoCount: 150,
    qaResource: "Sarah Jenkins",
    testCases: [
      {
        id: "TC-601", title: "Smoke Test: Production Env", priority: "P0", tags: ["Smoke", "Prod"],
        day: "Day 6", status: "Scheduled", time: "-", executedBy: "-"
      },
      {
        id: "TC-602", title: "Full Regression Suite", priority: "P1", tags: ["Reg"],
        day: "Day 6", status: "Running", time: "2h...", executedBy: "Jenkins"
      },
      {
        id: "TC-603", title: "Release Notes Verification", priority: "P2", tags: ["Doc"],
        day: "Day 6", status: "Pending", time: "-", executedBy: "-"
      },
    ]
  }
];


function TestExecutionDetailScreen({ onClose, testRun }: { onClose: () => void, testRun: TestRun }) {
  const scrollRef = useRef(null);
  const [activeSection, setActiveSection] = useState(0);
  const [activeDay, setActiveDay] = useState(0);
  const [selectedSection, setSelectedSection] = useState<any>(null); 

  const { scrollYProgress } = useScroll({ container: scrollRef });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      // Calculate which day card the progress bar has reached
      // Day cards are positioned at 0%, 20%, 40%, 60%, 80%, 100%
      // Active day changes when progress bar reaches that day's position
      const numDays = DETAIL_DAYS.length;
      const progressPercent = v * 100;

      // Find which day position the progress bar has passed
      let newActiveDay = 0;
      for (let i = numDays - 1; i >= 0; i--) {
        const dayPosition = (i / (numDays - 1)) * 100;
        if (progressPercent >= dayPosition) {
          newActiveDay = i;
          break;
        }
      }

      setActiveDay(newActiveDay);

      // Set active section to match the active day
      // Left content changes at the same time as right day cards
      const sectionIndex = DETAIL_SECTIONS.findIndex(s => s.days.includes(newActiveDay));
      if (sectionIndex !== -1) {
        setActiveSection(sectionIndex);
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  const progressHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
        <div
            onClick={(e) => e.stopPropagation()}
            className="relative h-full w-full bg-[#1c1c1c] text-[#e8e6dc] antialiased selection:bg-[#ff2b06] selection:text-white"
        >
            {/* Floating Close Button */}
            <button
                onClick={onClose}
                className="fixed top-6 right-6 z-30 p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div
                ref={scrollRef}
                className="h-screen w-full overflow-y-auto bg-[#1c1c1c] text-[#e8e6dc] flex"
            >
                {/* Left Scroll Content */}
                <div className="flex-1 px-6 md:px-24 py-[35vh] space-y-[55vh]">
                {DETAIL_SECTIONS.map((s, i) => {
                    const yParallax = useTransform(
                    smoothProgress,
                    [0, 1],
                    [18 * (i + 1), -18 * (i + 1)]
                    );
                    const opacityParallax = useTransform(
                    smoothProgress,
                    [i / DETAIL_SECTIONS.length, (i + 0.4) / DETAIL_SECTIONS.length],
                    [0.3, 1]
                    );

                    return (
                    <motion.section
                        key={s.id}
                        style={{ y: yParallax, opacity: opacityParallax }}
                        initial={{ opacity: 0, y: 60 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ root: scrollRef, amount: 0.55 }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-[720px] mx-auto md:mx-0 cursor-pointer group"
                        onClick={() => setSelectedSection(s)}
                    >
                        <div className="flex items-center gap-3 mb-4">
                        <p className="text-sm font-medium tracking-wider uppercase text-gray-500">
                            {s.subtitle}
                        </p>
                        <div className="h-px bg-gray-800 flex-1 group-hover:bg-gray-700 transition-colors" />
                        </div>

                        <h2 className="text-5xl md:text-[64px] font-light tracking-tight leading-[1.1] group-hover:text-white transition-colors">
                        {s.title}
                        </h2>

                        <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                        <div>
                            <span className="block text-2xl font-light text-[#ff2b06]">{s.manualCount}</span>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Manual TCs</span>
                        </div>
                        <div>
                            <span className="block text-2xl font-light text-blue-400">{s.autoCount}</span>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Auto TCs</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white font-bold">
                                {s.qaResource.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span className="text-sm text-gray-300">{s.qaResource}</span>
                            </div>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Owner</span>
                        </div>
                        </div>

                        <div className="mt-6 flex items-center gap-2 text-sm text-[#ff2b06] transition-colors hover:text-[#ff5c3e]">
                        <span className="font-medium">View Details</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        </div>
                    </motion.section>
                    );
                })}
                <div className="h-[20vh]" />
                </div>

                {/* Right Vertical Timeline */}
                <div className="w-[140px] sticky top-0 h-screen flex items-center justify-center shrink-0 border-l border-white/5 bg-[#1c1c1c]">
                  <div className="relative h-[72%] w-[80px] rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden shadow-inner">
                    <motion.div
                      className="absolute top-0 left-0 right-0 bg-[#ff2b06]"
                      style={{ height: progressHeight }}
                    />
                    <div className="relative z-10 flex flex-col items-center justify-between h-full py-6">
                      {DETAIL_DAYS.map((d, i) => {
                        const isCompleted = i < activeDay;
                        const isActive = i === activeDay;
                        return (
                          <motion.div
                            key={d}
                            className="relative z-20"
                            animate={{ scale: isActive ? 1.05 : isCompleted ? 1.0 : 0.95 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                          >
                            <motion.div
                              className="w-16 h-8 rounded-full flex items-center justify-center text-[11px] font-bold tracking-tight shadow-sm"
                              animate={{
                                backgroundColor: isCompleted || isActive ? "#ff2b06" : "rgba(30,30,30,0.8)",
                                color: isCompleted || isActive ? "#ffffff" : "#666666",
                                border: isCompleted || isActive ? "1px solid #ff4d2e" : "1px solid rgba(255,255,255,0.1)",
                              }}
                              transition={{ duration: 0.25 }}
                            >
                              {d}
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
            </div>

            {/* Detail Modal Overlay */}
            <AnimatePresence>
                {selectedSection && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    onClick={() => setSelectedSection(null)}
                >
                    <motion.div
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.98, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-full bg-[#252525] overflow-hidden flex flex-col"
                    >
                    <div className="p-6 border-b border-white/10 flex justify-between items-start shrink-0">
                        <div>
                        <h3 className="text-2xl text-white font-light">{selectedSection.title}</h3>
                        <p className="text-gray-400 text-sm mt-1">Detailed Execution Report</p>
                        </div>
                        <button 
                        onClick={() => setSelectedSection(null)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                        >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        </button>
                    </div>
                    
                    <div className="p-0 overflow-auto">
                        <table className="w-full text-left text-sm text-gray-300 min-w-[1000px]">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                            <th className="px-6 py-4 font-medium">ID</th>
                            <th className="px-6 py-4 font-medium w-1/4">Title</th>
                            <th className="px-6 py-4 font-medium text-center">Priority</th>
                            <th className="px-6 py-4 font-medium">Tags</th>
                            <th className="px-6 py-4 font-medium">Day</th>
                            <th className="px-6 py-4 font-medium text-center">Status</th>
                            <th className="px-6 py-4 font-medium text-right">Time(s)</th>
                            <th className="px-6 py-4 font-medium">Executed By</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {selectedSection.testCases.map((tc: any) => (
                            <tr key={tc.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 font-mono text-gray-500 text-xs">{tc.id}</td>
                                <td className="px-6 py-4 font-medium text-white">{tc.title}</td>
                                <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    tc.priority === 'P0' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    tc.priority === 'P1' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}>
                                    {tc.priority}
                                </span>
                                </td>
                                <td className="px-6 py-4">
                                <div className="flex gap-1 flex-wrap">
                                    {tc.tags.map((tag:string) => (
                                    <span key={tag} className="px-1.5 py-0.5 rounded-sm bg-gray-800 text-gray-400 text-[10px] border border-gray-700">
                                        {tag}
                                    </span>
                                    ))}
                                </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs">{tc.day}</td>
                                <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    tc.status === 'Pass' ? 'bg-green-500/10 text-green-400' :
                                    tc.status === 'Fail' ? 'bg-red-500/10 text-red-400' :
                                    tc.status === 'Running' ? 'bg-blue-500/10 text-blue-400' :
                                    'bg-gray-500/10 text-gray-400'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                    tc.status === 'Pass' ? 'bg-green-500' :
                                    tc.status === 'Fail' ? 'bg-red-500' :
                                    tc.status === 'Running' ? 'bg-blue-400 animate-pulse' :
                                    'bg-gray-500'
                                    }`} />
                                    {tc.status}
                                </span>
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-xs text-gray-400">{tc.time}</td>
                                <td className="px-6 py-4 text-xs">
                                <div className="flex items-center gap-2">
                                    {tc.executedBy !== '-' && (
                                    <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[9px] text-white">
                                        {tc.executedBy.charAt(0)}
                                    </div>
                                    )}
                                    <span>{tc.executedBy}</span>
                                </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button title="Execute Test" className="p-1.5 rounded-full bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white transition-all">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                    </button>
                                    <button title="View Details" className="p-1.5 rounded-full bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    </button>
                                </div>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-black/20 border-t border-white/5 flex justify-end gap-3 shrink-0">
                        <button className="px-4 py-2 rounded text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                        Export CSV
                        </button>
                        <button className="px-4 py-2 rounded text-sm font-medium bg-[#ff2b06] text-white hover:bg-[#d92405] transition-colors shadow-lg shadow-red-900/20">
                        Run All Tests
                        </button>
                    </div>
                    </motion.div>
                </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
}


export default function CreateTestPlanPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("fullscreen");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [showNewFolderInput, setShowNewFolderInput] = useState<boolean>(false);
  const [testExecutionOpen, setTestExecutionOpen] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewPlanData, setPreviewPlanData] = useState<any>(null);

  // Filter states
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-11
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban'); // Default to kanban

  // Top outline scroll-spy
  const [activeSection, setActiveSection] = useState("meta");
  const modalScrollRef = useRef<HTMLDivElement | null>(null);
  const isManualScrollRef = useRef(false);

  const OUTLINE_SECTIONS = useMemo(
    () => [
      { id: "meta", label: "Project details" },
      { id: "scope", label: "Scope & objectives" },
      { id: "checklists", label: "Checklists" },
      { id: "schedule", label: "Schedule" },
      { id: "comments", label: "Comments" },
    ],
    []
  );

  // minimal model for the form
  const [meta, setMeta] = useState({
    projectName: "",
    projectNumber: "",
    projectManager: "",
    date: new Date().toISOString().split('T')[0], // Auto-populate with today's date
    version: "",
    status: "Draft",
    documentId: "",
    projectId: "",
    businessUnit: "",
    sprintNumber: "",
  });

  const [qaResources, setQaResources] = useState<{ [key: string]: boolean }>({
    "QA Lead": false,
    "QA Analyst 1": false,
    "QA Analyst 2": false,
    "Automation Engineer": false,
    "Performance Tester": false,
  });

  const [scope, setScope] = useState({
    overview: "",
    inScope: "",
    outScope: "",
    objectives: "",
  });

  const [masterChecks, setMasterChecks] = useState({
    unit: { checked: true, days: 0 },
    functional: { checked: true, days: 0 },
    regression: { checked: true, days: 0 },
    load: { checked: false, days: 0 },
    volume: { checked: false, days: 0 },
    acceptance: { checked: true, days: 0 },
    usability: { checked: true, days: 0 },
  });

  const [reviewDays, setReviewDays] = useState(0);

  const [qaChecks, setQaChecks] = useState({
    framework: false,
    ide: false,
    decouple: false,
    concurrent: false,
    passwords: false,
    logging: false,
    modular: false,
    consistency: false,
    validations: false,
    owasp: false,
  });

  const [timeline, setTimeline] = useState({
    start: "",
    end: "",
    dependencies: "",
  });

  const [comments, setComments] = useState("");
  const [manualTestCount, setManualTestCount] = useState(0);
  const [automatedTestCount, setAutomatedTestCount] = useState(0);

  // Load draft and folders on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setMeta(draft.meta);
      setScope(draft.scope);
      if (draft.comments) setComments(draft.comments);
      setMasterChecks(draft.masterChecks);
      setQaChecks(draft.qaChecks);
      setTimeline(draft.timeline);
      if (draft.reviewDays !== undefined) {
        setReviewDays(draft.reviewDays);
      }
      if (draft.qaResources !== undefined) {
        setQaResources(draft.qaResources);
      }
    }

    loadFoldersData();
  }, []);

  const loadFoldersData = () => {
    const loadedFolders = loadFolders();
    setFolders(loadedFolders);
    if (loadedFolders.length > 0) {
      setSelectedFolderId(loadedFolders[0].id);
    }
  };

  // Filter folders by selected year and month
  const filteredFolders = useMemo(() => {
    return folders.map(folder => ({
      ...folder,
      plans: folder.plans.filter(plan => {
        const planDate = new Date(plan.createdAtMs);
        return planDate.getFullYear() === selectedYear && planDate.getMonth() === selectedMonth;
      })
    }));
  }, [folders, selectedYear, selectedMonth]);

  // Group all filtered plans by status for Kanban view
  const plansByStatus = useMemo(() => {
    const allPlans = filteredFolders.flatMap(folder =>
      folder.plans.map(plan => ({ ...plan, folderName: folder.name }))
    );

    return {
      'Draft': allPlans.filter(p => p.meta?.status === 'Draft' || !p.meta?.status),
      'Approved': allPlans.filter(p => p.meta?.status === 'Approved'),
      'Signed-off': allPlans.filter(p => p.meta?.status === 'Signed-off'),
    };
  }, [filteredFolders]);

  // Auto-calculate timeline dates based on days entered
  useEffect(() => {
    try {
      // Calculate total days from all checked phases plus review days
      const totalTestDays = Object.values(masterChecks).reduce((sum, phase) => {
        if (phase && typeof phase === 'object' && 'checked' in phase && 'days' in phase) {
          return sum + (phase.checked ? (phase.days || 0) : 0);
        }
        return sum;
      }, 0);

      const totalDays = totalTestDays + (reviewDays || 0);

      if (totalDays > 0) {
        const today = new Date();
        const startDate = today;
        const endDate = addBusinessDays(startDate, totalDays);

        setTimeline((prev) => ({
          ...prev,
          start: formatDateToInput(startDate),
          end: formatDateToInput(endDate),
        }));
      }
    } catch (error) {
      console.error('Error calculating timeline:', error);
    }
  }, [masterChecks, reviewDays]);

  const handleSave = () => {
    setSaveStatus("saving");
    const success = saveDraft({
      meta,
      scope,
      masterChecks,
      qaChecks,
      qaResources,
      timeline,
      comments,
      reviewDays,
    });

    if (success) {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } else {
      setSaveStatus("idle");
    }
  };

  const handleSaveAndClose = () => {
    handleSave();
    setTimeout(() => setOpen(false), 500);
  };

  const handleSaveCompletePlan = () => {
    // Validate required fields
    if (!meta.projectName || meta.projectName.trim().length < 3) {
      alert("Please enter a project name (at least 3 characters)");
      return;
    }

    setSaveStatus("saving");

    const now = formatDate();
    const planId = generatePlanId();

    // Convert CreateTestPlan data to TestPlan format
    const testPlan = {
      id: planId,
      name: meta.projectName,
      owner: meta.projectManager || "—",
      createdAtMs: now.ms,
      updatedAtMs: now.ms,
      createdAtLabel: now.label,
      updatedAtLabel: now.label,
      sections: {
        Overview: scope.overview,
        "In Scope": scope.inScope,
        "Out of Scope": scope.outScope,
        Objectives: scope.objectives,
        "Schedule Dependencies": timeline.dependencies,
        Comments: comments,
      },
      manualTestCount,
      automatedTestCount,
      meta,
      scope,
      masterChecks,
      qaChecks,
      timeline,
      comments,
    };

    const success = saveTestPlanToFolder(testPlan, selectedFolderId);

    if (success) {
      setSaveStatus("saved");
      // Clear the draft from localStorage after successful save
      localStorage.removeItem(STORAGE_KEY);

      // Reload folders to show the new plan
      loadFoldersData();

      setTimeout(() => {
        setSaveStatus("idle");
        resetForm();
        setOpen(false);
        alert(`Test plan "${meta.projectName}" saved successfully!`);
      }, 1000);
    } else {
      setSaveStatus("idle");
      alert("Failed to save test plan. Please try again.");
    }
  };

  const handleCreateNewFolder = () => {
    if (!newFolderName || newFolderName.trim().length < 2) {
      alert("Please enter a folder name (at least 2 characters)");
      return;
    }

    const newFolderId = `f_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
    const newFolder = {
      id: newFolderId,
      name: newFolderName.trim(),
      badge: "0",
      plans: [],
    };

    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    saveFolders(updatedFolders);
    setSelectedFolderId(newFolderId);
    setNewFolderName("");
    setShowNewFolderInput(false);
  };

  const computed = useMemo(() => {
    try {
      const totalMaster = Object.keys(masterChecks || {}).length;
      const doneMaster = Object.values(masterChecks || {}).filter((v) => v && v.checked).length;
      const totalQA = Object.keys(qaChecks || {}).length;
      const doneQA = Object.values(qaChecks || {}).filter(Boolean).length;
      const total = totalMaster + totalQA;
      return {
        doneMaster,
        totalMaster,
        doneQA,
        totalQA,
        progress: total > 0 ? Math.round(((doneMaster + doneQA) / total) * 100) : 0,
      };
    } catch (error) {
      console.error('Error computing progress:', error);
      return {
        doneMaster: 0,
        totalMaster: 0,
        doneQA: 0,
        totalQA: 0,
        progress: 0,
      };
    }
  }, [masterChecks, qaChecks]);

  // Scroll-spy: observe section headings within the modal scroll container
  useEffect(() => {
    if (!open) return;

    // Wait for the modal to render and sections to be available
    const timer = setTimeout(() => {
      const root = modalScrollRef.current;
      if (!root) return;

      const elements = OUTLINE_SECTIONS.map((s) => document.getElementById(s.id)).filter(
        (x): x is HTMLElement => Boolean(x)
      );
      if (!elements.length) return;

      // Manual scroll detection - more reliable than IntersectionObserver for this use case
      const handleScroll = () => {
        if (!root) return;

        // Skip auto-detection if user manually clicked
        if (isManualScrollRef.current) {
          return;
        }

        const { scrollTop, scrollHeight, clientHeight } = root;

        // Check if we're at the bottom
        if (scrollTop + clientHeight >= scrollHeight - 100) {
          setActiveSection(OUTLINE_SECTIONS[OUTLINE_SECTIONS.length - 1].id);
          return;
        }

        // Find which section is currently most visible in viewport
        const containerTop = root.getBoundingClientRect().top;
        const threshold = containerTop + 160; // Match the scroll offset

        for (let i = elements.length - 1; i >= 0; i--) {
          const element = elements[i];
          if (!element) continue;

          const rect = element.getBoundingClientRect();

          // If this section is above or at the threshold, it's the active one
          if (rect.top <= threshold) {
            setActiveSection(element.id);
            return;
          }
        }

        // If none found, activate the first section
        if (elements[0]) {
          setActiveSection(elements[0].id);
        }
      };

      // Run once on mount
      handleScroll();

      root.addEventListener('scroll', handleScroll);

      // Cleanup function
      return () => {
        root.removeEventListener('scroll', handleScroll);
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [open, OUTLINE_SECTIONS]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    const container = modalScrollRef.current;
    if (!el || !container) return;

    // Set flag to prevent scroll handler from interfering
    isManualScrollRef.current = true;

    // Calculate position relative to scroll container
    const containerRect = container.getBoundingClientRect();
    const elementRect = el.getBoundingClientRect();
    // Use a smaller offset to ensure we don't overshoot
    const scrollOffset = elementRect.top - containerRect.top + container.scrollTop - 80;

    container.scrollTo({
      top: scrollOffset,
      behavior: "smooth"
    });

    // Immediately set the active section when clicking
    setActiveSection(id);

    // Re-enable auto-detection after scroll completes
    setTimeout(() => {
      isManualScrollRef.current = false;
    }, 1000);
  };

  const resetForm = () => {
    setMeta({
      projectName: "",
      projectNumber: "",
      projectManager: "",
      date: new Date().toISOString().split('T')[0], // Auto-populate with today's date
      version: "",
      status: "Draft",
      documentId: "",
      projectId: "",
      businessUnit: "",
      sprintNumber: "",
    });
    setScope({ overview: "", inScope: "", outScope: "", objectives: "" });
    setTimeline({ start: "", end: "", dependencies: "" });
    setComments("");
    setManualTestCount(0);
    setAutomatedTestCount(0);
  };

  return (
    <div className="min-h-screen w-screen bg-black">
      <style>{`
        /* Underline wave (CSS background SVG) */
        .underline-wave {
          display: block;
          position: absolute;
          left: var(--wave-w);
          right: var(--wave-w);
          bottom: var(--wave-bottom-position);
          height: var(--wave-h);
          background-image: var(--wave-svg);
          background-repeat: repeat-x;
          background-size: 64px var(--wave-h);
          background-position: 0 50%;
          transform: translateY(0);
          will-change: background-position, transform;
          animation: underlineMove 1.25s linear infinite, underlineFloat 2.4s ease-in-out infinite;
          opacity: 1;
          z-index: 0;
        }

        /* Text above wave (no clipping) */
        .underline-wrap {
          position: relative;
          display: inline-block;
          padding-bottom: 14px;
        }
        .underline-text { position: relative; z-index: 1; }

        @keyframes underlineMove {
          from { background-position-x: 0; }
          to { background-position-x: -64px; }
        }
        @keyframes underlineFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(1.6px); }
          100% { transform: translateY(0px); }
        }

        /* Defaults (mobile/tablet) */
        .underline-wave {
          --wave-h: 16px;
          --wave-w: -36px;
          --wave-bottom-position: -6px;
          --wave-svg: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 20'><path d='M0,5.7c16,0,16,8.8,32.1,8.8s16-8.8,32.1-8.8' fill='none' stroke='%2376D85B' stroke-width='10' stroke-linecap='round'/></svg>");
        }

        /* Match your ref snippet at >=700px */
        @media (min-width: 700px) {
          .underline-wave {
            --wave-h: 20px;
            --wave-w: -5px;
            --wave-bottom-position: -8px;
            --wave-svg: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 20'><path d='M0,5.7c16,0,16,8.8,32.1,8.8s16-8.8,32.1-8.8' fill='none' stroke='%2376D85B' stroke-width='10' stroke-linecap='round'/></svg>");
          }
        }

        /* custom scrollbar (WebKit) */
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,.18); border-radius: 999px; border: 3px solid rgba(244,242,230,1); }
        ::-webkit-scrollbar-track { background: transparent; }

        /* Date input styling */
        input[type="date"] {
          position: relative;
        }

        input[type="date"]::-webkit-calendar-picker-indicator {
          position: absolute;
          right: 12px;
          opacity: 0;
          cursor: pointer;
          width: 20px;
          height: 20px;
        }

        /* Style the date input text */
        input[type="date"]::-webkit-datetime-edit {
          padding-right: 8px;
        }

        input[type="date"]::-webkit-datetime-edit-fields-wrapper {
          padding: 0;
        }

        input[type="date"]::-webkit-datetime-edit-text {
          color: rgba(0, 0, 0, 0.4);
          padding: 0 0.2em;
        }

        input[type="date"]::-webkit-datetime-edit-month-field,
        input[type="date"]::-webkit-datetime-edit-day-field,
        input[type="date"]::-webkit-datetime-edit-year-field {
          color: rgb(23, 23, 23);
          padding: 0 0.2em;
        }

        input[type="date"]::-webkit-datetime-edit-month-field:focus,
        input[type="date"]::-webkit-datetime-edit-day-field:focus,
        input[type="date"]::-webkit-datetime-edit-year-field:focus {
          background-color: rgba(118, 216, 91, 0.2);
          color: rgb(23, 23, 23);
          outline: none;
          border-radius: 4px;
        }

        /* Print styles for PDF export */
        @media print {
          /* Hide elements with print-hide class and the background app */
          .print-hide {
            display: none !important;
          }

          /* Hide the backdrop overlay */
          body > div > div:first-child > div > div:first-child.fixed.inset-0.z-\\[60\\] {
            background: transparent !important;
            backdrop-filter: none !important;
          }

          /* Make the print content take full page */
          .print-content {
            position: static !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            overflow: visible !important;
            height: auto !important;
            flex: none !important;
          }

          /* Ensure content is visible and properly formatted */
          .print-content > div {
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 20px !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
          }

          /* Ensure all sections are visible */
          .print-content section {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Ensure content fits properly */
          @page {
            margin: 1.5cm;
            size: A4;
          }
        }
      `}</style>

      {/* Outer stage */}
      <div className="w-full min-h-screen bg-[#F4F2E6] overflow-hidden print-hide">
        {/* Top nav */}
        <div className="flex items-center justify-between gap-4 px-8 sm:px-14 py-8">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-[12px] bg-white ring-1 ring-black/10 grid place-items-center shadow-[0_1px_0_rgba(0,0,0,0.08)]">
              <span className="text-[14px] font-extrabold text-neutral-900">TP</span>
            </div>
            <div className="leading-tight">
              <div className="text-[13px] font-semibold text-neutral-900">TestPlanner</div>
              <div className="text-[11px] text-neutral-800/70">Strategy • Plans • Checklists</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-[12px] font-semibold text-neutral-900">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                className="hover:opacity-80 transition"
                onClick={() => {
                  if (link.label === "Test Execution") {
                    setTestExecutionOpen(true);
                  }
                }}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#76D85B] ring-1 ring-black/10 shadow-[0_1px_0_rgba(0,0,0,0.08)] hover:brightness-[0.98] active:scale-[0.98] transition"
              aria-label="Menu"
              onClick={() => navigate('/testcases')}
            >
              <div className="grid gap-1">
                <span className="h-[2px] w-4 bg-neutral-900 rounded" />
                <span className="h-[2px] w-4 bg-neutral-900 rounded" />
                <span className="h-[2px] w-4 bg-neutral-900 rounded" />
              </div>
            </button>

            <PillButton
              variant="dark"
              onClick={() => {
                setModalMode("fullscreen");
                setOpen(true);
              }}
              className="h-9"
            >
              Create new Test plan
              <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white ring-1 ring-black/10">
                <span className="text-[12px] font-black leading-none">+</span>
              </span>
            </PillButton>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 sm:px-14 pb-14 pt-8">
          {/* Saved Test Plans Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[28px] font-black text-neutral-900 tracking-tight">
                  Saved Test Plans
                </h2>
                <p className="text-[12px] text-neutral-900/70 mt-1">
                  Showing {filteredFolders.reduce((sum, f) => sum + f.plans.length, 0)} of {folders.reduce((sum, f) => sum + f.plans.length, 0)} test plans
                </p>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2 rounded-[12px] bg-white/70 ring-1 ring-black/10 p-1 shadow-[0_1px_0_rgba(0,0,0,0.08)]">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-[8px] text-[11px] font-semibold transition ${
                    viewMode === 'list'
                      ? 'bg-neutral-900 text-white shadow-[0_1px_0_rgba(0,0,0,0.08)]'
                      : 'text-neutral-700 hover:bg-black/5'
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-4 py-2 rounded-[8px] text-[11px] font-semibold transition ${
                    viewMode === 'kanban'
                      ? 'bg-neutral-900 text-white shadow-[0_1px_0_rgba(0,0,0,0.08)]'
                      : 'text-neutral-700 hover:bg-black/5'
                  }`}
                >
                  Kanban View
                </button>
              </div>
            </div>

            {/* Year and Month Filter */}
            <div className="mb-6 rounded-[18px] bg-white/70 ring-1 ring-black/10 p-4 shadow-[0_1px_0_rgba(0,0,0,0.08)]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="text-[12px] font-semibold text-neutral-900">Filter by:</div>

                {/* Year Selector */}
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-neutral-700">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="rounded-[8px] bg-white px-3 py-1.5 text-[12px] text-neutral-900 shadow-[0_1px_0_rgba(0,0,0,0.08)] outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#76D85B] transition"
                  >
                    {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Month Selector */}
                <div className="flex items-center gap-2 flex-1 overflow-x-auto">
                  <label className="text-[11px] font-semibold text-neutral-700 shrink-0">Month</label>
                  <div className="flex gap-1.5">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                      <button
                        key={month}
                        onClick={() => setSelectedMonth(index)}
                        className={`shrink-0 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold transition ${
                          selectedMonth === index
                            ? 'bg-[#76D85B] text-neutral-900 ring-1 ring-black/15 shadow-[0_1px_0_rgba(0,0,0,0.08)]'
                            : 'bg-white text-neutral-700 ring-1 ring-black/10 hover:bg-black/5'
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Filter */}
                <button
                  onClick={() => {
                    setSelectedYear(currentDate.getFullYear());
                    setSelectedMonth(currentDate.getMonth());
                  }}
                  className="text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 transition shrink-0"
                >
                  Reset
                </button>
              </div>
            </div>

            {folders.length === 0 ? (
              <div className="rounded-[18px] bg-white/70 ring-1 ring-black/10 p-8 text-center">
                <p className="text-[13px] text-neutral-900/70">No test plans saved yet. Create your first test plan to get started!</p>
              </div>
            ) : filteredFolders.every(f => f.plans.length === 0) ? (
              <div className="rounded-[18px] bg-white/70 ring-1 ring-black/10 p-8 text-center">
                <p className="text-[13px] text-neutral-900/70">No test plans found for {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]} {selectedYear}.</p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-8">
                {filteredFolders.map((folder) => (
                  <div key={folder.id}>
                    {folder.plans.length > 0 && (
                      <>
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-[16px] font-bold text-neutral-900">{folder.name}</h3>
                          <span className="rounded-full bg-white/70 ring-1 ring-black/10 px-3 py-1 text-[11px] font-semibold text-neutral-900">
                            {folder.plans.length} {folder.plans.length === 1 ? 'plan' : 'plans'}
                          </span>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {folder.plans.map((plan) => (
                            <div
                              key={plan.id}
                              className="group rounded-[18px] bg-white/70 ring-1 ring-black/10 p-5 shadow-[0_1px_0_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-[14px] font-bold text-neutral-900 truncate">
                                    {plan.name}
                                  </h4>
                                  <p className="text-[11px] text-neutral-900/60 mt-1">
                                    Owner: {plan.owner}
                                  </p>
                                </div>
                                <div className="shrink-0">
                                  <span className="inline-block px-2 py-1 rounded-md bg-[#76D85B]/20 text-[10px] font-semibold text-[#76D85B]">
                                    Saved
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-black/10">
                                <div className="flex items-center justify-between text-[10px] text-neutral-900/60 mb-3">
                                  <span>Created: {new Date(plan.createdAtMs).toLocaleDateString()}</span>
                                  <span>Updated: {new Date(plan.updatedAtMs).toLocaleDateString()}</span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mb-4">
                                  <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">
                                    <div className="text-[16px] font-bold text-blue-700">
                                      {(plan.manualTestCount || 0) + (plan.automatedTestCount || 0)}
                                    </div>
                                    <div className="text-[9px] font-semibold text-blue-600 mt-0.5">Total Tests</div>
                                  </div>
                                  <div className="rounded-lg bg-purple-50 px-3 py-2 text-center">
                                    <div className="text-[16px] font-bold text-purple-700">{plan.manualTestCount || 0}</div>
                                    <div className="text-[9px] font-semibold text-purple-600 mt-0.5">Manual</div>
                                  </div>
                                  <div className="rounded-lg bg-green-50 px-3 py-2 text-center">
                                    <div className="text-[16px] font-bold text-green-700">{plan.automatedTestCount || 0}</div>
                                    <div className="text-[9px] font-semibold text-green-600 mt-0.5">Automated</div>
                                  </div>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewPlanData(plan);
                                    setShowPreview(true);
                                  }}
                                  className="w-full px-4 py-2 rounded-[10px] bg-neutral-900 text-white text-[12px] font-semibold hover:bg-neutral-800 transition-colors"
                                >
                                  Preview
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Kanban View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(['Draft', 'Approved', 'Signed-off'] as const).map((status) => (
                  <div key={status} className="flex flex-col">
                    {/* Column Header */}
                    <div className="rounded-t-[18px] bg-white/70 ring-1 ring-black/10 p-4 shadow-[0_1px_0_rgba(0,0,0,0.08)]">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[14px] font-bold text-neutral-900">{status}</h3>
                        <span className="rounded-full bg-neutral-900 text-white px-2.5 py-1 text-[10px] font-semibold">
                          {plansByStatus[status].length}
                        </span>
                      </div>
                    </div>

                    {/* Column Cards */}
                    <div className="flex-1 rounded-b-[18px] bg-white/30 ring-1 ring-black/5 p-3 space-y-3 min-h-[400px]">
                      {plansByStatus[status].map((plan) => (
                        <div
                          key={plan.id}
                          className="rounded-[14px] bg-white ring-1 ring-black/10 p-4 shadow-[0_1px_0_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <h4 className="text-[13px] font-bold text-neutral-900 line-clamp-2">
                              {plan.name}
                            </h4>
                            <span className="shrink-0 inline-block px-2 py-0.5 rounded-md bg-neutral-100 text-[9px] font-semibold text-neutral-700">
                              {(plan as any).folderName}
                            </span>
                          </div>

                          <p className="text-[10px] text-neutral-900/60 mb-3">
                            Owner: {plan.owner}
                          </p>

                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex-1 rounded-lg bg-blue-50 px-2 py-1.5 text-center">
                              <div className="text-[13px] font-bold text-blue-700">
                                {(plan.manualTestCount || 0) + (plan.automatedTestCount || 0)}
                              </div>
                              <div className="text-[8px] font-semibold text-blue-600">Tests</div>
                            </div>
                            <div className="flex-1 rounded-lg bg-purple-50 px-2 py-1.5 text-center">
                              <div className="text-[13px] font-bold text-purple-700">{plan.manualTestCount || 0}</div>
                              <div className="text-[8px] font-semibold text-purple-600">Manual</div>
                            </div>
                            <div className="flex-1 rounded-lg bg-green-50 px-2 py-1.5 text-center">
                              <div className="text-[13px] font-bold text-green-700">{plan.automatedTestCount || 0}</div>
                              <div className="text-[8px] font-semibold text-green-600">Auto</div>
                            </div>
                          </div>

                          <div className="text-[9px] text-neutral-900/50 mb-3">
                            Updated: {new Date(plan.updatedAtMs).toLocaleDateString()}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewPlanData(plan);
                              setShowPreview(true);
                            }}
                            className="w-full px-3 py-1.5 rounded-[8px] bg-neutral-900 text-white text-[11px] font-semibold hover:bg-neutral-800 transition-colors"
                          >
                            Preview
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal - Only showing first part due to length, full implementation continues */}
        <Modal open={open} onClose={() => setOpen(false)} mode={modalMode}>
          <div className={clsx("px-7 sm:px-10 pt-10 pb-8", modalMode === "fullscreen" ? "flex flex-col overflow-hidden h-full" : "")}>
            <div className="pr-14 shrink-0">
              <div className="inline-block">
                <h2
                  id="modal-title"
                  className="text-[42px] sm:text-[54px] leading-[0.95] font-black tracking-tight text-neutral-900"
                >
                  <span className="underline-wrap">
                    <span className="underline-text">Create A Test Plan</span>
                    <WaveUnderline className="pointer-events-none" />
                  </span>
                </h2>
              </div>
              <div className="mt-6 text-[12px] text-neutral-800/80 max-w-[70ch]">
                Capture the strategy sections and the standard checklists in one flow. Fields and section structure are
                based on the uploaded templates.
              </div>

              <div className="mt-4 inline-flex items-center gap-2 rounded-[999px] bg-white/70 ring-1 ring-black/10 px-3 py-1.5 shadow-[0_1px_0_rgba(0,0,0,0.08)]">
                <div className="h-2 w-2 rounded-full bg-[#76D85B]" />
                <div className="text-[11px] font-semibold text-neutral-900">Progress</div>
                <div className="text-[11px] text-neutral-900/70">
                  {computed.doneMaster}/{computed.totalMaster} master
                </div>
                <div className="text-[11px] text-neutral-900/70">•</div>
                <div className="text-[11px] text-neutral-900/70">
                  {computed.doneQA}/{computed.totalQA} QA
                </div>
              </div>
            </div>

            {/* Outline Navigation - Top */}
            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto">
                {OUTLINE_SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(s.id);
                    }}
                    className={clsx(
                      "shrink-0 rounded-[8px] px-3 py-1.5 text-[12px] font-semibold shadow-[0_1px_0_rgba(0,0,0,0.08)] transition text-left",
                      activeSection === s.id
                        ? "bg-[#76D85B] text-neutral-900 ring-1 ring-black/15"
                        : "bg-white/70 text-neutral-900 ring-1 ring-black/10 hover:bg-black/5"
                    )}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <PillButton
                  variant="ghost"
                  onClick={() => setModalMode((m) => (m === "fullscreen" ? "window" : "fullscreen"))}
                  className="h-8 px-3"
                >
                  {modalMode === "fullscreen" ? "Window" : "Full screen"}
                </PillButton>
                <PillButton variant="dark" onClick={() => setShowPreview(true)} className="h-8 px-3">
                  Preview
                </PillButton>
                <PillButton variant="green" onClick={handleSave} className="h-8 px-3">
                  {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "✓ Saved" : "Save draft"}
                </PillButton>
                <PillButton variant="ghost" onClick={resetForm} className="h-8 px-3">
                  Reset
                </PillButton>
              </div>
            </div>

            <div className={clsx("mt-6", modalMode === "fullscreen" ? "flex-1 min-h-0 overflow-hidden" : "")}>
              <div
                className={clsx(
                  "bg-white/55 ring-1 ring-black/10 shadow-[0_1px_0_rgba(0,0,0,0.08)] overflow-hidden flex flex-col",
                  modalMode === "fullscreen"
                    ? "rounded-none h-full"
                    : "rounded-[22px] max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-220px)] md:max-h-[62vh]"
                )}
              >
                <div ref={modalScrollRef} className="flex-1 min-h-0 overflow-auto overscroll-contain">
                  <div className="p-4 sm:p-5 md:p-7 space-y-8 sm:space-y-10">
                    <Section
                      id="meta"
                      title="Project details"
                      hint="Header fields aligned to the Test Strategy template (project, versioning, IDs)."
                    >
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field
                          label="Plan name"
                          required
                          placeholder="e.g., iReceivables Modernization"
                          value={meta.projectName}
                          onChange={(v) => setMeta((s) => ({ ...s, projectName: v }))}
                        />
                        <label className="block">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-neutral-700">Associated CSR's</span>
                          </div>
                          <textarea
                            value={meta.projectNumber}
                            onChange={(e) => {
                              setMeta((s) => ({ ...s, projectNumber: e.target.value }));
                            }}
                            placeholder={`• CSR-12345
• CSR-67890`}
                            className="mt-2 w-full min-h-[80px] rounded-[12px] bg-white px-4 py-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_0_rgba(0,0,0,0.08)] outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#76D85B] focus:ring-offset-2 focus:ring-offset-transparent transition"
                          />
                        </label>
                        <Field
                          label="Project manager name"
                          placeholder="e.g., John Doe"
                          value={meta.projectManager}
                          onChange={(v) => setMeta((s) => ({ ...s, projectManager: v }))}
                        />
                        <Field
                          label="Date"
                          type="date"
                          value={meta.date}
                          onChange={(v) => setMeta((s) => ({ ...s, date: v }))}
                        />
                        <Field
                          label="Version number"
                          placeholder="e.g., v1.0"
                          value={meta.version}
                          onChange={(v) => setMeta((s) => ({ ...s, version: v }))}
                        />
                        <Field
                          label="Sprint number"
                          placeholder="e.g., Sprint 5"
                          value={meta.sprintNumber}
                          onChange={(v) => setMeta((s) => ({ ...s, sprintNumber: v }))}
                        />
                        <Select
                          label="Status"
                          required
                          value={meta.status}
                          onChange={(v) => setMeta((s) => ({ ...s, status: v }))}
                          options={["Draft", "In Review", "Approved", "Signed-off"]}
                        />
                        <Field
                          label="Execution ID"
                          placeholder="e.g., EXEC-QA-001"
                          value={meta.documentId}
                          onChange={(v) => setMeta((s) => ({ ...s, documentId: v }))}
                        />
                        <label className="block">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-neutral-700">Business Unit (BU)</span>
                          </div>
                          <div className="relative mt-2">
                            <select
                              value={meta.businessUnit}
                              onChange={(e) => setMeta((s) => ({ ...s, businessUnit: e.target.value }))}
                              className="w-full appearance-none rounded-[12px] bg-white px-4 py-3 pr-10 text-[13px] text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_0_rgba(0,0,0,0.08)] outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#76D85B] focus:ring-offset-2 focus:ring-offset-transparent transition"
                            >
                              <option value="">Select Business Unit</option>
                              <option value="Finance">Finance</option>
                              <option value="Operations">Operations</option>
                              <option value="Sales">Sales</option>
                              <option value="Marketing">Marketing</option>
                              <option value="IT">IT</option>
                              <option value="HR">Human Resources</option>
                              <option value="Customer Service">Customer Service</option>
                            </select>
                            <IconArrow className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                          </div>
                        </label>
                      </div>

                      {/* QA Resources Checklist */}
                      <div className="mt-6 rounded-[18px] bg-white/70 ring-1 ring-black/10 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-[12px] font-semibold text-neutral-900">QA Resources</div>
                          <div className="text-[11px] text-neutral-900/70">
                            {Object.values(qaResources).filter(Boolean).length}/{Object.keys(qaResources).length}
                          </div>
                        </div>
                        <div className="grid gap-1 max-h-[240px] overflow-y-auto overscroll-contain" style={{ scrollBehavior: 'auto' }}>
                          {Object.entries(qaResources).map(([resourceName, checked]) => (
                            <CheckboxRow
                              key={resourceName}
                              checked={checked}
                              onChange={(v) => setQaResources((s) => ({ ...s, [resourceName]: v }))}
                              label={resourceName}
                            />
                          ))}
                        </div>
                      </div>
                    </Section>

                    <Section
                      id="scope"
                      title="Test scope and objectives"
                      hint="Include overview, in-scope, out-of-scope, and high-level testing objectives."
                    >
                      <div className="grid gap-4">
                        <label className="block">
                          <div className="text-[11px] font-semibold text-neutral-700">
                            Overview of solution to be implemented
                          </div>
                          <textarea
                            value={scope.overview}
                            onChange={(e) => setScope((s) => ({ ...s, overview: e.target.value }))}
                            placeholder="Summary of the future operational environment and what will be tested…"
                            className="mt-2 w-full min-h-[92px] rounded-[12px] bg-white px-4 py-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_0_rgba(0,0,0,0.08)] outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#76D85B] focus:ring-offset-2 focus:ring-offset-transparent transition"
                          />
                        </label>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <label className="block">
                            <div className="text-[11px] font-semibold text-neutral-700">In scope</div>
                            <textarea
                              value={scope.inScope}
                              onChange={(e) => setScope((s) => ({ ...s, inScope: e.target.value }))}
                              placeholder="What is included (processes, components, docs, training, etc.)…"
                              className="mt-2 w-full min-h-[92px] rounded-[12px] bg-white px-4 py-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_0_rgba(0,0,0,0.08)] outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#76D85B] focus:ring-offset-2 focus:ring-offset-transparent transition"
                            />
                          </label>
                          <label className="block">
                            <div className="text-[11px] font-semibold text-neutral-700">Out of scope</div>
                            <textarea
                              value={scope.outScope}
                              onChange={(e) => setScope((s) => ({ ...s, outScope: e.target.value }))}
                              placeholder="What is excluded (areas, systems, activities)…"
                              className="mt-2 w-full min-h-[92px] rounded-[12px] bg-white px-4 py-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_0_rgba(0,0,0,0.08)] outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#76D85B] focus:ring-offset-2 focus:ring-offset-transparent transition"
                            />
                          </label>
                        </div>

                        <label className="block">
                          <div className="text-[11px] font-semibold text-neutral-700">Testing objectives</div>
                          <textarea
                            value={scope.objectives}
                            onChange={(e) => {
                              setScope((s) => ({ ...s, objectives: e.target.value }));
                              // Auto-resize textarea
                              e.target.style.height = 'auto';
                              e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            onFocus={(e) => {
                              // Set initial height on focus
                              e.target.style.height = 'auto';
                              e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            placeholder={`• Validate end-to-end business flow
• Verify integrations
• Ensure performance and security`}
                            className="mt-2 w-full min-h-[92px] rounded-[12px] bg-white px-4 py-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_0_rgba(0,0,0,0.08)] outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#76D85B] focus:ring-offset-2 focus:ring-offset-transparent transition resize-none overflow-hidden"
                            style={{ height: 'auto' }}
                          />
                        </label>
                      </div>
                    </Section>

                    <Section
                      id="checklists"
                      title="Standard checklists"
                      hint="Master Test Plan phases checklist."
                    >
                      <div className="rounded-[18px] bg-white/70 ring-1 ring-black/10 p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-[12px] font-semibold text-neutral-900">Master Test Plan phases</div>
                          <div className="text-[11px] text-neutral-900/70">
                            {computed.doneMaster}/{computed.totalMaster}
                          </div>
                        </div>
                        <div className="mt-3 grid">
                          <CheckboxRow
                            checked={masterChecks.unit.checked}
                            onChange={(v) => setMasterChecks((s) => ({ ...s, unit: { ...s.unit, checked: v } }))}
                            label="Unit testing"
                            sub="Module-level verification, typically by developers."
                            days={masterChecks.unit.days}
                            onDaysChange={(d) => setMasterChecks((s) => ({ ...s, unit: { ...s.unit, days: d } }))}
                          />
                          <CheckboxRow
                            checked={masterChecks.functional.checked}
                            onChange={(v) => setMasterChecks((s) => ({ ...s, functional: { ...s.functional, checked: v } }))}
                            label="Functional testing"
                            sub="Validate behavior vs functional requirements; independent testing recommended."
                            days={masterChecks.functional.days}
                            onDaysChange={(d) => setMasterChecks((s) => ({ ...s, functional: { ...s.functional, days: d } }))}
                          />
                          <CheckboxRow
                            checked={masterChecks.regression.checked}
                            onChange={(v) => setMasterChecks((s) => ({ ...s, regression: { ...s.regression, checked: v } }))}
                            label="Regression testing"
                            sub="Re-validate existing functionality after changes; ensures no new defects introduced."
                            days={masterChecks.regression.days}
                            onDaysChange={(d) => setMasterChecks((s) => ({ ...s, regression: { ...s.regression, days: d } }))}
                          />
                          <CheckboxRow
                            checked={masterChecks.load.checked}
                            onChange={(v) => setMasterChecks((s) => ({ ...s, load: { ...s.load, checked: v } }))}
                            label="Load testing"
                            sub="Response degradation/failure under heavy load; automated tools."
                            days={masterChecks.load.days}
                            onDaysChange={(d) => setMasterChecks((s) => ({ ...s, load: { ...s.load, days: d } }))}
                          />
                          <CheckboxRow
                            checked={masterChecks.volume.checked}
                            onChange={(v) => setMasterChecks((s) => ({ ...s, volume: { ...s.volume, checked: v } }))}
                            label="Volume testing"
                            sub="High volume of data/transactions; capacity limits."
                            days={masterChecks.volume.days}
                            onDaysChange={(d) => setMasterChecks((s) => ({ ...s, volume: { ...s.volume, days: d } }))}
                          />
                          <CheckboxRow
                            checked={masterChecks.acceptance.checked}
                            onChange={(v) => setMasterChecks((s) => ({ ...s, acceptance: { ...s.acceptance, checked: v } }))}
                            label="Acceptance testing"
                            sub="Client confirms requirements and readiness for operational use."
                            days={masterChecks.acceptance.days}
                            onDaysChange={(d) => setMasterChecks((s) => ({ ...s, acceptance: { ...s.acceptance, days: d } }))}
                          />
                          <CheckboxRow
                            checked={masterChecks.usability.checked}
                            onChange={(v) => setMasterChecks((s) => ({ ...s, usability: { ...s.usability, checked: v } }))}
                            label="Usability testing"
                            sub="Ease of learning and use; questionnaires and observation."
                            days={masterChecks.usability.days}
                            onDaysChange={(d) => setMasterChecks((s) => ({ ...s, usability: { ...s.usability, days: d } }))}
                          />
                        </div>

                        {/* Review Days Field */}
                        <div className="mt-4 rounded-[18px] bg-white/70 ring-1 ring-black/10 p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-[12px] font-semibold text-neutral-900">Review days</div>
                            <div className="text-[11px] text-neutral-900/70">Additional days for review</div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-[11px] text-neutral-700">Days:</span>
                            <input
                              type="number"
                              min="0"
                              value={reviewDays}
                              onChange={(e) => setReviewDays(parseInt(e.target.value) || 0)}
                              className="w-20 rounded-[8px] bg-white px-2 py-1 text-[12px] text-neutral-900 shadow-[0_1px_0_rgba(0,0,0,0.08)] outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#76D85B] transition"
                            />
                          </div>
                        </div>
                      </div>
                    </Section>

                    <Section
                      id="schedule"
                      title="Schedule"
                      hint="Define a high-level test schedule with milestones and dependencies."
                    >
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field
                          label="Start date"
                          type="date"
                          value={timeline.start}
                          onChange={(v) => setTimeline((s) => ({ ...s, start: v }))}
                        />
                        <Field
                          label="End date"
                          type="date"
                          value={timeline.end}
                          onChange={(v) => setTimeline((s) => ({ ...s, end: v }))}
                        />
                      </div>
                      <label className="block mt-4">
                        <div className="text-[11px] font-semibold text-neutral-700">Schedule dependencies</div>
                        <textarea
                          value={timeline.dependencies}
                          onChange={(e) => setTimeline((s) => ({ ...s, dependencies: e.target.value }))}
                          placeholder="Other project deliveries, release completion, third‑party dependencies…"
                          className="mt-2 w-full min-h-[92px] rounded-[12px] bg-white px-4 py-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_0_rgba(0,0,0,0.08)] outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#76D85B] focus:ring-offset-2 focus:ring-offset-transparent transition"
                        />
                      </label>
                    </Section>

                    <Section
                      id="comments"
                      title="Comments"
                      hint="Add any additional comments, notes, or observations about this test plan."
                    >
                      <div className="grid gap-4">
                        <label className="block">
                          <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Add any additional notes, observations, or special instructions for this test plan…"
                            className="mt-2 w-full min-h-[120px] rounded-[12px] bg-white px-4 py-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_0_rgba(0,0,0,0.08)] outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#76D85B] focus:ring-offset-2 focus:ring-offset-transparent transition"
                          />
                        </label>
                      </div>

                      <div className="mt-5 space-y-4">
                        <div className="rounded-[18px] bg-white/70 ring-1 ring-black/10 p-5">
                          <div className="text-[13px] font-semibold text-neutral-900 mb-3">
                            Save Draft
                          </div>

                          <label className="block">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-neutral-700">Select folder (optional)</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                                className="text-[10px] font-semibold text-[#76D85B] hover:underline"
                              >
                                {showNewFolderInput ? "Cancel" : "+ New folder"}
                              </button>
                            </div>
                            <div className="relative mt-2">
                              <select
                                value={selectedFolderId}
                                onChange={(e) => setSelectedFolderId(e.target.value)}
                                className="w-full appearance-none rounded-[10px] bg-white px-4 py-3 pr-10 text-[13px] text-neutral-900 shadow-[0_1px_0_rgba(0,0,0,0.08)] outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#76D85B] focus:ring-offset-2 focus:ring-offset-transparent transition"
                              >
                                <option value="">Select a folder</option>
                                {folders.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.name} ({f.plans.length} plans)
                                  </option>
                                ))}
                              </select>
                              <IconArrow className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                            </div>
                          </label>

                          {showNewFolderInput && (
                            <div className="mt-3 p-3 rounded-[12px] bg-white/50 ring-1 ring-black/10">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={newFolderName}
                                  onChange={(e) => setNewFolderName(e.target.value)}
                                  placeholder="Enter folder name"
                                  className="flex-1 rounded-[10px] bg-white px-3 py-2 text-[13px] text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_0_rgba(0,0,0,0.08)] outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#76D85B] transition"
                                />
                                <button
                                  type="button"
                                  onClick={handleCreateNewFolder}
                                  className="px-3 py-2 rounded-[10px] bg-[#76D85B] text-[12px] font-semibold text-neutral-900 hover:brightness-95 transition"
                                >
                                  Create
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="text-[11px] text-neutral-600">
                              Save a draft to continue working later. Draft is auto-loaded on page refresh.
                            </div>
                            <div className="flex items-center gap-2">
                              <PillButton variant="ghost" onClick={() => setOpen(false)}>
                                Cancel
                              </PillButton>
                              <PillButton variant="green" onClick={handleSave}>
                                {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "✓ Saved" : "Save draft"}
                              </PillButton>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Section>
                  </div>
                </div>

                {/* Save Test Plan Footer */}
                <div className="shrink-0 border-t border-black/10 bg-white/55 px-5 sm:px-7 py-4 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-neutral-700">
                    {saveStatus === "saved" ? (
                      <span className="font-semibold text-green-700">✓ Test plan saved successfully!</span>
                    ) : (
                      "Save the complete test plan to the selected folder and make it visible in the Test Planner screen."
                    )}
                  </div>
                  <PillButton variant="green" onClick={handleSaveCompletePlan}>
                    {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "✓ Saved!" : "Save Test Plan"}
                  </PillButton>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* Test Execution Screen */}
        <TestExecutionFlow open={testExecutionOpen} onClose={() => setTestExecutionOpen(false)} />

        {/* Test Plan Preview Modal */}
        {showPreview && (
          <>
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm print:hidden" onClick={() => setShowPreview(false)}></div>
            <div
              className="fixed inset-0 z-[61] bg-white overflow-hidden flex flex-col print:block print:static print:overflow-visible"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="shrink-0 border-b border-black/10 bg-white px-8 py-6 flex items-center justify-between print-hide">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">Test Plan Preview</h2>
                  <p className="text-sm text-neutral-600 mt-1">Review the test plan before approval</p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-600 hover:text-neutral-900"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-neutral-50 print-content">
                <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-black/10 p-6 sm:p-10">
                  {previewPlanData ? (
                    <>
                      {/* Saved Plan Header */}
                      <section className="mb-6">
                        <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 mb-3">
                          {previewPlanData.name}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm bg-neutral-50 p-4 rounded-lg">
                          <div>
                            <div className="text-xs font-semibold text-neutral-500 uppercase mb-1">Owner</div>
                            <div className="text-neutral-900 font-medium">{previewPlanData.owner}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-neutral-500 uppercase mb-1">Status</div>
                            <div className="text-neutral-900 font-medium">{previewPlanData.meta?.status || 'Draft'}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-neutral-500 uppercase mb-1">Created</div>
                            <div className="text-neutral-900 font-medium">{new Date(previewPlanData.createdAtMs).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-neutral-500 uppercase mb-1">Updated</div>
                            <div className="text-neutral-900 font-medium">{new Date(previewPlanData.updatedAtMs).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </section>

                      {/* Project Details */}
                      {previewPlanData.meta && (
                        <section className="mb-6">
                          <h3 className="text-lg font-bold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
                            Project Details
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            {previewPlanData.meta.projectManager && (
                              <div>
                                <div className="text-xs font-semibold text-neutral-600 uppercase">Project Manager</div>
                                <div className="text-sm text-neutral-900 mt-1">{previewPlanData.meta.projectManager}</div>
                              </div>
                            )}
                            {previewPlanData.meta.date && (
                              <div>
                                <div className="text-xs font-semibold text-neutral-600 uppercase">Date</div>
                                <div className="text-sm text-neutral-900 mt-1">{previewPlanData.meta.date}</div>
                              </div>
                            )}
                            {previewPlanData.meta.version && (
                              <div>
                                <div className="text-xs font-semibold text-neutral-600 uppercase">Version</div>
                                <div className="text-sm text-neutral-900 mt-1">{previewPlanData.meta.version}</div>
                              </div>
                            )}
                            {previewPlanData.meta.sprintNumber && (
                              <div>
                                <div className="text-xs font-semibold text-neutral-600 uppercase">Sprint Number</div>
                                <div className="text-sm text-neutral-900 mt-1">{previewPlanData.meta.sprintNumber}</div>
                              </div>
                            )}
                            {previewPlanData.meta.businessUnit && (
                              <div>
                                <div className="text-xs font-semibold text-neutral-600 uppercase">Business Unit</div>
                                <div className="text-sm text-neutral-900 mt-1">{previewPlanData.meta.businessUnit}</div>
                              </div>
                            )}
                          </div>
                          {previewPlanData.meta.projectNumber && (
                            <div className="mt-4">
                              <div className="text-xs font-semibold text-neutral-600 uppercase">Associated CSR's</div>
                              <div className="text-sm text-neutral-900 mt-1 whitespace-pre-wrap">{previewPlanData.meta.projectNumber}</div>
                            </div>
                          )}
                        </section>
                      )}

                      {/* Scope */}
                      {previewPlanData.scope && (
                        <section className="mb-6">
                          <h3 className="text-lg font-bold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
                            Scope & Objectives
                          </h3>
                          {previewPlanData.scope.overview && (
                            <div className="mb-4">
                              <div className="text-xs font-semibold text-neutral-600 uppercase mb-1">Overview</div>
                              <div className="text-sm text-neutral-900 whitespace-pre-wrap">{previewPlanData.scope.overview}</div>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            {previewPlanData.scope.inScope && (
                              <div>
                                <div className="text-xs font-semibold text-neutral-600 uppercase mb-1">In Scope</div>
                                <div className="text-sm text-neutral-900 whitespace-pre-wrap">{previewPlanData.scope.inScope}</div>
                              </div>
                            )}
                            {previewPlanData.scope.outScope && (
                              <div>
                                <div className="text-xs font-semibold text-neutral-600 uppercase mb-1">Out of Scope</div>
                                <div className="text-sm text-neutral-900 whitespace-pre-wrap">{previewPlanData.scope.outScope}</div>
                              </div>
                            )}
                          </div>
                          {previewPlanData.scope.objectives && (
                            <div>
                              <div className="text-xs font-semibold text-neutral-600 uppercase mb-1">Testing Objectives</div>
                              <div className="text-sm text-neutral-900 whitespace-pre-wrap">{previewPlanData.scope.objectives}</div>
                            </div>
                          )}
                        </section>
                      )}

                      {/* Master Test Plan Phases */}
                      {previewPlanData.masterChecks && (
                        <section className="mb-6">
                          <h3 className="text-lg font-bold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
                            Master Test Plan Phases
                          </h3>
                          <div className="space-y-2">
                            {Object.entries(previewPlanData.masterChecks).filter(([_, v]: [string, any]) => v && v.checked).map(([key, value]: [string, any]) => (
                              <div key={key} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                  <span className="text-sm font-medium text-neutral-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                </div>
                                {value.days > 0 && (
                                  <span className="text-sm text-neutral-600">{value.days} days</span>
                                )}
                              </div>
                            ))}
                          </div>
                          {(() => {
                            const totalDays = Object.values(previewPlanData.masterChecks).filter((v: any) => v && v.checked).reduce((sum: number, phase: any) => sum + (Number(phase.days) || 0), 0);
                            return totalDays > 0 ? (
                              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="text-sm font-semibold text-neutral-900">Total Test Days: {totalDays} days</div>
                              </div>
                            ) : null;
                          })()}
                        </section>
                      )}

                      {/* QA Checklist */}
                      {previewPlanData.qaChecks && Object.values(previewPlanData.qaChecks).some(v => v) && (
                        <section className="mb-6">
                          <h3 className="text-lg font-bold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
                            QA Checklist
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(previewPlanData.qaChecks).filter(([_, checked]) => checked).map(([key]) => (
                              <span key={key} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Schedule */}
                      {previewPlanData.timeline && (
                        <section className="mb-6">
                          <h3 className="text-lg font-bold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
                            Schedule
                          </h3>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            {previewPlanData.timeline.start && (
                              <div>
                                <div className="text-xs font-semibold text-neutral-600 uppercase mb-1">Start Date</div>
                                <div className="text-sm text-neutral-900">{previewPlanData.timeline.start}</div>
                              </div>
                            )}
                            {previewPlanData.timeline.end && (
                              <div>
                                <div className="text-xs font-semibold text-neutral-600 uppercase mb-1">End Date</div>
                                <div className="text-sm text-neutral-900">{previewPlanData.timeline.end}</div>
                              </div>
                            )}
                          </div>
                          {previewPlanData.timeline.dependencies && (
                            <div>
                              <div className="text-xs font-semibold text-neutral-600 uppercase mb-1">Dependencies</div>
                              <div className="text-sm text-neutral-900 whitespace-pre-wrap">{previewPlanData.timeline.dependencies}</div>
                            </div>
                          )}
                        </section>
                      )}

                      {/* Comments */}
                      {previewPlanData.comments && (
                        <section className="mb-6">
                          <h3 className="text-lg font-bold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
                            Comments
                          </h3>
                          <div className="text-sm text-neutral-900 whitespace-pre-wrap bg-neutral-50 p-4 rounded-lg">{previewPlanData.comments}</div>
                        </section>
                      )}

                      {/* Test Statistics */}
                      <section className="mb-6">
                        <h3 className="text-lg font-bold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
                          Test Statistics
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-700">
                              {(previewPlanData.manualTestCount || 0) + (previewPlanData.automatedTestCount || 0)}
                            </div>
                            <div className="text-xs text-blue-600 mt-1">Total Tests</div>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-purple-700">{previewPlanData.manualTestCount || 0}</div>
                            <div className="text-xs text-purple-600 mt-1">Manual Tests</div>
                          </div>
                          <div className="p-4 bg-green-50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-700">{previewPlanData.automatedTestCount || 0}</div>
                            <div className="text-xs text-green-600 mt-1">Automated Tests</div>
                          </div>
                        </div>
                      </section>
                    </>
                  ) : (
                    <>
                      {/* Current Form Preview */}
                      <section className="mb-6">
                        <h3 className="text-lg font-bold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
                          Project Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-semibold text-neutral-600 uppercase">Plan Name</div>
                            <div className="text-sm text-neutral-900 mt-1">{meta.projectName || "—"}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-neutral-600 uppercase">Project Manager</div>
                            <div className="text-sm text-neutral-900 mt-1">{meta.projectManager || "—"}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-neutral-600 uppercase">Date</div>
                            <div className="text-sm text-neutral-900 mt-1">{meta.date || "—"}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-neutral-600 uppercase">Version</div>
                            <div className="text-sm text-neutral-900 mt-1">{meta.version || "—"}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-neutral-600 uppercase">Sprint Number</div>
                            <div className="text-sm text-neutral-900 mt-1">{meta.sprintNumber || "—"}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-neutral-600 uppercase">Status</div>
                            <div className="text-sm text-neutral-900 mt-1">{meta.status || "—"}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-neutral-600 uppercase">Business Unit</div>
                            <div className="text-sm text-neutral-900 mt-1">{meta.businessUnit || "—"}</div>
                          </div>
                        </div>
                        {meta.projectNumber && (
                          <div className="mt-4">
                            <div className="text-xs font-semibold text-neutral-600 uppercase">Associated CSR's</div>
                            <div className="text-sm text-neutral-900 mt-1 whitespace-pre-wrap">{meta.projectNumber}</div>
                          </div>
                        )}
                      </section>

                      {/* Scope & Objectives */}
                      <section className="mb-6">
                        <h3 className="text-lg font-bold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
                          Test Scope & Objectives
                        </h3>
                        {scope.overview && (
                          <div className="mb-4">
                            <div className="text-xs font-semibold text-neutral-600 uppercase mb-1">Overview</div>
                            <div className="text-sm text-neutral-900 whitespace-pre-wrap">{scope.overview}</div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          {scope.inScope && (
                            <div>
                              <div className="text-xs font-semibold text-neutral-600 uppercase mb-1">In Scope</div>
                              <div className="text-sm text-neutral-900 whitespace-pre-wrap">{scope.inScope}</div>
                            </div>
                          )}
                          {scope.outScope && (
                            <div>
                              <div className="text-xs font-semibold text-neutral-600 uppercase mb-1">Out of Scope</div>
                              <div className="text-sm text-neutral-900 whitespace-pre-wrap">{scope.outScope}</div>
                            </div>
                          )}
                        </div>
                        {scope.objectives && (
                          <div className="mt-4">
                            <div className="text-xs font-semibold text-neutral-600 uppercase mb-1">Testing Objectives</div>
                            <div className="text-sm text-neutral-900 whitespace-pre-wrap">{scope.objectives}</div>
                          </div>
                        )}
                      </section>

                      {/* Master Test Plan Phases */}
                      <section className="mb-6">
                        <h3 className="text-lg font-bold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
                          Master Test Plan Phases
                        </h3>
                        <div className="space-y-2">
                          {Object.entries(masterChecks).filter(([_, v]) => v.checked).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <span className="text-sm font-medium text-neutral-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              </div>
                              {value.days > 0 && (
                                <span className="text-sm text-neutral-600">{value.days} days</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {(() => {
                          const totalDays = Object.values(masterChecks).filter((v: any) => v && v.checked).reduce((sum: number, phase: any) => sum + (Number(phase.days) || 0), 0);
                          return totalDays > 0 ? (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="text-sm font-semibold text-neutral-900">Total Test Days: {totalDays} days</div>
                            </div>
                          ) : null;
                        })()}
                        {reviewDays > 0 && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-sm font-medium text-neutral-900">Review Days: {reviewDays} days</div>
                          </div>
                        )}
                      </section>

                      {/* QA Checklist */}
                      {Object.values(qaChecks).some(v => v) && (
                        <section className="mb-6">
                          <h3 className="text-lg font-bold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
                            QA Checklist
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(qaChecks).filter(([_, checked]) => checked).map(([key]) => (
                              <span key={key} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* QA Resources */}
                      {Object.values(qaResources).some(v => v) && (
                        <section className="mb-6">
                          <h3 className="text-lg font-bold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
                            QA Resources
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(qaResources).filter(([_, checked]) => checked).map(([name]) => (
                              <span key={name} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                {name}
                              </span>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Schedule */}
                      {(timeline.start || timeline.end || timeline.dependencies) && (
                        <section className="mb-6">
                          <h3 className="text-lg font-bold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
                            Schedule
                          </h3>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            {timeline.start && (
                              <div>
                                <div className="text-xs font-semibold text-neutral-600 uppercase mb-1">Start Date</div>
                                <div className="text-sm text-neutral-900">{timeline.start}</div>
                              </div>
                            )}
                            {timeline.end && (
                              <div>
                                <div className="text-xs font-semibold text-neutral-600 uppercase mb-1">End Date</div>
                                <div className="text-sm text-neutral-900">{timeline.end}</div>
                              </div>
                            )}
                          </div>
                          {timeline.dependencies && (
                            <div>
                              <div className="text-xs font-semibold text-neutral-600 uppercase mb-1">Dependencies</div>
                              <div className="text-sm text-neutral-900 whitespace-pre-wrap">{timeline.dependencies}</div>
                            </div>
                          )}
                        </section>
                      )}

                      {/* Comments */}
                      {comments && (
                        <section className="mb-6">
                          <h3 className="text-lg font-bold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
                            Comments
                          </h3>
                          <div className="text-sm text-neutral-900 whitespace-pre-wrap bg-neutral-50 p-4 rounded-lg">{comments}</div>
                        </section>
                      )}

                      {/* Test Statistics */}
                      <section className="mb-6">
                        <h3 className="text-lg font-bold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
                          Test Statistics
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-700">{manualTestCount + automatedTestCount}</div>
                            <div className="text-xs text-blue-600 mt-1">Total Tests</div>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-purple-700">{manualTestCount}</div>
                            <div className="text-xs text-purple-600 mt-1">Manual Tests</div>
                          </div>
                          <div className="p-4 bg-green-50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-700">{automatedTestCount}</div>
                            <div className="text-xs text-green-600 mt-1">Automated Tests</div>
                          </div>
                        </div>
                      </section>
                    </>
                  )}

                </div>
              </div>

              {/* Footer with Approve and Sign-off Buttons */}
              <div className="shrink-0 border-t border-black/10 bg-white px-8 py-4 flex items-center justify-between print-hide">
                <div className="flex items-center gap-3">
                  <PillButton variant="ghost" onClick={() => setShowPreview(false)}>
                    Close
                  </PillButton>
                  <PillButton
                    variant="ghost"
                    onClick={() => {
                      window.print();
                    }}
                  >
                    📄 Export PDF
                  </PillButton>
                  {/* Move back to Draft button - only show if Approved (not Signed-off) */}
                  {previewPlanData?.meta?.status === 'Approved' && (
                    <PillButton
                      variant="ghost"
                      onClick={() => {
                        if (previewPlanData) {
                          // Update status back to Draft
                          const updatedPlan = { ...previewPlanData, meta: { ...previewPlanData.meta, status: 'Draft' } };
                          const allFolders = loadFolders();
                          const folderIndex = allFolders.findIndex(f => f.plans.some(p => p.id === updatedPlan.id));
                          if (folderIndex >= 0) {
                            const planIndex = allFolders[folderIndex].plans.findIndex(p => p.id === updatedPlan.id);
                            if (planIndex >= 0) {
                              allFolders[folderIndex].plans[planIndex] = updatedPlan;
                              saveFolders(allFolders);
                              setFolders(allFolders);
                              setPreviewPlanData(updatedPlan);
                            }
                          }
                        }
                      }}
                    >
                      ← Move to Draft
                    </PillButton>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <PillButton
                    variant="green"
                    onClick={() => {
                      if (previewPlanData) {
                        // Update status to Approved
                        const updatedPlan = { ...previewPlanData, meta: { ...previewPlanData.meta, status: 'Approved' } };
                        const allFolders = loadFolders();
                        const folderIndex = allFolders.findIndex(f => f.plans.some(p => p.id === updatedPlan.id));
                        if (folderIndex >= 0) {
                          const planIndex = allFolders[folderIndex].plans.findIndex(p => p.id === updatedPlan.id);
                          if (planIndex >= 0) {
                            allFolders[folderIndex].plans[planIndex] = updatedPlan;
                            saveFolders(allFolders);
                            setFolders(allFolders);
                            setPreviewPlanData(updatedPlan);
                          }
                        }
                      }
                    }}
                    disabled={previewPlanData?.meta?.status === 'Approved' || previewPlanData?.meta?.status === 'Signed-off'}
                  >
                    {previewPlanData?.meta?.status === 'Approved' || previewPlanData?.meta?.status === 'Signed-off' ? '✓ Approved' : 'Approve'}
                  </PillButton>
                  <PillButton
                    variant="dark"
                    onClick={() => {
                      if (previewPlanData) {
                        // Update status to Signed-off
                        const updatedPlan = { ...previewPlanData, meta: { ...previewPlanData.meta, status: 'Signed-off' } };
                        const allFolders = loadFolders();
                        const folderIndex = allFolders.findIndex(f => f.plans.some(p => p.id === updatedPlan.id));
                        if (folderIndex >= 0) {
                          const planIndex = allFolders[folderIndex].plans.findIndex(p => p.id === updatedPlan.id);
                          if (planIndex >= 0) {
                            allFolders[folderIndex].plans[planIndex] = updatedPlan;
                            saveFolders(allFolders);
                            setFolders(allFolders);
                            setPreviewPlanData(updatedPlan);
                          }
                        }
                      }
                    }}
                    disabled={previewPlanData?.meta?.status !== 'Approved'}
                  >
                    {previewPlanData?.meta?.status === 'Signed-off' ? '✓ Signed-off' : 'Sign-off'}
                  </PillButton>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
