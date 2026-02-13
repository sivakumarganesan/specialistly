import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Header } from "@/app/components/Header";
import { Sidebar } from "@/app/components/Sidebar";
import { Dashboard } from "@/app/components/Dashboard";
import { MySite } from "@/app/components/MySite";
import { Services } from "@/app/components/Services";
import { Courses } from "@/app/components/Courses";
import { Customers } from "@/app/components/Customers";
import { Settings } from "@/app/components/Settings";
import { Signup } from "@/app/components/Signup";
import { Login } from "@/app/components/Login";
import { Marketplace } from "@/app/components/Marketplace";
import { SpecialistProfile } from "@/app/components/SpecialistProfile";
import { MyPurchases } from "@/app/components/MyPurchases";
import { PageBuilder } from "@/app/components/PageBuilder";

type SettingsTab = "profile" | "payment" | "slots" | "subscriptions";
type UserType = "specialist" | "customer";

interface SearchableItem {
  id: string;
  title: string;
  type: "course" | "offering";
}

export function AppContent() {
  const { isAuthenticated, currentPage, setCurrentPage, userType } = useAuth();
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("profile");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [offeringItems, setOfferingItems] = useState<SearchableItem[]>([]);
  const [courseItems, setCourseItems] = useState<SearchableItem[]>([]);
  const [viewingSpecialist, setViewingSpecialist] = useState<{
    id: string;
    email: string;
  } | null>(null);

  // If user is not authenticated, show login/signup pages
  if (!isAuthenticated) {
    if (currentPage === "signup") {
      return <Signup />;
    }
    return <Login />;
  }

  const handleNavigateToSettings = (tab?: string) => {
    setCurrentPage("settings");
    if (tab && (tab === "profile" || tab === "payment" || tab === "slots" || tab === "subscriptions")) {
      setSettingsTab(tab as SettingsTab);
    } else {
      setSettingsTab("profile");
    }
  };

  const handleSearchItemClick = (type: "course" | "offering") => {
    if (type === "course") {
      setCurrentPage("courses");
    } else {
      setCurrentPage("services");
    }
  };

  const updateOfferingItems = (items: SearchableItem[]) => {
    setOfferingItems(items);
  };

  const updateCourseItems = (items: SearchableItem[]) => {
    setCourseItems(items);
  };

  // Combine both offering and course items
  const allSearchableItems = [...offeringItems, ...courseItems];

  // Handle viewing specialist
  if (viewingSpecialist && (currentPage === "marketplace" || currentPage === "dashboard")) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onNavigateToSettings={handleNavigateToSettings}
          searchableItems={allSearchableItems}
          onSearchItemClick={handleSearchItemClick}
        />
        <SpecialistProfile
          specialistId={viewingSpecialist.id}
          specialistEmail={viewingSpecialist.email}
          onBack={() => setViewingSpecialist(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onNavigateToSettings={handleNavigateToSettings}
        searchableItems={allSearchableItems}
        onSearchItemClick={handleSearchItemClick}
      />
      <Sidebar 
        activeTab={currentPage} 
        onTabChange={setCurrentPage}
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        userType={userType || "customer"}
      />
      
      <main className="md:ml-64 pt-16">
        {currentPage === "dashboard" && userType === "specialist" && (
          <Dashboard onNavigateToCustomers={() => setCurrentPage("customers")} onNavigateToServices={() => setCurrentPage("services")} />
        )}
        {currentPage === "dashboard" && userType === "customer" && (
          <Marketplace onViewSpecialist={(id, email) => {
            setViewingSpecialist({ id, email });
          }} />
        )}
        {currentPage === "page-builder" && <PageBuilder />}
        {currentPage === "mysite" && <MySite />}
        {currentPage === "services" && userType === "specialist" && <Services onUpdateSearchableItems={updateOfferingItems} />}
        {currentPage === "courses" && userType === "specialist" && <Courses onUpdateSearchableItems={updateCourseItems} />}
        {currentPage === "customers" && <Customers />}
        {currentPage === "settings" && <Settings initialTab={settingsTab} />}
        {currentPage === "marketplace" && <Marketplace onViewSpecialist={(id, email) => {
          setViewingSpecialist({ id, email });
        }} />}
        {currentPage === "purchases" && <MyPurchases />}
      </main>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}