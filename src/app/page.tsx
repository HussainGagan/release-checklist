"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type ReleaseStatus = "planned" | "ongoing" | "done";

type ReleaseStep = {
  id: string;
  label: string;
};

type Release = {
  id: string;
  name: string;
  dueDate: string;
  additionalInfo: string | null;
  completedStepIds: string[];
  status: ReleaseStatus;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type InitialDataQuery = {
  releaseSteps: ReleaseStep[];
  releases: Release[];
};

type CreateReleaseMutation = {
  createRelease: Release;
};

type SetReleaseStepMutation = {
  setReleaseStep: Release;
};

type UpdateReleaseInfoMutation = {
  updateReleaseInfo: Release;
};

type DeleteReleaseMutation = {
  deleteRelease: boolean;
};

const INITIAL_QUERY = `
  query InitialData {
    releaseSteps {
      id
      label
    }
    releases {
      id
      name
      dueDate
      additionalInfo
      completedStepIds
      status
    }
  }
`;

const CREATE_RELEASE_MUTATION = `
  mutation CreateRelease($name: String!, $dueDate: String!, $additionalInfo: String) {
    createRelease(name: $name, dueDate: $dueDate, additionalInfo: $additionalInfo) {
      id
      name
      dueDate
      additionalInfo
      completedStepIds
      status
    }
  }
`;

const SET_RELEASE_STEP_MUTATION = `
  mutation SetReleaseStep($releaseId: ID!, $stepId: String!, $checked: Boolean!) {
    setReleaseStep(releaseId: $releaseId, stepId: $stepId, checked: $checked) {
      id
      name
      dueDate
      additionalInfo
      completedStepIds
      status
    }
  }
`;

const UPDATE_RELEASE_INFO_MUTATION = `
  mutation UpdateReleaseInfo($releaseId: ID!, $additionalInfo: String) {
    updateReleaseInfo(releaseId: $releaseId, additionalInfo: $additionalInfo) {
      id
      name
      dueDate
      additionalInfo
      completedStepIds
      status
    }
  }
`;

const DELETE_RELEASE_MUTATION = `
  mutation DeleteRelease($releaseId: ID!) {
    deleteRelease(releaseId: $releaseId)
  }
`;

async function graphqlFetch<TData, TVariables = Record<string, unknown>>(
  query: string,
  variables?: TVariables,
): Promise<TData> {
  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}).`);
  }

  const payload = (await response.json()) as GraphQLResponse<TData>;
  if (payload.errors && payload.errors.length > 0) {
    throw new Error(payload.errors[0].message);
  }

  if (!payload.data) {
    throw new Error("GraphQL response did not include data.");
  }

  return payload.data;
}

function formatDate(dateIso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateIso));
}

function toDateInputValue(iso: string): string {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultDueDateLocal(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);
  return toDateInputValue(date.toISOString());
}

function sortReleases(items: Release[]): Release[] {
  return [...items].sort((left, right) => {
    const dateDelta =
      new Date(right.dueDate).getTime() - new Date(left.dueDate).getTime();
    if (dateDelta !== 0) {
      return dateDelta;
    }
    return Number(right.id) - Number(left.id);
  });
}

function upsertRelease(items: Release[], release: Release): Release[] {
  const next = items.filter((item) => item.id !== release.id);
  next.push(release);
  return sortReleases(next);
}

export default function Home() {
  const [steps, setSteps] = useState<ReleaseStep[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [view, setView] = useState<"list" | "new" | "edit">("list");
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newDueDate, setNewDueDate] = useState(getDefaultDueDateLocal());
  const [newAdditionalInfo, setNewAdditionalInfo] = useState("");
  const [newCompletedStepIds, setNewCompletedStepIds] = useState<string[]>([]);

  const [editAdditionalInfo, setEditAdditionalInfo] = useState("");

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);
  const [saveInfoPending, setSaveInfoPending] = useState(false);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const selectedRelease = useMemo(
    () => releases.find((release) => release.id === selectedReleaseId) ?? null,
    [releases, selectedReleaseId],
  );

  const openListView = () => {
    setView("list");
    setSelectedReleaseId(null);
  };

  const openNewView = () => {
    setView("new");
    setSelectedReleaseId(null);
    setNewName("");
    setNewDueDate(getDefaultDueDateLocal());
    setNewAdditionalInfo("");
    setNewCompletedStepIds([]);
  };

  const openEditView = (releaseId: string) => {
    setView("edit");
    setSelectedReleaseId(releaseId);
  };

  const refreshData = async () => {
    setLoadingError(null);
    const data = await graphqlFetch<InitialDataQuery>(INITIAL_QUERY);
    setSteps(data.releaseSteps);
    setReleases(sortReleases(data.releases));
  };

  useEffect(() => {
    const run = async () => {
      try {
        await refreshData();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load releases.";
        setLoadingError(message);
      } finally {
        setInitialLoading(false);
      }
    };

    void run();
  }, []);

  useEffect(() => {
    if (selectedRelease) {
      setEditAdditionalInfo(selectedRelease.additionalInfo ?? "");
      return;
    }

    if (view === "edit") {
      setView("list");
      setSelectedReleaseId(null);
    }
  }, [selectedRelease, view]);

  const handleRetryLoad = async () => {
    setInitialLoading(true);
    try {
      await refreshData();
      setLoadingError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load releases.";
      setLoadingError(message);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleCreateRelease = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = newName.trim();
    if (!name) {
      setLoadingError("Release name is required.");
      return;
    }

    if (!newDueDate) {
      setLoadingError("Due date is required.");
      return;
    }

    setCreatePending(true);
    setLoadingError(null);

    try {
      const createData = await graphqlFetch<
        CreateReleaseMutation,
        { name: string; dueDate: string; additionalInfo: string | null }
      >(CREATE_RELEASE_MUTATION, {
        name,
        dueDate: new Date(`${newDueDate}T00:00:00`).toISOString(),
        additionalInfo: newAdditionalInfo.trim() || null,
      });

      let latestRelease = createData.createRelease;
      for (const stepId of newCompletedStepIds) {
        const stepData = await graphqlFetch<
          SetReleaseStepMutation,
          { releaseId: string; stepId: string; checked: boolean }
        >(SET_RELEASE_STEP_MUTATION, {
          releaseId: latestRelease.id,
          stepId,
          checked: true,
        });
        latestRelease = stepData.setReleaseStep;
      }

      setReleases((previous) => upsertRelease(previous, latestRelease));
      openListView();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create release.";
      setLoadingError(message);
    } finally {
      setCreatePending(false);
    }
  };

  const handleToggleStep = async (stepId: string, checked: boolean) => {
    if (!selectedRelease) {
      return;
    }

    setActiveStepId(stepId);
    setLoadingError(null);

    try {
      const data = await graphqlFetch<
        SetReleaseStepMutation,
        { releaseId: string; stepId: string; checked: boolean }
      >(SET_RELEASE_STEP_MUTATION, {
        releaseId: selectedRelease.id,
        stepId,
        checked,
      });

      setReleases((previous) => upsertRelease(previous, data.setReleaseStep));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update step.";
      setLoadingError(message);
    } finally {
      setActiveStepId(null);
    }
  };

  const handleSaveAdditionalInfo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedRelease) {
      return;
    }

    setSaveInfoPending(true);
    setLoadingError(null);

    try {
      const data = await graphqlFetch<
        UpdateReleaseInfoMutation,
        { releaseId: string; additionalInfo: string | null }
      >(UPDATE_RELEASE_INFO_MUTATION, {
        releaseId: selectedRelease.id,
        additionalInfo: editAdditionalInfo.trim() || null,
      });

      setReleases((previous) => upsertRelease(previous, data.updateReleaseInfo));
      setEditAdditionalInfo(data.updateReleaseInfo.additionalInfo ?? "");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update notes.";
      setLoadingError(message);
    } finally {
      setSaveInfoPending(false);
    }
  };

  const handleDeleteRelease = async (releaseId: string) => {
    setDeletePending(true);
    setLoadingError(null);

    try {
      const data = await graphqlFetch<
        DeleteReleaseMutation,
        { releaseId: string }
      >(DELETE_RELEASE_MUTATION, { releaseId });

      if (!data.deleteRelease) {
        throw new Error("Release could not be deleted.");
      }

      setReleases((previous) =>
        previous.filter((release) => release.id !== releaseId),
      );

      if (selectedReleaseId === releaseId) {
        openListView();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete release.";
      setLoadingError(message);
    } finally {
      setDeletePending(false);
    }
  };

  const toggleNewStep = (stepId: string, checked: boolean) => {
    setNewCompletedStepIds((previous) => {
      if (checked) {
        return previous.includes(stepId) ? previous : [...previous, stepId];
      }
      return previous.filter((item) => item !== stepId);
    });
  };

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
            <button type="button" onClick={handleRetryLoad}>
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
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>All releases</h2>
              <button type="button" onClick={openNewView}>
                New release
              </button>
            </div>

            {releases.length === 0 ? (
              <p className={styles.emptyState}>No releases yet. Create one to begin.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Release</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {releases.map((release) => (
                      <tr key={release.id}>
                        <td data-label="Release">{release.name}</td>
                        <td data-label="Date">{formatDate(release.dueDate)}</td>
                        <td data-label="Status">
                          <span
                            className={`${styles.status} ${
                              styles[`status${release.status}`]
                            }`}
                          >
                            {release.status}
                          </span>
                        </td>
                        <td data-label="Actions" className={styles.actions}>
                          <button
                            type="button"
                            onClick={() => openEditView(release.id)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRelease(release.id)}
                            disabled={deletePending}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}

        {!initialLoading && view === "new" ? (
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Add release</h2>
              <button type="button" onClick={openListView}>
                Back to list
              </button>
            </div>

            <form className={styles.form} onSubmit={handleCreateRelease}>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>Release name</span>
                  <input
                    type="text"
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    placeholder="Version 1.2.0"
                    required
                  />
                </label>
                <label className={styles.field}>
                  <span>Due date</span>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(event) => setNewDueDate(event.target.value)}
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
                          toggleNewStep(step.id, event.target.checked)
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
                  onChange={(event) => setNewAdditionalInfo(event.target.value)}
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
        ) : null}

        {!initialLoading && view === "edit" && selectedRelease ? (
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Update release</h2>
              <div className={styles.headerActions}>
                <button type="button" onClick={openListView}>
                  Back to list
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRelease(selectedRelease.id)}
                  disabled={deletePending}
                >
                  Delete
                </button>
              </div>
            </div>

            <form className={styles.form} onSubmit={handleSaveAdditionalInfo}>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>Release name</span>
                  <input type="text" value={selectedRelease.name} readOnly />
                </label>
                <label className={styles.field}>
                  <span>Due date</span>
                  <input
                    type="date"
                    value={toDateInputValue(selectedRelease.dueDate)}
                    readOnly
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
                        checked={selectedRelease.completedStepIds.includes(step.id)}
                        onChange={(event) =>
                          void handleToggleStep(step.id, event.target.checked)
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
                  onChange={(event) => setEditAdditionalInfo(event.target.value)}
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
        ) : null}
      </main>
    </div>
  );
}
