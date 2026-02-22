import { db } from "@/db/client";
import { releases, type ReleaseRow } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { createSchema } from "graphql-yoga";
import { RELEASE_STEPS, RELEASE_STEP_IDS } from "./steps";

type ReleaseStatus = "planned" | "ongoing" | "done";

type ReleaseOutput = {
  id: string;
  name: string;
  dueDate: string;
  additionalInfo: string | null;
  completedStepIds: string[];
  status: ReleaseStatus;
  createdAt: string;
  updatedAt: string;
};

type CreateReleaseArgs = {
  name: string;
  dueDate: string;
  additionalInfo?: string | null;
};
type SetReleaseStepArgs = {
  releaseId: string;
  stepId: string;
  checked: boolean;
};
type UpdateReleaseInfoArgs = {
  releaseId: string;
  additionalInfo?: string | null;
};
type DeleteReleaseArgs = { releaseId: string };

function firstOrThrow<T>(rows: T[], message: string): T {
  const row = rows[0];
  if (!row) {
    throw new Error(message);
  }
  return row;
}

function parseReleaseId(rawId: string): number {
  const parsed = Number.parseInt(rawId, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("Invalid release id.");
  }
  return parsed;
}

function parseDueDate(rawDate: string): Date {
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid dueDate. Use an ISO date/time string.");
  }
  return parsed;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeCompletedStepIds(stepIds: string[]): string[] {
  const allowed = new Set(RELEASE_STEP_IDS);
  const selected = new Set<string>();

  for (const stepId of stepIds) {
    if (allowed.has(stepId)) {
      selected.add(stepId);
    }
  }

  return RELEASE_STEP_IDS.filter((stepId) => selected.has(stepId));
}

function computeStatus(completedStepIds: string[]): ReleaseStatus {
  if (completedStepIds.length === 0) {
    return "planned";
  }

  if (completedStepIds.length === RELEASE_STEP_IDS.length) {
    return "done";
  }

  return "ongoing";
}

function toIso(dateValue: Date): string {
  return dateValue.toISOString();
}

function toReleaseOutput(row: ReleaseRow): ReleaseOutput {
  const completedStepIds = normalizeCompletedStepIds(row.completedStepIds ?? []);

  return {
    id: String(row.id),
    name: row.name,
    dueDate: toIso(row.dueDate),
    additionalInfo: row.additionalInfo,
    completedStepIds,
    status: computeStatus(completedStepIds),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

async function getReleaseByIdOrThrow(releaseId: number): Promise<ReleaseRow> {
  const release = await db.query.releases.findFirst({
    where: eq(releases.id, releaseId),
  });

  if (!release) {
    throw new Error("Release not found.");
  }

  return release;
}

export const graphQLSchema = createSchema({
  typeDefs: /* GraphQL */ `
    enum ReleaseStatus {
      planned
      ongoing
      done
    }

    type ReleaseStep {
      id: String!
      label: String!
    }

    type Release {
      id: ID!
      name: String!
      dueDate: String!
      additionalInfo: String
      completedStepIds: [String!]!
      status: ReleaseStatus!
      createdAt: String!
      updatedAt: String!
    }

    type Query {
      releaseSteps: [ReleaseStep!]!
      releases: [Release!]!
    }

    type Mutation {
      createRelease(
        name: String!
        dueDate: String!
        additionalInfo: String
      ): Release!
      setReleaseStep(releaseId: ID!, stepId: String!, checked: Boolean!): Release!
      updateReleaseInfo(releaseId: ID!, additionalInfo: String): Release!
      deleteRelease(releaseId: ID!): Boolean!
    }
  `,
  resolvers: {
    Query: {
      releaseSteps: () => RELEASE_STEPS,
      releases: async (): Promise<ReleaseOutput[]> => {
        const rows = await db
          .select()
          .from(releases)
          .orderBy(desc(releases.dueDate), desc(releases.id));

        return rows.map(toReleaseOutput);
      },
    },
    Mutation: {
      createRelease: async (
        _parent: unknown,
        args: CreateReleaseArgs,
      ): Promise<ReleaseOutput> => {
        const name = args.name.trim();
        if (!name) {
          throw new Error("name is required.");
        }

        const dueDate = parseDueDate(args.dueDate);
        const additionalInfo = normalizeOptionalText(args.additionalInfo);

        const inserted = await db
          .insert(releases)
          .values({
            name,
            dueDate,
            additionalInfo,
            completedStepIds: [],
            updatedAt: new Date(),
          })
          .returning();

        return toReleaseOutput(firstOrThrow(inserted, "Failed to create release."));
      },
      setReleaseStep: async (
        _parent: unknown,
        args: SetReleaseStepArgs,
      ): Promise<ReleaseOutput> => {
        if (!RELEASE_STEP_IDS.includes(args.stepId)) {
          throw new Error("Unknown stepId.");
        }

        const releaseId = parseReleaseId(args.releaseId);
        const currentRelease = await getReleaseByIdOrThrow(releaseId);
        const current = new Set(
          normalizeCompletedStepIds(currentRelease.completedStepIds ?? []),
        );

        if (args.checked) {
          current.add(args.stepId);
        } else {
          current.delete(args.stepId);
        }

        const nextStepIds = normalizeCompletedStepIds(Array.from(current));

        const updated = await db
          .update(releases)
          .set({
            completedStepIds: nextStepIds,
            updatedAt: new Date(),
          })
          .where(eq(releases.id, releaseId))
          .returning();

        return toReleaseOutput(
          firstOrThrow(updated, "Failed to update release steps."),
        );
      },
      updateReleaseInfo: async (
        _parent: unknown,
        args: UpdateReleaseInfoArgs,
      ): Promise<ReleaseOutput> => {
        const releaseId = parseReleaseId(args.releaseId);
        await getReleaseByIdOrThrow(releaseId);

        const updated = await db
          .update(releases)
          .set({
            additionalInfo: normalizeOptionalText(args.additionalInfo),
            updatedAt: new Date(),
          })
          .where(eq(releases.id, releaseId))
          .returning();

        return toReleaseOutput(
          firstOrThrow(updated, "Failed to update release info."),
        );
      },
      deleteRelease: async (
        _parent: unknown,
        args: DeleteReleaseArgs,
      ): Promise<boolean> => {
        const releaseId = parseReleaseId(args.releaseId);

        const deleted = await db
          .delete(releases)
          .where(eq(releases.id, releaseId))
          .returning({ id: releases.id });

        return deleted.length > 0;
      },
    },
  },
});
