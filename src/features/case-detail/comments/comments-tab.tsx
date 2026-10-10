import { useState } from "react";
import { CardsSkeleton } from "@/components/common/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { MessageSquare } from "lucide-react";
import type { CaseDto, Profile } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { roleLabel } from "@/lib/labels";
import { canWriteToCase } from "../can-write";
import { COMMENT_MAX, CommentForm } from "./comment-form";
import { type CommentDto, useComments, useDeleteComment, useEditComment } from "./use-comments";

function CommentRow({
  comment,
  caseId,
  canEdit,
  onDelete,
}: {
  comment: CommentDto;
  caseId: string;
  canEdit: boolean;
  onDelete: () => void;
}) {
  const edit = useEditComment(caseId);
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const edited = comment.updatedAt !== comment.createdAt;

  const save = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    edit.mutate({ commentId: comment.id, body: trimmed }, { onSuccess: () => setEditing(false) });
  };

  return (
    <li className="rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{comment.authorName ?? "Someone"}</span>
          {comment.authorRole && ` (${roleLabel(comment.authorRole)})`} —{" "}
          {formatDateTime(comment.createdAt)}
          {edited && " (edited)"}
        </p>
        {comment.isInternal && <Badge variant="outline">Internal</Badge>}
      </div>

      {editing ? (
        <div className="mt-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={COMMENT_MAX}
          />
          <div className="mt-2 flex gap-2">
            <Button type="button" size="sm" disabled={edit.isPending} onClick={save}>
              Save
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
          {edit.isError && (
            <p role="alert" className="mt-1 text-sm text-danger">
              {edit.error.message}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap">{comment.body}</p>
      )}

      {canEdit && !editing && (
        <div className="mt-2 flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-danger"
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      )}
    </li>
  );
}

export function CommentsTab({ caseItem, me }: { caseItem: CaseDto; me: Profile }) {
  const { data, isPending, isError, error, refetch } = useComments(caseItem.id);
  const deleteComment = useDeleteComment(caseItem.id);
  const [deleteTarget, setDeleteTarget] = useState<CommentDto | null>(null);

  if (isPending) {
    return (
      <div role="status" aria-label="Loading comments">
        <CardsSkeleton count={2} />
      </div>
    );
  }
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const canWrite = canWriteToCase(me, caseItem);

  return (
    <div className="space-y-4">
      {data.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No comments yet"
          description="Discussion about this case appears here."
        />
      ) : (
        <ol className="space-y-3">
          {data.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              caseId={caseItem.id}
              canEdit={c.authorId === me.id && caseItem.status !== "Closed"}
              onDelete={() => setDeleteTarget(c)}
            />
          ))}
        </ol>
      )}

      {canWrite && <CommentForm caseId={caseItem.id} role={me.role} />}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this comment?"
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        pending={deleteComment.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteComment.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
          }
        }}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
    </div>
  );
}
