import type { Release, ReleaseStep } from "./types";

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export type InitialDataQuery = {
  releaseSteps: ReleaseStep[];
  releases: Release[];
};

export type CreateReleaseMutation = {
  createRelease: Release;
};

export type SetReleaseStepMutation = {
  setReleaseStep: Release;
};

export type UpdateReleaseInfoMutation = {
  updateReleaseInfo: Release;
};

export type DeleteReleaseMutation = {
  deleteRelease: boolean;
};

export const INITIAL_QUERY = `
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

export const CREATE_RELEASE_MUTATION = `
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

export const SET_RELEASE_STEP_MUTATION = `
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

export const UPDATE_RELEASE_INFO_MUTATION = `
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

export const DELETE_RELEASE_MUTATION = `
  mutation DeleteRelease($releaseId: ID!) {
    deleteRelease(releaseId: $releaseId)
  }
`;

export async function graphqlFetch<
  TData,
  TVariables = Record<string, unknown>,
>(query: string, variables?: TVariables): Promise<TData> {
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
