"use client";

import { EditReleaseSection } from "./_release/components/EditReleaseSection";
import { NewReleaseSection } from "./_release/components/NewReleaseSection";
import { ReleaseListSection } from "./_release/components/ReleaseListSection";
import { useReleaseChecklist } from "./_release/useReleaseChecklist";
import styles from "./page.module.css";

export default function Home() {
  const {
    steps,
    releases,
    view,
    selectedRelease,
    newName,
    newDueDate,
    newAdditionalInfo,
    newCompletedStepIds,
    editAdditionalInfo,
    initialLoading,
    loadingError,
    createPending,
    saveInfoPending,
    activeStepId,
    deletePending,
    setNewName,
    setNewDueDate,
    setNewAdditionalInfo,
    setEditAdditionalInfo,
    openListView,
    openNewView,
    openEditView,
    retryLoad,
    createRelease,
    toggleReleaseStep,
    saveAdditionalInfo,
    deleteRelease,
    toggleNewStep,
  } = useReleaseChecklist();

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <header className={styles.header}>
          <h1>Release Checklist</h1>
          <p>Simple release tracking for planning, execution, and completion.</p>
        </header>

        {loadingError ? (
          <div className={styles.errorBox}>
            <span>{loadingError}</span>
            <button type="button" onClick={() => void retryLoad()}>
              Retry
            </button>
          </div>
        ) : null}

        {initialLoading ? (
          <section className={styles.panel}>
            <p>Loading releases...</p>
          </section>
        ) : null}

        {!initialLoading && view === "list" ? (
          <ReleaseListSection
            releases={releases}
            deletePending={deletePending}
            onOpenNew={openNewView}
            onOpenEdit={openEditView}
            onDelete={(releaseId) => void deleteRelease(releaseId)}
          />
        ) : null}

        {!initialLoading && view === "new" ? (
          <NewReleaseSection
            steps={steps}
            newName={newName}
            newDueDate={newDueDate}
            newAdditionalInfo={newAdditionalInfo}
            newCompletedStepIds={newCompletedStepIds}
            createPending={createPending}
            onBack={openListView}
            onNameChange={setNewName}
            onDueDateChange={setNewDueDate}
            onAdditionalInfoChange={setNewAdditionalInfo}
            onToggleNewStep={toggleNewStep}
            onCreate={createRelease}
          />
        ) : null}

        {!initialLoading && view === "edit" && selectedRelease ? (
          <EditReleaseSection
            release={selectedRelease}
            steps={steps}
            editAdditionalInfo={editAdditionalInfo}
            deletePending={deletePending}
            saveInfoPending={saveInfoPending}
            activeStepId={activeStepId}
            onBack={openListView}
            onDelete={(releaseId) => void deleteRelease(releaseId)}
            onEditAdditionalInfoChange={setEditAdditionalInfo}
            onToggleStep={toggleReleaseStep}
            onSaveAdditionalInfo={saveAdditionalInfo}
          />
        ) : null}
      </main>
    </div>
  );
}
