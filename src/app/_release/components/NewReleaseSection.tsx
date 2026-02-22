import { FormEvent } from "react";
import styles from "../../page.module.css";
import type { ReleaseStep } from "../types";

type NewReleaseSectionProps = {
  steps: ReleaseStep[];
  newName: string;
  newDueDate: string;
  newAdditionalInfo: string;
  newCompletedStepIds: string[];
  createPending: boolean;
  onBack: () => void;
  onNameChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onAdditionalInfoChange: (value: string) => void;
  onToggleNewStep: (stepId: string, checked: boolean) => void;
  onCreate: () => Promise<void>;
};

export function NewReleaseSection({
  steps,
  newName,
  newDueDate,
  newAdditionalInfo,
  newCompletedStepIds,
  createPending,
  onBack,
  onNameChange,
  onDueDateChange,
  onAdditionalInfoChange,
  onToggleNewStep,
  onCreate,
}: NewReleaseSectionProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onCreate();
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>Add release</h2>
        <button type="button" onClick={onBack}>
          Back to list
        </button>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>Release name</span>
            <input
              type="text"
              value={newName}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Version 1.2.0"
              required
            />
          </label>
          <label className={styles.field}>
            <span>Due date</span>
            <input
              type="date"
              value={newDueDate}
              onChange={(event) => onDueDateChange(event.target.value)}
              required
            />
          </label>
        </div>

        <div className={styles.stepsBlock}>
          <h3>Checklist steps</h3>
          <div className={styles.stepsList}>
            {steps.map((step) => (
              <label key={step.id} className={styles.stepItem}>
                <input
                  type="checkbox"
                  checked={newCompletedStepIds.includes(step.id)}
                  onChange={(event) =>
                    onToggleNewStep(step.id, event.target.checked)
                  }
                />
                <span>{step.label}</span>
              </label>
            ))}
          </div>
        </div>

        <label className={styles.field}>
          <span>Additional remarks / tasks</span>
          <textarea
            value={newAdditionalInfo}
            onChange={(event) => onAdditionalInfoChange(event.target.value)}
            placeholder="Optional notes for this release."
            rows={5}
          />
        </label>

        <div className={styles.formActions}>
          <button type="submit" disabled={createPending}>
            {createPending ? "Creating..." : "Create release"}
          </button>
        </div>
      </form>
    </section>
  );
}
