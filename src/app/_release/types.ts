export type ReleaseStatus = "planned" | "ongoing" | "done";

export type ReleaseStep = {
  id: string;
  label: string;
};

export type Release = {
  id: string;
  name: string;
  dueDate: string;
  additionalInfo: string | null;
  completedStepIds: string[];
  status: ReleaseStatus;
};

export type ReleaseView = "list" | "new" | "edit";
