import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { saveTestPlanToFolder, generatePlanId, formatDate, loadFolders, saveFolders } from "./testPlanStorage";

/**
 * Single-file React UI that mimics the referenced yellow MindMarket video style.
 */

function clsx(...xs) {
  return xs.filter(Boolean).join(" ");
}

/**
 * Calculate end date by adding business days to start date
 */
function addBusinessDays(startDate, numberOfDays) {
  const result = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < numberOfDays) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }

  return result;
}

/**
 * Format date to YYYY-MM-DD for input[type="date"]
 */
function formatDateToInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const WaveUnderline = ({ className = "" }) => (
  <span aria-hidden className={clsx("underline-wave", className)} />
);

const IconArrow = ({ className = "" }) => (
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

const IconCheck = ({ className = "" }) => (
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
}) {
  const handleDaysChange = (e) => {
    const value = e.target.value;
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

function Modal({
  open,
  onClose,
  children,
  titleId = "modal-title",
  mode = "fullscreen",
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
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

const STORAGE_KEY = "create-test-plan-draft";

function loadDraft() {
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

function saveDraft(draft) {
  try {
    const toSave = {
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

const testRunsData = [
  { id: "run-1", status: "COMPLETED", date: "2025-12-19" },
  { id: "run-2", status: "IN-PROGRESS", date: "2025-12-20" },
  { id: "run-3", status: "STARTED", date: "2025-12-21" },
];

function TestExecutionFlow({ open, onClose }) {
  const [selectedTestRun, setSelectedTestRun] = useState(null);
  if (!open) return null;
  return (
    <>
      {!selectedTestRun ? (
        <TestRunSelectionScreen onClose={onClose} onSelectTestRun={(run) => setSelectedTestRun(run)} />
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

function TestRunSelectionScreen({ onClose, onSelectTestRun }) {
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
        className="relative w-full h-full overflow-hidden bg-[#1c1c1c] text-[#e8e6dc] antialiased flex flex-col"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-start shrink-0">
          <div>
            <h3 className="text-2xl text-white font-light">Test Executions</h3>
            <p className="text-gray-400 text-sm mt-1">Select a test run to view details</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
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
                className="bg-[#252525] border border-white/10 rounded-2xl p-6 cursor-pointer hover:bg-white/5 transition-colors"
                whileHover={{ y: -5 }}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-lg font-bold text-white">{run.id}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    run.status === "COMPLETED" ? "bg-green-500/20 text-green-400 border border-green-500/30" : 
                    run.status === "IN-PROGRESS" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : 
                    "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  }`}>
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
  { id: 0, title: "Planning", subtitle: "Day 1 • Kickoff & Scope", days: [0], manualCount: 8, autoCount: 0, qaResource: "Sarah Jenkins", testCases: [
    { id: "TC-101", title: "Review PRD and Tech Spec", priority: "P0", tags: ["Doc", "Process"], day: "Day 1", status: "Pass", time: "2h 30m", executedBy: "Sarah J." },
    { id: "TC-102", title: "Create Test Plan Document", priority: "P1", tags: ["Doc"], day: "Day 1", status: "Pass", time: "4h 00m", executedBy: "Sarah J." },
    { id: "TC-103", title: "Setup Test Environment", priority: "P0", tags: ["Env", "DevOps"], day: "Day 1", status: "Pass", time: "1h 15m", executedBy: "Mike C." },
  ]},
  { id: 1, title: "Unit Tests", subtitle: "Day 2 • Component Logic", days: [1], manualCount: 0, autoCount: 42, qaResource: "Mike Chen", testCases: [
    { id: "TC-201", title: "Unit: Auth Hook validation", priority: "P0", tags: ["Auth", "Unit"], day: "Day 2", status: "Pass", time: "45ms", executedBy: "CI/CD" },
    { id: "TC-202", title: "Unit: Date formatting utilities", priority: "P2", tags: ["Utils", "Unit"], day: "Day 2", status: "Pass", time: "12ms", executedBy: "CI/CD" },
    { id: "TC-203", title: "Unit: State management reducers", priority: "P1", tags: ["Redux", "Unit"], day: "Day 2", status: "Pass", time: "89ms", executedBy: "CI/CD" },
  ]},
  { id: 2, title: "Integration", subtitle: "Day 3 • API & Data Flow", days: [2], manualCount: 12, autoCount: 28, qaResource: "Mike Chen", testCases: [
    { id: "TC-301", title: "API: POST /login returns token", priority: "P0", tags: ["API", "Auth"], day: "Day 3", status: "Pass", time: "120ms", executedBy: "Postman" },
    { id: "TC-302", title: "API: User Profile sync", priority: "P1", tags: ["API", "Data"], day: "Day 3", status: "Fail", time: "5.2s", executedBy: "Postman" },
    { id: "TC-303", title: "Integration: Payment Gateway", priority: "P0", tags: ["Payment", "Ext"], day: "Day 3", status: "Pending", time: "-", executedBy: "-" },
  ]},
  { id: 3, title: "UI Validation", subtitle: "Day 4 • Frontend & Responsive", days: [3], manualCount: 35, autoCount: 15, qaResource: "Sarah Jenkins", testCases: [
    { id: "TC-401", title: "UI: Mobile Navigation Menu", priority: "P1", tags: ["UI", "Mobile"], day: "Day 4", status: "Fail", time: "15m", executedBy: "Sarah J." },
    { id: "TC-402", title: "UI: Dark Mode contrast check", priority: "P2", tags: ["UI", "A11y"], day: "Day 4", status: "Pass", time: "10m", executedBy: "Sarah J." },
    { id: "TC-403", title: "E2E: User Signup Flow", priority: "P0", tags: ["E2E", "Cypress"], day: "Day 4", status: "Pass", time: "45s", executedBy: "Cypress" },
  ]},
  { id: 4, title: "Non-Functional", subtitle: "Day 5 • Security & Load", days: [4], manualCount: 6, autoCount: 12, qaResource: "Alex Ro", testCases: [
    { id: "TC-501", title: "Sec: SQL Injection vulnerabilities", priority: "P0", tags: ["Sec", "OWASP"], day: "Day 5", status: "Pass", time: "1h", executedBy: "ZAP" },
    { id: "TC-502", title: "Perf: 10k concurrent users", priority: "P1", tags: ["Load", "k6"], day: "Day 5", status: "Pending", time: "-", executedBy: "-" },
    { id: "TC-503", title: "Sec: XSS header validation", priority: "P1", tags: ["Sec"], day: "Day 5", status: "Pass", time: "30m", executedBy: "Alex R." },
  ]},
  { id: 5, title: "Release", subtitle: "Day 6 • Final Regression", days: [5], manualCount: 14, autoCount: 150, qaResource: "Sarah Jenkins", testCases: [
    { id: "TC-601", title: "Smoke Test: Production Env", priority: "P0", tags: ["Smoke", "Prod"], day: "Day 6", status: "Scheduled", time: "-", executedBy: "-" },
    { id: "TC-602", title: "Full Regression Suite", priority: "P1", tags: ["Reg"], day: "Day 6", status: "Running", time: "2h...", executedBy: "Jenkins" },
    { id: "TC-603", title: "Release Notes Verification", priority: "P2", tags: ["Doc"], day: "Day 6", status: "Pending", time: "-", executedBy: "-" },
  ]}
];

function TestExecutionDetailScreen({ onClose, testRun }) {
  const scrollRef = useRef(null);
  const [activeSection, setActiveSection] = useState(0);
  const [activeDay, setActiveDay] = useState(0);
  const [selectedSection, setSelectedSection] = useState(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      const numDays = DETAIL_DAYS.length;
      const progressPercent = v * 100;
      let newActiveDay = 0;
      for (let i = numDays - 1; i >= 0; i--) {
        const dayPosition = (i / (numDays - 1)) * 100;
        if (progressPercent >= dayPosition) {
          newActiveDay = i;
          break;
        }
      }
      setActiveDay(newActiveDay);
      const sectionIndex = DETAIL_SECTIONS.findIndex(s => s.days.includes(newActiveDay));
      if (sectionIndex !== -1) setActiveSection(sectionIndex);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  const progressHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative h-full w-full bg-[#1c1c1c] text-[#e8e6dc] antialiased">
        <button onClick={onClose} className="fixed top-6 right-6 z-30 p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div ref={scrollRef} className="h-screen w-full overflow-y-auto bg-[#1c1c1c] text-[#e8e6dc] flex">
          <div className="flex-1 px-6 md:px-24 py-[35vh] space-y-[55vh]">
            {DETAIL_SECTIONS.map((s, i) => {
              const yParallax = useTransform(smoothProgress, [0, 1], [18 * (i + 1), -18 * (i + 1)]);
              const opacityParallax = useTransform(smoothProgress, [i / DETAIL_SECTIONS.length, (i + 0.4) / DETAIL_SECTIONS.length], [0.3, 1]);
              return (
                <motion.section key={s.id} style={{ y: yParallax, opacity: opacityParallax }} initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ root: scrollRef, amount: 0.55 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="max-w-[720px] mx-auto md:mx-0 cursor-pointer group" onClick={() => setSelectedSection(s)}>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-sm font-medium tracking-wider uppercase text-gray-500">{s.subtitle}</p>
                    <div className="h-px bg-gray-800 flex-1 group-hover:bg-gray-700 transition-colors" />
                  </div>
                  <h2 className="text-5xl md:text-[64px] font-light tracking-tight leading-[1.1] group-hover:text-white transition-colors">{s.title}</h2>
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
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white font-bold">{s.qaResource.split(' ').map(n => n[0]).join('')}</div>
                        <span className="text-sm text-gray-300">{s.qaResource}</span>
                      </div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Owner</span>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-sm text-[#ff2b06] hover:text-[#ff5c3e] transition-colors">
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
          <div className="w-[140px] sticky top-0 h-screen flex items-center justify-center shrink-0 border-l border-white/5 bg-[#1c1c1c]">
            <div className="relative h-[72%] w-[80px] rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
              <motion.div className="absolute top-0 left-0 right-0 bg-[#ff2b06]" style={{ height: progressHeight }} />
              <div className="relative z-10 flex flex-col items-center justify-between h-full py-6">
                {DETAIL_DAYS.map((d, i) => {
                  const isCompleted = i < activeDay;
                  const isActive = i === activeDay;
                  return (
                    <motion.div key={d} className="relative z-20" animate={{ scale: isActive ? 1.05 : isCompleted ? 1.0 : 0.95 }}>
                      <motion.div className="w-16 h-8 rounded-full flex items-center justify-center text-[11px] font-bold tracking-tight" animate={{ backgroundColor: isCompleted || isActive ? "#ff2b06" : "rgba(30,30,30,0.8)", color: isCompleted || isActive ? "#ffffff" : "#666666", border: isCompleted || isActive ? "1px solid #ff4d2e" : "1px solid rgba(255,255,255,0.1)" }} transition={{ duration: 0.25 }}>{d}</motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <AnimatePresence>
          {selectedSection && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedSection(null)}>
              <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full h-full bg-[#252525] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/10 flex justify-between items-start shrink-0">
                  <div>
                    <h3 className="text-2xl text-white font-light">{selectedSection.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">Detailed Execution Report</p>
                  </div>
                  <button onClick={() => setSelectedSection(null)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
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
                      {selectedSection.testCases.map((tc) => (
                        <tr key={tc.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4 font-mono text-gray-500 text-xs">{tc.id}</td>
                          <td className="px-6 py-4 font-medium text-white">{tc.title}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tc.priority === 'P0' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              tc.priority === 'P1' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>{tc.priority}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1 flex-wrap">
                              {tc.tags.map((tag) => (
                                <span key={tag} className="px-1.5 py-0.5 rounded-sm bg-gray-800 text-gray-400 text-[10px] border border-gray-700">{tag}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs">{tc.day}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              tc.status === 'Pass' ? 'bg-green-500/10 text-green-400' :
                              tc.status === 'Fail' ? 'bg-red-500/10 text-red-400' :
                              tc.status === 'Running' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${tc.status === 'Pass' ? 'bg-green-500' : tc.status === 'Fail' ? 'bg-red-500' : tc.status === 'Running' ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'}`} />
                              {tc.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-gray-400">{tc.time}</td>
                          <td className="px-6 py-4 text-xs">
                            <div className="flex items-center gap-2">
                              {tc.executedBy !== '-' && (<div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[9px] text-white">{tc.executedBy.charAt(0)}</div>)}
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
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
  const [modalMode, setModalMode] = useState("fullscreen");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [testExecutionOpen, setTestExecutionOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPlanData, setPreviewPlanData] = useState(null);
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [viewMode, setViewMode] = useState('kanban');
  const [activeSection, setActiveSection] = useState("meta");
  const modalScrollRef = useRef(null);
  const isManualScrollRef = useRef(false);

  const OUTLINE_SECTIONS = useMemo(() => [
    { id: "meta", label: "Project details" },
    { id: "scope", label: "Scope & objectives" },
    { id: "checklists", label: "Checklists" },
    { id: "schedule", label: "Schedule" },
    { id: "comments", label: "Comments" },
  ], []);

  const [meta, setMeta] = useState({
    projectName: "", projectNumber: "", projectManager: "", date: new Date().toISOString().split('T')[0],
    version: "", status: "Draft", documentId: "", projectId: "", businessUnit: "", sprintNumber: "",
  });

  const [qaResources, setQaResources] = useState({
    "QA Lead": false, "QA Analyst 1": false, "QA Analyst 2": false, "Automation Engineer": false, "Performance Tester": false,
  });

  const [scope, setScope] = useState({ overview: "", inScope: "", outScope: "", objectives: "" });
  const [masterChecks, setMasterChecks] = useState({
    unit: { checked: true, days: 0 }, functional: { checked: true, days: 0 }, regression: { checked: true, days: 0 },
    load: { checked: false, days: 0 }, volume: { checked: false, days: 0 }, acceptance: { checked: true, days: 0 }, usability: { checked: true, days: 0 },
  });
  const [reviewDays, setReviewDays] = useState(0);
  const [qaChecks, setQaChecks] = useState({
    framework: false, ide: false, decouple: false, concurrent: false, passwords: false,
    logging: false, modular: false, consistency: false, validations: false, owasp: false,
  });
  const [timeline, setTimeline] = useState({ start: "", end: "", dependencies: "" });
  const [comments, setComments] = useState("");
  const [manualTestCount, setManualTestCount] = useState(0);
  const [automatedTestCount, setAutomatedTestCount] = useState(0);

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setMeta(draft.meta);
      setScope(draft.scope);
      if (draft.comments) setComments(draft.comments);
      setMasterChecks(draft.masterChecks);
      setQaChecks(draft.qaChecks);
      setTimeline(draft.timeline);
      if (draft.qaResources) setQaResources(draft.qaResources);
      if (draft.reviewDays !== undefined) setReviewDays(draft.reviewDays);
    }
    setFolders(loadFolders());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft({ meta, scope, masterChecks, qaChecks, qaResources, timeline, comments, reviewDays });
    }, 10000);
    return () => clearInterval(interval);
  }, [meta, scope, masterChecks, qaChecks, qaResources, timeline, comments, reviewDays]);

  const handleSave = () => {
    if (!selectedFolderId || !meta.projectName) return;
    setSaveStatus("saving");
    const planId = generatePlanId();
    const newPlan = {
      id: planId,
      meta,
      scope,
      masterChecks,
      qaChecks,
      qaResources,
      timeline,
      comments,
      reviewDays,
      manualTestCount,
      automatedTestCount,
    };
    saveTestPlanToFolder(selectedFolderId, newPlan);
    setTimeout(() => {
      setSaveStatus("saved");
      setFolders(loadFolders());
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F2EA14] text-neutral-900 selection:bg-black selection:text-[#F2EA14]">
      {/* UI Elements here */}
      <TestExecutionFlow open={testExecutionOpen} onClose={() => setTestExecutionOpen(false)} />
    </div>
  );
}
