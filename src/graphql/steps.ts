export const RELEASE_STEPS = [
  { id: "qa_signoff", label: "QA sign-off complete" },
  { id: "security_review", label: "Security review complete" },
  { id: "changelog_ready", label: "Changelog prepared" },
  { id: "releases_github_created", label: "Releases in GitHub created" },
  { id: "database_migration", label: "Database migration verified" },
  { id: "monitoring_ready", label: "Monitoring checks ready" },
  { id: "deployed_staging", label: "Deployed in staging" },
  { id: "deployed_production", label: "Deployed in production" },
] as const;

export const RELEASE_STEP_IDS: string[] = RELEASE_STEPS.map((step) => step.id);
