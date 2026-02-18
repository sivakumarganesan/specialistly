import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { messageAPI } from "@/app/api/apiClient";
import { Header } from "@/app/components/Header";
import { Sidebar } from "@/app/components/Sidebar";
import { Dashboard } from "@/app/components/Dashboard";
import { Services } from "@/app/components/Services";
import { Courses } from "@/app/components/Courses";
import { Customers } from "@/app/components/Customers";
import { Settings } from "@/app/components/Settings";
import { Signup } from "@/app/components/Signup";
import { Login } from "@/app/components/Login";
import { Homepage } from "@/app/components/Homepage";
import { Marketplace } from "@/app/components/Marketplace";
import { SpecialistProfile } from "@/app/components/SpecialistProfile";
import { MyPurchases } from "@/app/components/MyPurchases";
import { PageBuilder } from "@/app/components/PageBuilder";
import { ServiceDetail } from "@/app/components/ServiceDetail";
import { Messages } from "@/app/components/Messages";
import { CoursesBrowse } from "@/app/components/CoursesBrowse";
import { MyLearning } from "@/app/components/MyLearning";
import { CourseDetail } from "@/app/components/CourseDetail";

type SettingsTab = "profile" | "payment" | "slots" | "subscriptions";
type UserType = "specialist" | "customer";

interface SearchableItem {
  id: string;
  title: string;
  type: "course" | "offering";
}

export function AppContent() {
  const { isAuthenticated, currentPage, setCurrentPage, userType, user, isLoading } = useAuth();
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("profile");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [offeringItems, setOfferingItems] = useState<SearchableItem[]>([]);
  const [courseItems, setCourseItems] = useState<SearchableItem[]>([]);
  const [viewingSpecialist, setViewingSpecialist] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Fetch unread message count periodically
  useEffect(() => {
    if (!isAuthenticated || !user?.id || currentPage !== 'messages') return;

    const fetchUnreadCount = async () => {
      try {
        const conversations = await messageAPI.getConversations();
        const totalUnread = conversations.reduce((sum, conv) => {
          return sum + (conv.unreadCounts?.[user.id] || 0);
        }, 0);
        setUnreadMessageCount(totalUnread);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    // Fetch immediately and then set up interval
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id, currentPage]);

  // If user is not authenticated, show appropriate page
  if (!isAuthenticated) {
    if (currentPage === "signup") {
      return <Signup />;
    }
    if (currentPage === "login") {
      return <Login />;
    }
    // Show homepage by default for unauthenticated users
    return (
      <Homepage
        onSignup={() => setCurrentPage("signup")}
        onLogin={() => setCurrentPage("login")}
      />
    );
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

  // Show loading state while auth is being restored
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Combine both offering and course items
  const allSearchableItems = [...offeringItems, ...courseItems];

  // Handle viewing service details
  if (selectedServiceId && userType === "specialist") {
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
          unreadMessageCount={unreadMessageCount}
        />
        <main className="md:ml-64 pt-16">
          <ServiceDetail
            serviceId={selectedServiceId}
            onBack={() => setSelectedServiceId(null)}
            onEdit={(service) => {
              setSelectedServiceId(null);
              setCurrentPage("services");
            }}
            onDelete={(serviceId) => {
              setSelectedServiceId(null);
              setCurrentPage("services");
            }}
          />
        </main>
      </div>
    );
  }

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
        unreadMessageCount={unreadMessageCount}
      />
      
      <main className="md:ml-64 pt-16">
        {currentPage === "dashboard" && userType === "specialist" && (
          <Dashboard 
            onNavigateToCustomers={() => setCurrentPage("customers")} 
            onNavigateToServices={() => setCurrentPage("services")}
            onViewServiceDetail={(serviceId) => setSelectedServiceId(serviceId)}
          />
        )}
        {currentPage === "dashboard" && userType === "customer" && (
          <Marketplace onViewSpecialist={(id, email) => {
            setViewingSpecialist({ id, email });
          }} />
        )}
        {currentPage === "page-builder" && <PageBuilder />}
        {currentPage === "services" && userType === "specialist" && <Services onUpdateSearchableItems={updateOfferingItems} />}
        {currentPage === "courses" && userType === "specialist" && <Courses onUpdateSearchableItems={updateCourseItems} />}
        {currentPage === "browse-courses" && userType === "customer" && <CoursesBrowse />}
        {currentPage === "my-learning" && userType === "customer" && <MyLearning />}
        {currentPage.startsWith("learn-course-") && userType === "customer" && (
          <CourseDetail enrollmentId={currentPage.replace("learn-course-", "")} />
        )}
        {currentPage === "customers" && <Customers />}
        {currentPage === "messages" && <Messages />}
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