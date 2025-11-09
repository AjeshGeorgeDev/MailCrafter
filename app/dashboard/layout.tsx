import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block">
        <Sidebar />
      </aside>
      
      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
                    <main className="flex-1 overflow-y-auto bg-gray-50">
                      <div className="w-full p-6">
                        {children}
                      </div>
                    </main>
      </div>
    </div>
  );
}

