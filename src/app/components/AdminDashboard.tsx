import { useState, useEffect, useCallback } from "react";
import { adminAPI } from "@/app/api/apiClient";
import {
  Users, UserCheck, GraduationCap, Briefcase, Activity,
  Search, ChevronLeft, ChevronRight, Shield, UserX, Eye,
  TrendingUp, Clock, BookOpen, X
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalSpecialists: number;
  totalCustomers: number;
  totalAdmins: number;
  totalCourses: number;
  publishedCourses: number;
  totalServices: number;
  totalSlots: number;
  recentSignups: number;
  activeUsers: number;
}

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: string;
  isSpecialist: boolean;
  isDisabled?: boolean;
  membership: string;
  subscription?: { planType: string; status: string };
  specialityCategories?: string[];
  customerInterests?: string[];
  createdAt: string;
  updatedAt: string;
  profileImage?: string;
  phone?: string;
  bio?: string;
  location?: string;
  company?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface UserDetail {
  user: UserRow;
  stats: { courseCount: number; serviceCount: number; customerCount: number };
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border p-5 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "users">("overview");

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    }
  }, []);

  const fetchUsers = useCallback(async (page = 1) => {
    try {
      const data = await adminAPI.getUsers({ page, limit: 20, role: roleFilter || undefined, search: search || undefined });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, [roleFilter, search]);

  const fetchActivity = useCallback(async () => {
    try {
      const data = await adminAPI.getRecentActivity();
      setRecentActivity(data);
    } catch (err) {
      console.error("Failed to fetch recent activity:", err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchUsers(), fetchActivity()]);
      setLoading(false);
    };
    loadData();
  }, [fetchStats, fetchUsers, fetchActivity]);

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, search, fetchUsers]);

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      await adminAPI.toggleUserStatus(userId);
      fetchUsers(pagination.page);
      fetchStats();
    } catch (err) {
      console.error("Failed to toggle user status:", err);
    }
  };

  const handleViewDetail = async (userId: string) => {
    setDetailLoading(true);
    try {
      const data = await adminAPI.getUserDetail(userId);
      setSelectedUser(data);
    } catch (err) {
      console.error("Failed to fetch user detail:", err);
    }
    setDetailLoading(false);
  };

  const getUserTypeLabel = (user: UserRow) => {
    if (user.role === "admin") return "Admin";
    if (user.isSpecialist) return "Specialist";
    return "Customer";
  };

  const getUserTypeBadgeColor = (user: UserRow) => {
    if (user.role === "admin") return "bg-purple-100 text-purple-700";
    if (user.isSpecialist) return "bg-blue-100 text-blue-700";
    return "bg-green-100 text-green-700";
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-3"></div>
          <p className="text-gray-500">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-7 w-7 text-purple-600" />
          Admin Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Monitor platform users and activity</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "overview" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "users" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          All Users
        </button>
      </div>

      {activeTab === "overview" && (
        <>
          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users} label="Total Users" value={stats.totalUsers} sub={`${stats.recentSignups} new in last 30 days`} color="bg-blue-500" />
              <StatCard icon={UserCheck} label="Specialists" value={stats.totalSpecialists} color="bg-indigo-500" />
              <StatCard icon={Users} label="Customers" value={stats.totalCustomers} color="bg-green-500" />
              <StatCard icon={Activity} label="Active (7d)" value={stats.activeUsers} color="bg-orange-500" />
              <StatCard icon={GraduationCap} label="Total Courses" value={stats.totalCourses} sub={`${stats.publishedCourses} published`} color="bg-purple-500" />
              <StatCard icon={Briefcase} label="Services" value={stats.totalServices} color="bg-teal-500" />
              <StatCard icon={Clock} label="Consulting Slots" value={stats.totalSlots} color="bg-pink-500" />
              <StatCard icon={Shield} label="Admins" value={stats.totalAdmins} color="bg-gray-700" />
            </div>
          )}

          {/* Recent Activity */}
          {recentActivity && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Users */}
              <div className="bg-white rounded-xl border p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Recent Signups
                </h3>
                <div className="space-y-3">
                  {recentActivity.recentUsers?.slice(0, 7).map((u: any) => (
                    <div key={u._id} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ml-2 ${
                        u.isSpecialist ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                      }`}>
                        {u.isSpecialist ? "Specialist" : "Customer"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Courses */}
              <div className="bg-white rounded-xl border p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-500" />
                  Recent Courses
                </h3>
                <div className="space-y-3">
                  {recentActivity.recentCourses?.slice(0, 7).map((c: any) => (
                    <div key={c._id} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                        <p className="text-xs text-gray-400 truncate">{c.specialistEmail}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ml-2 ${
                        c.status === "published" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Services */}
              <div className="bg-white rounded-xl border p-5">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-teal-500" />
                  Recent Services
                </h3>
                <div className="space-y-3">
                  {recentActivity.recentServices?.slice(0, 7).map((s: any) => (
                    <div key={s._id}>
                      <p className="text-sm font-medium text-gray-900 truncate">{s.title}</p>
                      <p className="text-xs text-gray-400 truncate">{s.creator}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "users" && (
        <>
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="">All Roles</option>
              <option value="specialist">Specialists</option>
              <option value="user">Customers</option>
              <option value="admin">Admins</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              Search
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                            {user.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getUserTypeBadgeColor(user)}`}>
                          {getUserTypeLabel(user)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {user.subscription?.planType || user.membership || "free"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {user.isDisabled ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600 font-medium">Disabled</span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600 font-medium">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewDetail(user._id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {user.role !== "admin" && (
                            <button
                              onClick={() => handleToggleStatus(user._id)}
                              className={`p-1.5 rounded-lg hover:bg-gray-100 ${
                                user.isDisabled ? "text-green-500 hover:text-green-700" : "text-red-400 hover:text-red-600"
                              }`}
                              title={user.isDisabled ? "Enable user" : "Disable user"}
                            >
                              {user.isDisabled ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => fetchUsers(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-1.5 rounded-lg border hover:bg-white disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => fetchUsers(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="p-1.5 rounded-lg border hover:bg-white disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            {detailLoading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600">
                    {selectedUser.user.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{selectedUser.user.name}</p>
                    <p className="text-sm text-gray-500">{selectedUser.user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">Role</p>
                    <p className="font-medium">{getUserTypeLabel(selectedUser.user)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">Plan</p>
                    <p className="font-medium">{selectedUser.user.subscription?.planType || selectedUser.user.membership || "free"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">Joined</p>
                    <p className="font-medium">{new Date(selectedUser.user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">Last Active</p>
                    <p className="font-medium">{new Date(selectedUser.user.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedUser.user.isSpecialist && (
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600">{selectedUser.stats.courseCount}</p>
                      <p className="text-xs text-blue-500">Courses</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-indigo-600">{selectedUser.stats.serviceCount}</p>
                      <p className="text-xs text-indigo-500">Services</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{selectedUser.stats.customerCount}</p>
                      <p className="text-xs text-green-500">Customers</p>
                    </div>
                  </div>
                )}

                {selectedUser.user.phone && (
                  <div className="text-sm">
                    <span className="text-gray-400">Phone: </span>
                    <span className="text-gray-700">{selectedUser.user.phone}</span>
                  </div>
                )}
                {selectedUser.user.location && (
                  <div className="text-sm">
                    <span className="text-gray-400">Location: </span>
                    <span className="text-gray-700">{selectedUser.user.location}</span>
                  </div>
                )}
                {selectedUser.user.company && (
                  <div className="text-sm">
                    <span className="text-gray-400">Company: </span>
                    <span className="text-gray-700">{selectedUser.user.company}</span>
                  </div>
                )}
                {selectedUser.user.bio && (
                  <div className="text-sm">
                    <p className="text-gray-400 mb-1">Bio:</p>
                    <p className="text-gray-700">{selectedUser.user.bio}</p>
                  </div>
                )}
                {selectedUser.user.specialityCategories && selectedUser.user.specialityCategories.length > 0 && (
                  <div className="text-sm">
                    <p className="text-gray-400 mb-1">Specialities:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedUser.user.specialityCategories.map((cat) => (
                        <span key={cat} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{cat}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
