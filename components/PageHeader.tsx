interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
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
