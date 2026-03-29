import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
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
  GraduationCap,
  Briefcase,
  Clock,
  Plus,
  Trash2,
  Edit,
  Send,
  CheckSquare,
  Square,
  Filter,
  Video,
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

interface CourseEnrollment {
  courseTitle: string;
  courseType: string;
  enrolledAt: string;
  status: string;
  amount: number;
}

interface Appointment {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  bookedAt: string;
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
  courseEnrollments?: CourseEnrollment[];
  appointments?: Appointment[];
  hasEnrollments?: boolean;
  hasAppointments?: boolean;
}

export function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [segment, setSegment] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Selection for bulk email
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  
  // Email compose
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  
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
      const response = await customerAPI.getEnriched({ 
        specialistEmail: user?.email || "",
        segment: segment !== "all" ? segment : undefined,
      });
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
          courseEnrollments: customer.courseEnrollments || [],
          appointments: customer.appointments || [],
          hasEnrollments: customer.hasEnrollments || false,
          hasAppointments: customer.hasAppointments || false,
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
  }, [user?.email, segment]);

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
  const getActiveCustomers = () => customers.filter((c) => c.status === "active").length;
  const getEnrolledCount = () => customers.filter((c) => c.hasEnrollments).length;
  const getAppointmentCount = () => customers.filter((c) => c.hasAppointments).length;

  // Selection helpers
  const toggleSelect = (email: string) => {
    setSelectedEmails(prev => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEmails.size === filteredCustomers.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredCustomers.map(c => c.email)));
    }
  };

  // Email sending
  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert("Please fill in both subject and message body.");
      return;
    }
    try {
      setSendingEmail(true);
      const response = await customerAPI.sendEmail({
        emails: Array.from(selectedEmails),
        subject: emailSubject,
        body: emailBody,
        specialistName: user?.name || user?.email || "",
      });
      alert(response.message || `Email sent to ${selectedEmails.size} customer(s)!`);
      setEmailDialogOpen(false);
      setEmailSubject("");
      setEmailBody("");
      setSelectedEmails(new Set());
    } catch (error: any) {
      console.error("Failed to send email:", error);
      alert(error?.message || "Failed to send email. Please try again.");
    } finally {
      setSendingEmail(false);
    }
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
      alert("Customer created successfully!");
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
      alert("Customer updated successfully!");
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
        alert("Customer removed successfully.");
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

  const getEnrollmentStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-700";
      case "active": return "bg-cyan-100 text-blue-700";
      case "cancelled": case "dropped": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Customers</h1>
          <p className="text-gray-600">
            Manage customers, view enrollments, and send email updates
          </p>
        </div>
        <div className="flex gap-2">
          {selectedEmails.size > 0 && (
            <Button 
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={() => setEmailDialogOpen(true)}
            >
              <Send className="h-4 w-4" />
              Email ({selectedEmails.size})
            </Button>
          )}
          <Button 
            variant="outline"
            className="gap-2"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
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
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold">{getActiveCustomers()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Enrolled</p>
              <p className="text-2xl font-bold">{getEnrolledCount()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Video className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Booked</p>
              <p className="text-2xl font-bold">{getAppointmentCount()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search, Filter, and Segment */}
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
        <Select value={segment} onValueChange={setSegment}>
          <SelectTrigger className="w-full md:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Segment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            <SelectItem value="course-enrolled">Course Enrolled</SelectItem>
            <SelectItem value="appointment-booked">Appointment Booked</SelectItem>
            <SelectItem value="no-activity">No Activity</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Select All / Bulk Actions Bar */}
      {filteredCustomers.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <button
            className="flex items-center gap-2 hover:text-gray-900 transition-colors"
            onClick={toggleSelectAll}
          >
            {selectedEmails.size === filteredCustomers.length ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {selectedEmails.size === filteredCustomers.length ? "Deselect All" : "Select All"}
          </button>
          {selectedEmails.size > 0 && (
            <span className="text-blue-600 font-medium">
              {selectedEmails.size} selected
            </span>
          )}
        </div>
      )}

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
              <Card key={customer.id || customer.email} className={`p-4 hover:shadow-lg transition-all ${selectedEmails.has(customer.email) ? "ring-2 ring-blue-500" : ""}`}>
                <div className="space-y-3">
                  {/* Customer Header with checkbox */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleSelect(customer.email)} className="shrink-0">
                        {selectedEmails.has(customer.email) ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-semibold text-sm">
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
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Enrollment & Appointment badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {(customer.courseEnrollments?.length || 0) > 0 && (
                      <Badge className="bg-purple-100 text-purple-700 text-xs">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        {customer.courseEnrollments?.length} Course{(customer.courseEnrollments?.length || 0) > 1 ? "s" : ""}
                      </Badge>
                    )}
                    {(customer.appointments?.length || 0) > 0 && (
                      <Badge className="bg-orange-100 text-orange-700 text-xs">
                        <Video className="h-3 w-3 mr-1" />
                        {customer.appointments?.length} Appt{(customer.appointments?.length || 0) > 1 ? "s" : ""}
                      </Badge>
                    )}
                    {!customer.hasEnrollments && !customer.hasAppointments && (
                      <Badge className="bg-gray-100 text-gray-500 text-xs">No activity</Badge>
                    )}
                  </div>

                  {/* Actions */}
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
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              Enrollments, appointments, and purchase history
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6 py-4">
              {/* Customer Info */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {getInitials(selectedCustomer.name)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedCustomer.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  )}
                </div>
                <Badge className={getStatusColor(selectedCustomer.status || "active")}>
                  {selectedCustomer.status || "active"}
                </Badge>
              </div>

              {/* Course Enrollments */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                  Course Enrollments ({selectedCustomer.courseEnrollments?.length || 0})
                </h4>
                {(selectedCustomer.courseEnrollments?.length || 0) > 0 ? (
                  <div className="space-y-2">
                    {selectedCustomer.courseEnrollments?.map((enrollment, i) => (
                      <Card key={i} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{enrollment.courseTitle}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{enrollment.courseType}</Badge>
                              <Badge className={`text-xs ${getEnrollmentStatusColor(enrollment.status)}`}>
                                {enrollment.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            {enrollment.amount > 0 && (
                              <p className="font-semibold">{enrollment.amount}</p>
                            )}
                            {enrollment.enrolledAt && (
                              <p className="text-xs text-gray-500">
                                {new Date(enrollment.enrolledAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-3">No course enrollments yet</p>
                )}
              </div>

              {/* Appointments */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Video className="h-5 w-5 text-orange-600" />
                  Appointments ({selectedCustomer.appointments?.length || 0})
                </h4>
                {(selectedCustomer.appointments?.length || 0) > 0 ? (
                  <div className="space-y-2">
                    {selectedCustomer.appointments?.map((appt, i) => (
                      <Card key={i} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{appt.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                              <Calendar className="h-3 w-3" />
                              <span>{appt.date ? new Date(appt.date).toLocaleDateString() : ""}</span>
                              <Clock className="h-3 w-3 ml-1" />
                              <span>{appt.startTime} - {appt.endTime}</span>
                            </div>
                          </div>
                          <Badge className={`text-xs ${getEnrollmentStatusColor(appt.status)}`}>
                            {appt.status}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-3">No appointments yet</p>
                )}
              </div>

              {/* Purchase History */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                  Purchases ({selectedCustomer.purchases?.length || 0})
                </h4>
                {(selectedCustomer.purchases || []).length > 0 ? (
                  <div className="space-y-2">
                    {selectedCustomer.purchases?.map((purchase, i) => (
                      <Card key={i} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              purchase.offeringType === "course" ? "bg-cyan-100" : "bg-green-100"
                            }`}>
                              {purchase.offeringType === "course" ? (
                                <GraduationCap className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Briefcase className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{purchase.offeringTitle}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(purchase.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">{purchase.price}</p>
                            <Badge className={`text-xs ${getEnrollmentStatusColor(purchase.status)}`}>
                              {purchase.status}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-3">No purchases yet</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Compose Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Email to Customers
            </DialogTitle>
            <DialogDescription>
              Sending to {selectedEmails.size} customer{selectedEmails.size !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {Array.from(selectedEmails).map(email => (
                <Badge key={email} variant="outline" className="text-xs">
                  {email}
                </Badge>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subject *</label>
              <Input
                placeholder="e.g. New course available - Enroll now!"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message *</label>
              <Textarea
                placeholder="Write your message here..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={sendingEmail}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
              {sendingEmail ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Customer Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Create a new customer record</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input placeholder="Customer name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input type="email" placeholder="customer@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCustomer}>Create Customer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input placeholder="Customer name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input type="email" placeholder="customer@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditCustomer}>Update Customer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
