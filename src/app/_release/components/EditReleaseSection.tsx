import { FormEvent } from "react";
import styles from "../../page.module.css";
import type { Release, ReleaseStep } from "../types";
import { toDateInputValue } from "../utils";

type EditReleaseSectionProps = {
  release: Release;
  steps: ReleaseStep[];
  editAdditionalInfo: string;
  deletePending: boolean;
  saveInfoPending: boolean;
  activeStepId: string | null;
  onBack: () => void;
  onDelete: (releaseId: string) => void;
  onEditAdditionalInfoChange: (value: string) => void;
  onToggleStep: (stepId: string, checked: boolean) => Promise<void>;
  onSaveAdditionalInfo: () => Promise<void>;
};

export function EditReleaseSection({
  release,
  steps,
  editAdditionalInfo,
  deletePending,
  saveInfoPending,
  activeStepId,
  onBack,
  onDelete,
  onEditAdditionalInfoChange,
  onToggleStep,
  onSaveAdditionalInfo,
}: EditReleaseSectionProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSaveAdditionalInfo();
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>Update release</h2>
        <div className={styles.headerActions}>
          <button type="button" onClick={onBack}>
            Back to list
          </button>
          <button
            type="button"
            onClick={() => onDelete(release.id)}
            disabled={deletePending}
          >
            Delete
          </button>
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>Release name</span>
            <input type="text" value={release.name} readOnly />
          </label>
          <label className={styles.field}>
            <span>Due date</span>
            <input type="date" value={toDateInputValue(release.dueDate)} readOnly />
          </label>
        </div>

        <div className={styles.stepsBlock}>
          <h3>Checklist steps</h3>
          <div className={styles.stepsList}>
            {steps.map((step) => (
              <label key={step.id} className={styles.stepItem}>
                <input
                  type="checkbox"
                  checked={release.completedStepIds.includes(step.id)}
                  onChange={(event) =>
                    void onToggleStep(step.id, event.target.checked)
                  }
                  disabled={activeStepId === step.id || saveInfoPending}
                />
                <span>{step.label}</span>
              </label>
            ))}
          </div>
        </div>

        <label className={styles.field}>
          <span>Additional remarks / tasks</span>
          <textarea
            value={editAdditionalInfo}
            onChange={(event) => onEditAdditionalInfoChange(event.target.value)}
            placeholder="Optional notes for this release."
            rows={5}
          />
        </label>

        <div className={styles.formActions}>
          <button type="submit" disabled={saveInfoPending || activeStepId !== null}>
            {saveInfoPending ? "Saving..." : "Save notes"}
          </button>
        </div>
      </form>
    </section>
  );
}
