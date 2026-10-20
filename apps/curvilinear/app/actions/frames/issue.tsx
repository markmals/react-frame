import { DeleteIssueDialog } from "../issues/delete-dialog.tsx";
import { IssueDetailView } from "../issues/issue-detail-view.tsx";

export function IssueFrame({
  confirmingDelete,
  issueId,
}: {
  confirmingDelete: boolean;
  issueId: number;
}) {
  // No <Suspense>: the controller awaited the prefetch, so nothing here suspends for data, and a
  // boundary would let server rendering stream this content after the first flush, where it stays
  // hidden until a script reveals it.
  return (
    <>
      <IssueDetailView issueId={issueId} />
      {confirmingDelete ? <DeleteIssueDialog issueId={issueId} /> : null}
    </>
  );
}

export function IssueNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center text-muted">
      <p>That issue does not exist.</p>
    </div>
  );
}
