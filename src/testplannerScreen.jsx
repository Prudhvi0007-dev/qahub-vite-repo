import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useRef, useEffect } from "react";

function AnimatedLeftPlan({ plan, index, total, scrollYProgress, statusColor }) {
  const segment = 1 / total;
  const start = index * segment;
  const midStart = start + segment * 0.2;
  const midEnd = start + segment * 0.8;
  const end = start + segment;

  // FIRST plan: visible initially, fade out when scrolling to second
  const opacity =
    index === 0
      ? useTransform(scrollYProgress, [0, segment * 0.9, segment], [1, 1, 0])
      : useTransform(
          scrollYProgress,
          [start, midStart, midEnd, end],
          [0, 1, 1, 0]
        );

  const y =
    index === 0
      ? useTransform(scrollYProgress, [0, segment], [0, -40])
      : useTransform(
          scrollYProgress,
          [start, midStart, midEnd, end],
          [80, 0, 0, -40]
        );

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute top-1/2 -translate-y-1/2 space-y-6 pointer-events-none"
    >
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-500">
          {index + 1} / {total}
        </span>
        <span className={`text-xs ${statusColor(plan.status)}`}>
          {plan.status}
        </span>
      </div>
      <h1 className="text-[48px] font-semibold text-neutral-100">
        {plan.name}
      </h1>
      <p className="text-neutral-500 max-w-md">
        End-to-end quality strategy covering all critical business flows
      </p>
    </motion.div>
  );
}

function AnimatedRightPlan({ plan, index, total, scrollYProgress }) {
  const segment = 1 / total;
  const start = index * segment;
  const midStart = start + segment * 0.2;
  const midEnd = start + segment * 0.8;
  const end = start + segment;

  // FIRST plan: visible initially, fade out when scrolling to second
  const opacity =
    index === 0
      ? useTransform(scrollYProgress, [0, segment * 0.9, segment], [1, 1, 0])
      : useTransform(
          scrollYProgress,
          [start, midStart, midEnd, end],
          [0, 1, 1, 0]
        );

  const y =
    index === 0
      ? useTransform(scrollYProgress, [0, segment], [0, -40])
      : useTransform(
          scrollYProgress,
          [start, midStart, midEnd, end],
          [100, 0, 0, -40]
        );

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute top-1/2 -translate-y-1/2 w-full"
    >
      <div className="grid grid-cols-3 gap-20">
        <div>
          <div className="text-7xl font-semibold text-neutral-100">
            {plan.metrics.manual}
          </div>
          <div className="text-sm text-neutral-500">Manual Tests</div>
        </div>
        <div>
          <div className="text-7xl font-semibold text-neutral-100">
            {plan.metrics.automation}
          </div>
          <div className="text-sm text-neutral-500">Automation Tests</div>
        </div>
        <div>
          <div className="text-7xl font-semibold text-neutral-100">
            {plan.metrics.suites}
          </div>
          <div className="text-sm text-neutral-500">Test Suites</div>
          <div className="text-xs text-neutral-600">
            {plan.suiteNames.join(" • ")}
          </div>
        </div>
      </div>

      <div
        className="mt-24 flex gap-16 pointer-events-auto"
        role="group"
        aria-label="Test plan actions"
      >
        {["Edit", "Preview", "Run", "Delete"].map(label => (
          <button
            key={label}
            type="button"
            className="text-sm tracking-wide text-neutral-400 hover:text-neutral-100 transition"
          >
            {label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default function TestPlanScrollUI() {
  const [activeMonth, setActiveMonth] = useState("Dec");
  const [year, setYear] = useState(2025);
  const [activeNav, setActiveNav] = useState("Test Planner");
  const [viewMode, setViewMode] = useState("timeline");

  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const plans = [
    {
      name: "Payments Test Plan",
      status: "APPROVED",
      metrics: { manual: 30, automation: 70, suites: 3 },
      suiteNames: ["Unit", "Functional", "Regression"],
    },
    {
      name: "Receivables Test Plan",
      status: "DRAFT",
      metrics: { manual: 24, automation: 66, suites: 3 },
      suiteNames: ["Unit", "Functional", "Regression"],
    },
    {
      name: "Ledger Test Plan",
      status: "SIGNED OFF",
      metrics: { manual: 18, automation: 58, suites: 3 },
      suiteNames: ["Unit", "Functional", "Regression"],
    },
  ];

  const plansByMonth = {
    Dec: plans,
    Nov: [],
    Oct: [],
  };

  const activePlans = plansByMonth[activeMonth] || [];
  const totalPlans = activePlans.length;

  useEffect(() => {
    if (ref.current && viewMode === "timeline") {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMonth, year, viewMode]);

  const statusColor = status => {
    if (status === "APPROVED") return "text-orange-400";
    if (status === "SIGNED OFF") return "text-green-400";
    return "text-neutral-400";
  };

  return (
    <section
      ref={ref}
      className={`relative ${
        viewMode === "timeline" ? "min-h-[800vh]" : "min-h-screen"
      } bg-[#0b0d12]`}
    >
      {/* TOP NAV + MONTH ROW (always visible) */}
      <div className="sticky top-0 z-50 bg-[#0b0d12]">
        <nav
          className="relative inset-x-32 mx-auto px-32 pt-4 flex items-center justify-between"
          role="navigation"
        >
          <div className="flex items-center gap-12 text-sm tracking-wide">
            {["Test Planner", "Suite Builder", "Suite Manager", "Test Execution"].map(
              link => (
                <button
                  key={link}
                  onClick={() => setActiveNav(link)}
                  className={`relative ${
                    activeNav === link
                      ? "text-neutral-100"
                      : "text-neutral-400 hover:text-neutral-100"
                  }`}
                >
                  {link}
                  {activeNav === link && (
                    <span className="absolute -bottom-2 left-0 right-0 h-[2px] bg-neutral-200 rounded-full" />
                  )}
                </button>
              )
            )}
          </div>

          <div className="flex justify-end items-center gap-4">
            <button className="px-5 py-2 text-sm rounded-md bg-neutral-200 text-neutral-900 mr-2">
              Create test plan
            </button>
            <button className="flex flex-col gap-[4px] p-2 rounded-md hover:bg-neutral-800">
              <span className="w-5 h-[2px] bg-neutral-300" />
              <span className="w-5 h-[2px] bg-neutral-300" />
              <span className="w-5 h-[2px] bg-neutral-300" />
            </button>
          </div>
        </nav>

        <div className="relative inset-x-32 mx-auto px-32 pt-6 pb-4 flex items-center justify-between">
          <div className="flex gap-3">
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(
              m => (
                <button
                  key={m}
                  onClick={() => setActiveMonth(m)}
                  className={`px-3 py-1 text-xs rounded-full ${
                    activeMonth === m
                      ? "bg-neutral-200 text-neutral-900"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  {m}
                </button>
              )
            )}
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="ml-4 bg-transparent text-sm text-neutral-400 border border-neutral-700 rounded px-3 py-1"
            >
              {[2023, 2024, 2025, 2026].map(y => (
                <option key={y} value={y} className="bg-[#0b0d12]">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() =>
              setViewMode(viewMode === "timeline" ? "kanban" : "timeline")
            }
            className={`px-4 py-2 text-sm rounded-md border ${
              viewMode === "kanban"
                ? "border-neutral-200 text-neutral-100"
                : "border-neutral-700 text-neutral-400 hover:text-neutral-100"
            }`}
          >
            {viewMode === "kanban" ? "Timeline View" : "Kanban View"}
          </button>
        </div>
      </div>

      {/* TIMELINE VIEW */}
      {viewMode === "timeline" && (
        <div className="sticky top-0 h-screen grid grid-cols-12 px-32 gap-24 pointer-events-none">
          {activePlans.length > 0 && (
            <div className="absolute left-[47%] top-1/2 -translate-y-1/2 h-[70vh] w-px bg-neutral-800 overflow-hidden">
              <motion.div
                style={{ scaleY: scrollYProgress, transformOrigin: "top" }}
                className="absolute top-0 left-0 w-px h-full bg-neutral-400"
              />
            </div>
          )}

          {activePlans.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-neutral-200">
                  No test plans for {activeMonth} {year}
                </h2>
                <p className="mt-2 text-neutral-500">
                  Test plans haven’t been created for this month yet.
                </p>
              </div>
            </div>
          )}

          {activePlans.length > 0 && (
            <>
              <div className="col-span-5 relative flex flex-col justify-center pr-12">
                {activePlans.map((plan, i) => (
                  <AnimatedLeftPlan
                    key={plan.name}
                    plan={plan}
                    index={i}
                    total={totalPlans}
                    scrollYProgress={scrollYProgress}
                    statusColor={statusColor}
                  />
                ))}
              </div>
              <div className="col-span-7 relative flex flex-col justify-center pl-12">
                {activePlans.map((plan, i) => (
                  <AnimatedRightPlan
                    key={plan.name}
                    plan={plan}
                    index={i}
                    total={totalPlans}
                    scrollYProgress={scrollYProgress}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === "kanban" && (
        <div className="px-32 pt-40 pb-16 grid grid-cols-3 gap-12">
          {["DRAFT", "APPROVED", "SIGNED OFF"].map(status => (
            <div key={status} className="flex flex-col">
              <h3 className={`mb-6 text-sm tracking-wide ${statusColor(status)}`}>
                {status}
              </h3>
              <div className="space-y-4">
                {activePlans
                  .filter(p => p.status === status)
                  .map(plan => (
                    <div
                      key={plan.name}
                      className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/40"
                    >
                      <h4 className="text-sm font-medium text-neutral-100">
                        {plan.name}
                      </h4>
                      <div className="mt-3 flex gap-4 text-xs text-neutral-500">
                        <span>Manual {plan.metrics.manual}</span>
                        <span>Auto {plan.metrics.automation}</span>
                      </div>
                      <div className="mt-4 flex gap-4 text-xs">
                        {["Edit", "Preview", "Run", "Delete"].map(a => (
                          <button
                            key={a}
                            className="text-neutral-400 hover:text-neutral-100"
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
