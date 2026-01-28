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

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobileOpen?: boolean;
  onClose?: () => void;
  userType?: "specialist" | "customer";
}

const creatorMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "services", label: "Create / Edit Service Offerings", icon: Briefcase },
  { id: "mysite", label: "My Site", icon: Globe },
  { id: "courses", label: "Courses", icon: GraduationCap },
  { id: "customers", label: "Customers", icon: Users },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "settings", label: "Settings", icon: Settings },
];

const customerMenuItems = [
  { id: "dashboard", label: "Browse Specialists", icon: Store },
  { id: "purchases", label: "My Learning & Bookings", icon: ShoppingCart },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ activeTab, onTabChange, isMobileOpen, onClose, userType = "customer" }: SidebarProps) {
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
        "fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r z-40 transition-transform duration-300",
        "md:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <nav className="flex flex-col gap-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                  isActive 
                    ? "bg-purple-50 text-purple-600" 
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}