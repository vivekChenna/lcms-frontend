import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/page-header";
import {
  useBusinessUnits,
  useCaseTypes,
  useCategories,
  useClosureOutcomes,
  useDepartments,
  useEntities,
} from "@/lib/queries/lookups";
import { CaseTypeForm } from "./case-type-form";
import { EntityForm } from "./entity-form";
import { SimpleResourceTable } from "./simple-resource-table";

export function MasterDataPage() {
  const departments = useDepartments();
  const categories = useCategories();
  const closureOutcomes = useClosureOutcomes();
  const entities = useEntities();
  const businessUnits = useBusinessUnits();
  const caseTypes = useCaseTypes();

  return (
    <div>
      <PageHeader
        title="Master data"
        description="Reference data used across case intake and routing."
      />
      <Tabs defaultValue="departments">
        <TabsList>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="categories">Case categories</TabsTrigger>
          <TabsTrigger value="outcomes">Closure outcomes</TabsTrigger>
          <TabsTrigger value="org">Entities &amp; business units</TabsTrigger>
          <TabsTrigger value="case-types">Case types</TabsTrigger>
        </TabsList>
        <TabsContent value="departments">
          <SimpleResourceTable
            resource="departments"
            label="Department"
            pluralLabel="Departments"
            rows={departments.data}
          />
        </TabsContent>
        <TabsContent value="categories">
          <SimpleResourceTable
            resource="case-categories"
            label="Case category"
            pluralLabel="Case categories"
            rows={categories.data}
          />
        </TabsContent>
        <TabsContent value="outcomes">
          <SimpleResourceTable
            resource="closure-outcomes"
            label="Closure outcome"
            pluralLabel="Closure outcomes"
            rows={closureOutcomes.data}
          />
        </TabsContent>
        <TabsContent value="org">
          <EntityForm entities={entities.data} businessUnits={businessUnits.data} />
        </TabsContent>
        <TabsContent value="case-types">
          <CaseTypeForm categories={categories.data} caseTypes={caseTypes.data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
