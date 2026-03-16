import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/app/components/ui/button";
import { StatsCard } from "@/app/components/StatsCard";
import { 
  Users, 
  Briefcase,
  GraduationCap,
  DollarSign,
  ArrowLeft,
  Calendar,
  Video,
  Globe,
  Settings,
  ArrowRight,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { customerAPI, serviceAPI, courseAPI, consultingSlotAPI, creatorAPI } from "@/app/api/apiClient";
import { ManageSlots } from "@/app/components/ConsultingSlots";
import { SpecialistMeetingManager } from "@/app/components/SpecialistMeetingManager";

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
  const [activeSection, setActiveSection] = useState<"overview" | "manage-slots" | "manage-meetings">("overview");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState(user?.name || "Creator");

  // Stats
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [publishedCourses, setPublishedCourses] = useState(0);
  const [totalOfferings, setTotalOfferings] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [upcomingSlots, setUpcomingSlots] = useState(0);
  const [recentCourses, setRecentCourses] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch creator profile for full name
        if (user?.email) {
          try {
            const creatorResponse = await creatorAPI.getByEmail(user.email);
            if (creatorResponse?.data) {
              setFullName(creatorResponse.data.creatorName || user.name || "Creator");
            }
          } catch {
            setFullName(user.name || "Creator");
          }
        }

        // Fetch customers
        const customersResponse = await customerAPI.getAll({ specialistEmail: user?.email });
        const customersArray = Array.isArray(customersResponse) 
          ? customersResponse 
          : (Array.isArray(customersResponse?.data) ? customersResponse.data : []);
        setTotalCustomers(customersArray.length);

        // Fetch courses
        try {
          const coursesResponse = await courseAPI.getAll({ specialistEmail: user?.email });
          const coursesArray = Array.isArray(coursesResponse)
            ? coursesResponse
            : (Array.isArray(coursesResponse?.data) ? coursesResponse.data : []);
          setTotalCourses(coursesArray.length);
          setPublishedCourses(coursesArray.filter((c: any) => c.status === "published").length);
          // Most recent 3 courses
          setRecentCourses(
            coursesArray
              .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
              .slice(0, 3)
          );
        } catch {
          setTotalCourses(0);
          setPublishedCourses(0);
        }

        // Fetch services (consulting offerings)
        const servicesResponse = await serviceAPI.getAll({ creator: user?.email });
        const servicesArray = Array.isArray(servicesResponse)
          ? servicesResponse
          : (Array.isArray(servicesResponse?.data) ? servicesResponse.data : []);
        setTotalOfferings(servicesArray.length);

        // Fetch consulting slot stats
        try {
          const statsResponse = await consultingSlotAPI.getStats(user?.email || "");
          if (statsResponse?.data) {
            setTotalBookings(statsResponse.data.totalBookings || 0);
            setUpcomingSlots(statsResponse.data.upcomingAvailable || 0);
          }
        } catch {
          setTotalBookings(0);
          setUpcomingSlots(0);
        }

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
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
      setTimeout(() => setUpgradeMessage(null), 3000);
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      setUpgradeMessage(`Failed to upgrade: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsUpgrading(false);
    }
  };

  // Show ManageSlots if that section is active
  if (activeSection === "manage-slots") {
    return (
      <div className="px-4 md:px-6 pt-0 pb-4 md:pb-6 space-y-6 -mt-4">
        <button
          onClick={() => setActiveSection("overview")}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <ManageSlots 
          specialistEmail={user?.email || ""}
          specialistId={user?._id || ""}
        />
      </div>
    );
  }

  // Show Specialist Meeting Manager if that section is active
  if (activeSection === "manage-meetings") {
    return (
      <div className="px-4 md:px-6 pt-0 pb-4 md:pb-6 space-y-6 -mt-4">
        <button
          onClick={() => setActiveSection("overview")}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <SpecialistMeetingManager />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 pt-0 pb-4 md:pb-6 space-y-6 -mt-4">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Welcome back, {fullName}!</h1>
        <p className="text-gray-600">Here's an overview of your business.</p>
      </div>

      {/* Membership Banner */}
      {user && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <span className="text-sm font-medium text-gray-700">Current Plan: </span>
              <Badge className={user.subscription?.planType === 'pro' ? 'bg-indigo-600' : 'bg-gray-600'}>
                {user.subscription?.planType?.toUpperCase() || 'FREE'}
              </Badge>
            </div>
            {user.subscription?.planType === 'free' && (
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleUpgradeToPro}
                  disabled={isUpgrading}
                  className="bg-indigo-600 hover:bg-indigo-700" 
                  size="sm"
                >
                  {isUpgrading ? 'Upgrading...' : 'Upgrade to Pro'}
                </Button>
                {upgradeMessage && (
                  <span className={`text-sm font-medium ${upgradeMessage.includes('✓') ? 'text-green-700' : 'text-red-700'}`}>
                    {upgradeMessage}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-12" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div onClick={onNavigateToCustomers} className="cursor-pointer">
            <StatsCard
              title="Customers"
              value={totalCustomers.toString()}
              icon={Users}
              isClickable
            />
          </div>
          <div onClick={onNavigateToServices} className="cursor-pointer">
            <StatsCard
              title="Courses"
              value={totalCourses.toString()}
              icon={GraduationCap}
              trend={`${publishedCourses} published`}
              isClickable
            />
          </div>
          <div onClick={onNavigateToServices} className="cursor-pointer">
            <StatsCard
              title="Consulting Offerings"
              value={totalOfferings.toString()}
              icon={Briefcase}
              isClickable
            />
          </div>
          <div onClick={() => setActiveSection("manage-slots")} className="cursor-pointer">
            <StatsCard
              title="Consulting Bookings"
              value={totalBookings.toString()}
              icon={Calendar}
              trend={`${upcomingSlots} upcoming`}
              isClickable
            />
          </div>
        </div>
      )}

      {/* Quick Navigation */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card
            className="p-4 cursor-pointer hover:shadow-md transition-all hover:border-indigo-300 group"
            onClick={onNavigateToServices}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Manage Offerings</p>
                <p className="text-xs text-gray-500">Courses & consulting</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:shadow-md transition-all hover:border-blue-300 group"
            onClick={() => setActiveSection("manage-meetings")}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Video className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Zoom Meetings</p>
                <p className="text-xs text-gray-500">View & manage</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:shadow-md transition-all hover:border-cyan-300 group"
            onClick={() => setActiveSection("manage-slots")}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Calendar className="h-5 w-5 text-cyan-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Consulting Slots</p>
                <p className="text-xs text-gray-500">Availability & bookings</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-cyan-600 transition-colors" />
            </div>
          </Card>

          <Card
            className="p-4 cursor-pointer hover:shadow-md transition-all hover:border-green-300 group"
            onClick={() => setCurrentPage('page-builder')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Globe className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Branded Page</p>
                <p className="text-xs text-gray-500">Build your site</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Courses */}
      {recentCourses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent Courses</h2>
            <Button variant="outline" size="sm" onClick={onNavigateToServices}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentCourses.map((course: any) => (
              <Card key={course._id || course.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm line-clamp-1">{course.title}</h3>
                    <Badge className={course.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                      {course.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {course.courseType === "cohort" ? "Cohort" : "Self-Paced"}
                    </Badge>
                    {course.price > 0 && (
                      <span className="text-xs font-medium text-gray-600">
                        {course.currency === 'INR' ? '₹' : '$'}{course.price}
                      </span>
                    )}
                    {course.price === 0 && (
                      <span className="text-xs font-medium text-green-600">Free</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{course.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* More Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-all hover:border-purple-300 group"
          onClick={onNavigateToCustomers}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Customers</p>
              <p className="text-xs text-gray-500">{totalCustomers} total</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </div>
        </Card>

        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-all hover:border-amber-300 group"
          onClick={() => setCurrentPage('messages')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Messages</p>
              <p className="text-xs text-gray-500">Chat with customers</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-amber-600 transition-colors" />
          </div>
        </Card>

        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-all hover:border-gray-400 group"
          onClick={() => setCurrentPage('settings')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Settings className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Settings</p>
              <p className="text-xs text-gray-500">Profile, payments, Zoom</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
        </Card>
      </div>
    </div>
  );
}
