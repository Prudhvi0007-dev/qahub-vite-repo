import { motion, useScroll, useTransform, AnimatePresence, useSpring } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const DAYS = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6"];

// Expanded data with comprehensive fields for the new table structure
const SECTIONS = [
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

function TestPlannerHome() {
  const scrollRef = useRef(null);
  const [activeSection, setActiveSection] = useState(0);
  const [activeDay, setActiveDay] = useState(0);
  const [selectedSection, setSelectedSection] = useState(null); 

  const { scrollYProgress } = useScroll({ container: scrollRef });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      const sectionIndex = Math.min(
        SECTIONS.length - 1,
        Math.floor(v * SECTIONS.length)
      );
      setActiveSection(sectionIndex);

      const sectionDays = SECTIONS[sectionIndex].days;
      const localProgress = (v * SECTIONS.length - sectionIndex) * sectionDays.length;
      const dayIndex = sectionDays[Math.min(
        sectionDays.length - 1,
        Math.floor(localProgress)
      )];

      setActiveDay(dayIndex);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  const progressHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="h-screen w-full overflow-y-auto bg-[#1c1c1c] text-[#e8e6dc] flex antialiased selection:bg-[#ff2b06] selection:text-white"
      >
        {/* Left Scroll Content */}
        <div className="flex-1 px-6 md:px-24 py-[35vh] space-y-[55vh]">
          {SECTIONS.map((s, i) => {
            const yParallax = useTransform(
              smoothProgress,
              [0, 1],
              [18 * (i + 1), -18 * (i + 1)]
            );
            const opacityParallax = useTransform(
              smoothProgress,
              [i / SECTIONS.length, (i + 0.4) / SECTIONS.length],
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
              {DAYS.map((d, i) => {
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
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedSection(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-6xl bg-[#252525] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
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
                    {selectedSection.testCases.map((tc) => (
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
                            {tc.tags.map(tag => (
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
  );
}

export default function App() {
  return <TestPlannerHome />;
}