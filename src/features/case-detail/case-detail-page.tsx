import { Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorState } from "@/components/common/error-state";
import { ApiError } from "@/lib/api/errors";
import { useMe } from "@/lib/auth";
import { AuditTab } from "./audit/audit-tab";
import { CaseHeader } from "./case-header";
import { CommentsTab } from "./comments/comments-tab";
import { DocumentsTab } from "./documents/documents-tab";
import { OverviewTab } from "./overview-tab";
import { RequestsTab } from "./requests/requests-tab";
import { useCase } from "./use-case";

type TabKey = "overview" | "documents" | "requests" | "comments" | "audit";
type CaseDetailSearch = { tab?: TabKey };

function NotFoundCase() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-card px-4 py-12 text-center">
      <p className="font-medium">Case not found</p>
      <p className="mt-1 text-sm text-muted-foreground">
        It may have been removed, or you may not have access to it.
      </p>
      <Button asChild variant="outline" className="mt-4 h-11 lg:h-9">
        <Link to="/cases">Back to the case repository</Link>
      </Button>
    </div>
  );
}

function ForbiddenCase() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-card px-4 py-12 text-center">
      <p className="font-medium">You don't have access</p>
      <p className="mt-1 text-sm text-muted-foreground">
        You don't have permission to view this case.
      </p>
      <Button asChild variant="outline" className="mt-4 h-11 lg:h-9">
        <Link to="/cases">Back to the case repository</Link>
      </Button>
    </div>
  );
}

export function CaseDetailPage() {
  const { caseId } = useParams({ strict: false }) as { caseId: string };
  const search = useSearch({ strict: false }) as CaseDetailSearch;
  const navigate = useNavigate();
  const me = useMe();
  const { data: caseItem, isPending, isError, error, refetch } = useCase(caseId);

  const tab = search.tab ?? "overview";
  const setTab = (next: string) =>
    void navigate({ to: ".", search: { tab: next as TabKey } as never });

  if (isPending || !me) return null;

  if (isError) {
    if (error instanceof ApiError && error.isNotFound) return <NotFoundCase />;
    if (error instanceof ApiError && error.isForbidden) return <ForbiddenCase />;
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  // A viewer never sees a confidential case; the backend answers with 404 either way, so the
  // page can't tell the difference and shouldn't try to.
  return (
    <div>
      <CaseHeader caseItem={caseItem} me={me} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="requests">Information requests</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab caseItem={caseItem} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab caseId={caseId} me={me} />
        </TabsContent>
        <TabsContent value="requests">
          <RequestsTab caseItem={caseItem} me={me} />
        </TabsContent>
        <TabsContent value="comments">
          <CommentsTab caseItem={caseItem} me={me} />
        </TabsContent>
        <TabsContent value="audit">
          <AuditTab caseId={caseId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
