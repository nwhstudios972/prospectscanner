interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 font-sans text-sm text-foreground/50">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
