import styles from "../../page.module.css";
import type { Release } from "../types";
import { formatDate } from "../utils";

type ReleaseListSectionProps = {
  releases: Release[];
  deletePending: boolean;
  onOpenNew: () => void;
  onOpenEdit: (releaseId: string) => void;
  onDelete: (releaseId: string) => void;
};

export function ReleaseListSection({
  releases,
  deletePending,
  onOpenNew,
  onOpenEdit,
  onDelete,
}: ReleaseListSectionProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>All releases</h2>
        <button type="button" onClick={onOpenNew}>
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
                      className={`${styles.status} ${styles[`status${release.status}`]}`}
                    >
                      {release.status}
                    </span>
                  </td>
                  <td data-label="Actions" className={styles.actions}>
                    <button type="button" onClick={() => onOpenEdit(release.id)}>
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(release.id)}
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
  );
}
