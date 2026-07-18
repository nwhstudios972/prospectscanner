import { Sidebar } from "@/components/Sidebar";
import { InactivityGuard } from "@/components/InactivityGuard";
import { auth } from "@/auth";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-background">
      <InactivityGuard />
      <Sidebar estAdmin={Boolean(session?.user?.est_admin)} />
      <main className="min-h-screen px-4 py-6 pt-20 sm:px-6 lg:ml-60 lg:px-8 lg:py-8 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
