import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Eye,
  X,
  GraduationCap,
  Briefcase,
  Award,
  Clock,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";
import { customerAPI } from "@/app/api/apiClient";

interface Purchase {
  id: string;
  offeringTitle: string;
  offeringType: "course" | "service";
  price: string;
  date: string;
  status: "completed" | "active" | "cancelled";
}

interface Customer {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  joinedDate?: string;
  totalSpent?: number;
  purchaseCount?: number;
  status?: "active" | "inactive";
  purchases?: Purchase[];
  avatar?: string;
}

export function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "active",
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAll({ specialistEmail: user?.email });
      const customersArray = Array.isArray(response) 
        ? response 
        : (Array.isArray(response.data) ? response.data : []);
      
      setCustomers(
        customersArray.map((customer: any) => ({
          ...customer,
          id: customer._id || customer.id,
          status: customer.status || "active",
          joinedDate: customer.joinedDate || new Date().toISOString(),
          totalSpent: customer.totalSpent || 0,
          purchaseCount: customer.purchaseCount || 0,
          purchases: customer.purchases || [],
        }))
      );
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchCustomers();
    }
  }, [user?.email]);

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      (customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesFilter =
      filterStatus === "all" ||
      customer.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const openCustomerDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailDialogOpen(true);
  };

  const getTotalCustomers = () => customers.length;

  const getActiveCustomers = () =>
    customers.filter((c) => c.status === "active").length;

  const getTotalRevenue = () =>
    customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0);

  const getAverageSpent = () => {
    const activeCustomers = customers.filter((c) => (c.totalSpent || 0) > 0);
    if (activeCustomers.length === 0) return 0;
    return getTotalRevenue() / activeCustomers.length;
  };

  const handleCreateCustomer = async () => {
    try {
      if (!formData.name || !formData.email) {
        alert("Please fill in all required fields");
        return;
      }
      await customerAPI.create({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || "",
        status: formData.status,
        joinedDate: new Date().toISOString(),
      });
      alert("✓ Customer created successfully!");
      setCreateDialogOpen(false);
      setFormData({ name: "", email: "", phone: "", status: "active" });
      fetchCustomers();
    } catch (error) {
      console.error("Failed to create customer:", error);
      alert("Failed to create customer. Please try again.");
    }
  };

  const handleEditCustomer = async () => {
    try {
      if (!formData.name || !formData.email) {
        alert("Please fill in all required fields");
        return;
      }
      if (!editingCustomer?.id) return;
      
      await customerAPI.update(editingCustomer.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || "",
        status: formData.status,
      });
      alert("✓ Customer updated successfully!");
      setEditDialogOpen(false);
      setEditingCustomer(null);
      setFormData({ name: "", email: "", phone: "", status: "active" });
      fetchCustomers();
    } catch (error) {
      console.error("Failed to update customer:", error);
      alert("Failed to update customer. Please try again.");
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        await customerAPI.delete(customerId);
        alert("✓ Customer removed successfully.");
        fetchCustomers();
      } catch (error) {
        console.error("Failed to delete customer:", error);
        alert("Failed to delete customer. Please try again.");
      }
    }
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      status: customer.status || "active",
    });
    setEditDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-green-100 text-green-700"
      : "bg-gray-100 text-gray-700";
  };

  const getPurchaseStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "active":
        return "bg-blue-100 text-blue-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Customers</h1>
          <p className="text-gray-600">
            Manage and view your customer information
          </p>
        </div>
        <Button 
          className="gap-2"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold">{getTotalCustomers()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold">{getActiveCustomers()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search customers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customers List */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Customer List ({filteredCustomers.length})
        </h2>
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading customers...</p>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="p-4 hover:shadow-lg transition-all">
                <div className="space-y-3">
                  {/* Customer Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {getInitials(customer.name)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{customer.name}</h3>
                        <Badge className={getStatusColor(customer.status || "active")}>
                          {customer.status || "active"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.joinedDate && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Joined {new Date(customer.joinedDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div>
                      <p className="text-xs text-gray-600">Total Spent</p>
                      <p className="font-semibold text-lg">
                        ${customer.totalSpent || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Purchases</p>
                      <p className="font-semibold text-lg">
                        {customer.purchaseCount || 0}
                      </p>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => openCustomerDetail(customer)}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => openEditDialog(customer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteCustomer(customer.id || customer._id || "")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No customers found</p>
          </div>
        )}
      </div>

      {/* Customer Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              View detailed information about this customer
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6 py-4">
              {/* Customer Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                  {getInitials(selectedCustomer.name)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {selectedCustomer.name}
                  </h3>
                  <Badge className={getStatusColor(selectedCustomer.status || "active")}>
                    {selectedCustomer.status || "active"}
                  </Badge>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="font-semibold mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  )}
                  {selectedCustomer.joinedDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span>
                        Member since{" "}
                        {new Date(selectedCustomer.joinedDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Purchase Stats */}
              <div>
                <h4 className="font-semibold mb-3">Purchase Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-xs text-gray-600">Total Spent</p>
                        <p className="text-xl font-bold">
                          ${selectedCustomer.totalSpent || 0}
                        </p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-600">Purchases</p>
                        <p className="text-xl font-bold">
                          {selectedCustomer.purchaseCount || 0}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Purchase History */}
              <div>
                <h4 className="font-semibold mb-3">Purchase History</h4>
                {(selectedCustomer.purchases || []).length > 0 ? (
                  <div className="space-y-3">
                    {selectedCustomer.purchases?.map((purchase) => (
                      <Card key={purchase.id} className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div
                              className={`p-2 rounded-lg ${
                                purchase.offeringType === "course"
                                  ? "bg-blue-100"
                                  : "bg-green-100"
                              }`}
                            >
                              {purchase.offeringType === "course" ? (
                                <GraduationCap className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Briefcase className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-sm">
                                {purchase.offeringTitle}
                              </h5>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {purchase.offeringType}
                                </Badge>
                                <Badge
                                  className={`text-xs ${getPurchaseStatusColor(
                                    purchase.status
                                  )}`}
                                >
                                  {purchase.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(purchase.date).toLocaleDateString()}
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {purchase.price}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No purchases yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Customer Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer record
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                placeholder="Customer name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCustomer}>
              Create Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                placeholder="Customer name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCustomer}>
              Update Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
