export const RELEASE_STEPS = [
  { id: "code_freeze", label: "Code freeze complete" },
  { id: "qa_signoff", label: "QA sign-off complete" },
  { id: "security_review", label: "Security review complete" },
  { id: "changelog_ready", label: "Changelog prepared" },
  { id: "rollout_plan", label: "Rollout plan validated" },
  { id: "database_migration", label: "Database migration verified" },
  { id: "monitoring_ready", label: "Monitoring checks ready" },
  { id: "post_release_owner", label: "Post-release owner assigned" },
] as const;

export const RELEASE_STEP_IDS: string[] = RELEASE_STEPS.map((step) => step.id);
