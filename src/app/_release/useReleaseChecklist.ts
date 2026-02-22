import { useEffect, useMemo, useState } from "react";
import {
  CREATE_RELEASE_MUTATION,
  DELETE_RELEASE_MUTATION,
  INITIAL_QUERY,
  SET_RELEASE_STEP_MUTATION,
  UPDATE_RELEASE_INFO_MUTATION,
  graphqlFetch,
  type CreateReleaseMutation,
  type DeleteReleaseMutation,
  type InitialDataQuery,
  type SetReleaseStepMutation,
  type UpdateReleaseInfoMutation,
} from "./graphql";
import type { Release, ReleaseStep, ReleaseView } from "./types";
import { getDefaultDueDateLocal, sortReleases, upsertRelease } from "./utils";

export function useReleaseChecklist() {
  const [steps, setSteps] = useState<ReleaseStep[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [view, setView] = useState<ReleaseView>("list");
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

  const retryLoad = async () => {
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

  const createRelease = async () => {
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

  const toggleReleaseStep = async (stepId: string, checked: boolean) => {
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

  const saveAdditionalInfo = async () => {
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

  const deleteRelease = async (releaseId: string) => {
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

  return {
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
  };
}
