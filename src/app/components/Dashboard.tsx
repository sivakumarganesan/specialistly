import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/app/components/ui/button";
import { StatsCard } from "@/app/components/StatsCard";
import { 
  Plus, 
  Users, 
  Briefcase,
  Filter,
  Download,
  GraduationCap,
  TrendingUp,
  DollarSign,
  ArrowLeft
} from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { customerAPI, serviceAPI, creatorAPI } from "@/app/api/apiClient";

interface Offering {
  _id?: string;
  id?: string;
  title: string;
  type?: "course" | "service";
  eventType?: "webinar" | "consulting";
  price?: string;
  cost?: number;
  sales?: number;
  revenue?: string;
  status?: "active" | "draft";
  image?: string;
  description?: string;
}

const mockOfferings: Offering[] = [];

export function Dashboard({ 
  onNavigateToCustomers, 
  onNavigateToServices,
  onViewServiceDetail
}: { 
  onNavigateToCustomers?: () => void; 
  onNavigateToServices?: () => void;
  onViewServiceDetail?: (serviceId: string) => void;
}) {
  const { user, updateSubscription, setCurrentPage } = useAuth();
  const [filterTab, setFilterTab] = useState("all");
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const [activeCustomers, setActiveCustomers] = useState(0);
  const [activeSessions, setActiveSessions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState(user?.name || "Creator");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch creator profile to get full name
        if (user?.email) {
          try {
            const creatorResponse = await creatorAPI.getByEmail(user.email);
            if (creatorResponse && creatorResponse.data) {
              const creatorName = creatorResponse.data.creatorName || user.name || "Creator";
              setFullName(creatorName);
            }
          } catch (error) {
            console.log("Using default name from auth context");
            setFullName(user.name || "Creator");
          }
        }
        
        // Fetch customers and count active ones
        const customersResponse = await customerAPI.getAll();
        const customersArray = Array.isArray(customersResponse) 
          ? customersResponse 
          : (Array.isArray(customersResponse.data) ? customersResponse.data : []);
        const activeCount = customersArray.filter((c: any) => c.status === "active").length;
        setActiveCustomers(activeCount);

        // Fetch services and count active ones
        const servicesResponse = await serviceAPI.getAll({ creator: user?.email });
        const servicesArray = Array.isArray(servicesResponse) 
          ? servicesResponse 
          : (Array.isArray(servicesResponse.data) ? servicesResponse.data : []);
        
        // Map services to offering format
        const mappedOfferings = servicesArray.map((service: any) => ({
          ...service,
          id: service._id || service.id,
          type: service.type,
          status: service.status || "active",
          image: service.image || "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
          price: service.cost ? `$${service.cost}` : "$0",
        }));
        
        setOfferings(mappedOfferings);
        
        // Total sessions = all webinars + consulting services
        const activeSessionsCount = servicesArray.length;
        setActiveSessions(activeSessionsCount);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setOfferings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.email, user?.name]);

  const handleUpgradeToPro = async () => {
    try {
      setIsUpgrading(true);
      setUpgradeMessage(null);
      
      await updateSubscription('pro');
      setUpgradeMessage('✓ Successfully upgraded to Pro Plan!');
      
      // Clear message after 3 seconds
      setTimeout(() => setUpgradeMessage(null), 3000);
      
      // Reload page after 2 seconds to reflect changes
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      setUpgradeMessage(`Failed to upgrade: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsUpgrading(false);
    }
  };

  const filteredOfferings = filterTab === "all" 
    ? offerings 
    : offerings.filter(o => o.type === filterTab);

  return (
    <div className="px-4 md:px-6 pt-0 pb-4 md:pb-6 space-y-6 -mt-4">
      {/* Membership Banner */}
      {user && (
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-50 border border-purple-200 rounded-lg p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Current Plan: <Badge className={user.subscription?.planType === 'pro' ? 'bg-indigo-600' : 'bg-gray-600'}>{user.subscription?.planType?.toUpperCase() || 'FREE'}</Badge>
              </h2>
              <p className="text-sm text-gray-600">
                {user.subscription?.features?.join(' • ') || 'Free tier features'}
              </p>
            </div>
            {user.subscription?.planType === 'free' && (
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleUpgradeToPro}
                  disabled={isUpgrading}
                  className="bg-indigo-600 hover:bg-indigo-700" 
                  size="sm"
                >
                  {isUpgrading ? 'Upgrading...' : 'Upgrade to Pro'}
                </Button>
                {upgradeMessage && (
                  <div className={`px-4 py-2 rounded text-sm font-medium ${
                    upgradeMessage.includes('\u2713') 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {upgradeMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div>
        <button
          onClick={() => setCurrentPage('homepage')}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4 font-medium text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
        <h1 className="text-3xl font-bold mb-1">Welcome back, {fullName}!</h1>
        <p className="text-gray-600">Here's what's happening with your creator business today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <div onClick={onNavigateToCustomers} className="cursor-pointer">
          <StatsCard
            title="Active Customers"
            value={activeCustomers.toString()}
            icon={Users}
            isClickable={true}
          />
        </div>
        <div onClick={onNavigateToServices} className="cursor-pointer">
          <StatsCard
            title="Sessions"
            value={activeSessions.toString()}
            icon={Briefcase}
            isClickable={true}
          />
        </div>
      </div>

      {/* Offerings Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Your Offerings</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Offering Filters */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={filterTab === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterTab("all")}
          >
            All
          </Button>
          <Button 
            variant={filterTab === "webinar" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterTab("webinar")}
          >
            Webinars
          </Button>
          <Button 
            variant={filterTab === "consulting" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterTab("consulting")}
          >
            Consulting
          </Button>
        </div>

        {/* Offerings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="text-center py-12 col-span-full">
              <p className="text-gray-500">Loading offerings...</p>
            </div>
          ) : filteredOfferings.length > 0 ? (
            filteredOfferings.map((offering) => (
              <Card key={offering.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {offering.image && (
                  <img 
                    src={offering.image} 
                    alt={offering.title} 
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg line-clamp-2">{offering.title}</h3>
                    <Badge 
                      className={
                        offering.status === "active" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {offering.status || "active"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {offering.type === "webinar" ? (
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Briefcase className="h-4 w-4 text-green-600" />
                    )}
                    <Badge 
                      className={
                        offering.type === "webinar" 
                          ? "bg-cyan-100 text-blue-700" 
                          : "bg-green-100 text-green-700"
                      }
                    >
                      {offering.type === "webinar" ? "Webinar" : "Consulting"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Price</p>
                      <p className="font-semibold">{offering.price || "$0"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Sales</p>
                      <p className="font-semibold">{offering.sales || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Revenue</p>
                      <p className="font-semibold">{offering.revenue || "$0"}</p>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    variant="outline" 
                    size="sm"
                    onClick={() => onViewServiceDetail?.(offering._id || offering.id || "")}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 col-span-full">
              <p className="text-gray-500">No offerings found in this category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
