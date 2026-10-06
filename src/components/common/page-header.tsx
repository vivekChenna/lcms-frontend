import type { ReactNode } from "react";

type Props = { title: ReactNode; description?: ReactNode; actions?: ReactNode };

/** Page title row; actions wrap under the title on narrow screens. */
export function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 sm:shrink-0">{actions}</div>}
    </div>
  );
}
