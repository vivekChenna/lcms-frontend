import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { UserRole } from "@/lib/api/types";
import { can } from "@/lib/permissions";
import { usePostComment } from "./use-comments";

/** Requesters never see the internal-note toggle, on top of the backend hiding internal
 * comments from them entirely - belt and suspenders, not a substitute for the server check. */
export function CommentForm({ caseId, role }: { caseId: string; role: UserRole }) {
  const post = usePostComment(caseId);
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const canMarkInternal = can.seeInternalComments(role);

  const submit = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    post.mutate(
      { body: trimmed, isInternal: canMarkInternal && isInternal },
      {
        onSuccess: () => {
          setBody("");
          setIsInternal(false);
        },
      },
    );
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <Label htmlFor="comment-body">Add a comment</Label>
      <Textarea
        id="comment-body"
        className="mt-1"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      {canMarkInternal && (
        <div className="mt-2 flex items-center gap-2">
          <Checkbox
            id="comment-internal"
            checked={isInternal}
            onCheckedChange={(v) => setIsInternal(v === true)}
          />
          <Label htmlFor="comment-internal" className="font-normal">
            Internal note (not visible to requesters)
          </Label>
        </div>
      )}
      <div className="mt-3 flex justify-end">
        <Button type="button" size="sm" disabled={!body.trim() || post.isPending} onClick={submit}>
          Post
        </Button>
      </div>
      {post.isError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {post.error.message}
        </p>
      )}
    </div>
  );
}
