/**
 * Shared storage utility for test plans
 * This allows CreateTestPlan and TestPlannerScreen to share data
 */

export type TestPlan = {
  id: string;
  name: string;
  owner: string;
  createdAtMs: number;
  updatedAtMs: number;
  createdAtLabel: string;
  updatedAtLabel: string;
  sections: Record<string, string>;
  // Test counts
  manualTestCount?: number;
  automatedTestCount?: number;
  // Additional fields from CreateTestPlan
  meta?: {
    projectName: string;
    projectNumber: string;
    projectManager: string;
    date: string;
    version: string;
    status: string;
    documentId: string;
    projectId: string;
    businessUnit: string;
    sprintNumber: string;
  };
  scope?: {
    overview: string;
    inScope: string;
    outScope: string;
    objectives: string;
  };
  masterChecks?: any;
  qaChecks?: Record<string, boolean>;
  timeline?: {
    start: string;
    end: string;
    dependencies: string;
  };
  comments?: string;
};

export type Folder = {
  id: string;
  name: string;
  badge: string;
  plans: TestPlan[];
};

const FOLDERS_STORAGE_KEY = "test-planner-folders";

export function loadFolders(): Folder[] {
  try {
    const stored = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error("Failed to load folders from localStorage:", err);
  }
  // Return default folders
  return [
    { id: "f_design", name: "Design Career", badge: "0", plans: [] },
    { id: "f_ai", name: "AI thinking", badge: "0", plans: [] },
    { id: "f_fun", name: "Fun tech", badge: "0", plans: [] },
    { id: "f_craft", name: "Preserving craft", badge: "0", plans: [] },
  ];
}

export function saveFolders(folders: Folder[]): void {
  try {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
  } catch (err) {
    console.error("Failed to save folders to localStorage:", err);
  }
}

export function saveTestPlanToFolder(plan: TestPlan, folderId?: string): boolean {
  try {
    const folders = loadFolders();

    // If no folder specified, save to the first folder
    const targetFolderId = folderId || folders[0]?.id;

    const folderIndex = folders.findIndex((f) => f.id === targetFolderId);
    if (folderIndex === -1) {
      console.error("Folder not found:", targetFolderId);
      return false;
    }

    // Check if plan already exists (update) or is new (add)
    const planIndex = folders[folderIndex].plans.findIndex((p) => p.id === plan.id);

    if (planIndex >= 0) {
      // Update existing plan
      folders[folderIndex].plans[planIndex] = plan;
    } else {
      // Add new plan at the beginning
      folders[folderIndex].plans.unshift(plan);
    }

    saveFolders(folders);
    return true;
  } catch (err) {
    console.error("Failed to save test plan:", err);
    return false;
  }
}

export function generatePlanId(): string {
  return `plan_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function formatDate(date?: Date): { ms: number; label: string } {
  const d = date || new Date();
  return {
    ms: d.getTime(),
    label: d.toLocaleString(),
  };
}
