import { 
  LayoutDashboard, 
  Globe,
  GraduationCap, 
  Users, 
  BarChart3, 
  Settings, 
  Wallet,
  Calendar,
  MessageSquare,
  FileText,
  Briefcase,
  Store,
  ShoppingCart
} from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import { Badge } from "@/app/components/ui/badge";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobileOpen?: boolean;
  onClose?: () => void;
  userType?: "specialist" | "customer";
  unreadMessageCount?: number;
}

const creatorMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "my-appointments", label: "My Appointments", icon: Calendar },
  { id: "page-builder", label: "Branded Page Builder", icon: FileText },
  { id: "services", label: "Create / Edit Offerings", icon: Briefcase },
  { id: "customers", label: "Customers", icon: Users },
  { id: "my-site", label: "My Site", icon: Globe },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "settings", label: "Settings", icon: Settings },
];

const customerMenuItems = [
  { id: "my-learning", label: "My Learning & Bookings", icon: ShoppingCart },
  { id: "browse-courses", label: "Browse Courses", icon: GraduationCap },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ activeTab, onTabChange, isMobileOpen, onClose, userType = "customer", unreadMessageCount = 0 }: SidebarProps) {
  const handleItemClick = (id: string) => {
    onTabChange(id);
    if (onClose) {
      onClose();
    }
  };

  const menuItems = userType === "specialist" ? creatorMenuItems : customerMenuItems;



  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r z-40 transition-transform duration-300 overflow-y-auto",
        "md:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <nav className="flex flex-col gap-1 p-4">
          {menuItems && menuItems.length > 0 ? (
            menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const showBadge = item.id === "messages" && unreadMessageCount > 0;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left justify-between w-full",
                    isActive 
                      ? "bg-gray-100 text-gray-900 font-semibold" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  title={item.label}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {showBadge && (
                    <Badge className="bg-red-500 h-5 px-2 flex items-center justify-center text-xs font-semibold flex-shrink-0 ml-2">
                      {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                    </Badge>
                  )}
                </button>
              );
            })
          ) : (
            <div className="text-sm text-gray-500 p-4">No menu items available</div>
          )}
        </nav>
      </aside>
    </>
  );
}
