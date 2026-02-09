import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { User, CreditCard, Clock, Package, Save, Camera, Mail, Phone, MapPin, Building, AlertCircle, Video } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { creatorAPI, subscriptionAPI } from "@/app/api/apiClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

type SettingsTab = "profile" | "payment" | "slots" | "subscriptions";

interface SettingsProps {
  initialTab?: SettingsTab;
}

export function Settings({ initialTab = "profile" }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const tabs = [
    { id: "profile" as SettingsTab, label: "User Profile", icon: User },
    { id: "payment" as SettingsTab, label: "Payment Settings", icon: CreditCard },
    { id: "slots" as SettingsTab, label: "Allotment Slots", icon: Clock },
    { id: "subscriptions" as SettingsTab, label: "My Subscriptions", icon: Package },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "profile" && <UserProfile />}
        {activeTab === "payment" && <PaymentSettings />}
        {activeTab === "slots" && <AllotmentSlots />}
        {activeTab === "subscriptions" && <MySubscriptions />}
      </div>
    </div>
  );
}

function UserProfile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || "User",
    email: user?.email || "user@example.com",
    phone: "+91 98765 43210",
    bio: "Creator and educator helping people learn new skills",
    location: "San Francisco, CA",
    company: "Specialistly",
    website: "https://specialistly.com",
    profileImage: null as string | null,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [zoomConnected, setZoomConnected] = useState(false);
  const [zoomConnecting, setZoomConnecting] = useState(false);

  // Fetch profile data from database when component mounts or user changes
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.email || !user?.id) return;
      
      setIsLoading(true);
      try {
        const response = await creatorAPI.getByEmail(user.email);
        if (response && response.data) {
          const profile = response.data;
          setProfileData((prev) => ({
            ...prev,
            name: profile.creatorName || user.name || prev.name,
            email: profile.email || user.email || prev.email,
            phone: profile.phone || prev.phone,
            bio: profile.bio || prev.bio,
            location: profile.location || prev.location,
            company: profile.company || prev.company,
            website: profile.website || prev.website,
            profileImage: profile.profileImage || null,
          }));
          // Check if Zoom is connected from profile data
          setZoomConnected(profile.zoomConnected || !!profile.zoomAccessToken);
        }
      } catch (error) {
        // Profile not found is expected - just use defaults
        setProfileData((prev) => ({
          ...prev,
          name: user.name || prev.name,
          email: user.email || prev.email,
        }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user?.email, user?.id]); // Fetch when user email/id changes (login/logout)

  // Check Zoom connection status on mount and when OAuth returns
  useEffect(() => {
    const fetchZoomStatus = async () => {
      if (!user?.id) return;

      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
        const response = await fetch(`${API_BASE_URL}/api/zoom/oauth/user/status?userId=${user.id}`);
        const data = await response.json();
        
        if (data.success && data.authorized) {
          setZoomConnected(true);
        } else {
          setZoomConnected(false);
        }
      } catch (error) {
        console.error('Failed to fetch Zoom status:', error);
        // Status check failed, rely on profile data
      }
    };

    // Check on mount
    fetchZoomStatus();

    // Also check for OAuth success in URL params (when returning from OAuth flow)
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth_success') === 'true') {
      setZoomConnected(true);
      // Clean up URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user?.id]);

  const handleChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setErrorMessage("");
    setSuccessMessage("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setProfileData((prev) => ({ ...prev, profileImage: dataUrl }));
      setSuccessMessage("Photo updated (will be saved with profile)");
      setUploadingPhoto(false);
    };
    reader.onerror = () => {
      setErrorMessage("Failed to read file");
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      // Validate required fields
      if (!profileData.name.trim()) {
        setErrorMessage("Name is required");
        setIsSaving(false);
        return;
      }

      if (!profileData.email.trim()) {
        setErrorMessage("Email is required");
        setIsSaving(false);
        return;
      }

      const creatorData = {
        creatorName: profileData.name,
        email: profileData.email,
        bio: profileData.bio,
        phone: profileData.phone,
        location: profileData.location,
        company: profileData.company,
        website: profileData.website,
        profileImage: profileData.profileImage, // Store as base64
        weeklyAvailability: [],
      };
      
      await creatorAPI.save(creatorData);
      setSuccessMessage("✓ Your profile has been saved successfully!");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Failed to save profile:", error);
      setErrorMessage(`Failed to save profile: ${error instanceof Error ? error.message : "Please try again"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectZoom = () => {
    setZoomConnecting(true);
    const userId = user?.id;
    if (!userId) {
      console.error('User ID not found');
      alert('Unable to connect to Zoom. Please ensure you are logged in.');
      setZoomConnecting(false);
      return;
    }
    // Redirect to OAuth authorization URL with userId
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
    window.location.href = `${API_BASE_URL}/api/zoom/oauth/user/authorize?userId=${userId}`;
  };

  const handleDisconnectZoom = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Zoom account? You can reconnect anytime.')) {
      return;
    }

    if (!user?.id) {
      alert('Unable to determine your user ID. Please try again.');
      return;
    }

    try {
      setZoomConnecting(true);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
      
      const response = await fetch(`${API_BASE_URL}/api/zoom/oauth/user/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (data.success) {
        setZoomConnected(false);
        setSuccessMessage('✓ Zoom account disconnected successfully. You can reconnect anytime.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(`Failed to disconnect Zoom: ${data.error || 'Unknown error'}`);
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error disconnecting Zoom:', error);
      setErrorMessage('Failed to disconnect Zoom account. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setZoomConnecting(false);
    }
  };

  const userInitials = profileData.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profile Picture */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Update your profile photo</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="relative mb-4">
            {profileData.profileImage ? (
              <img
                src={profileData.profileImage}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-purple-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold">
                {userInitials}
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 cursor-pointer">
              <Camera className="w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
                className="hidden"
              />
            </label>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => document.querySelector('input[type="file"]')?.click()}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? "Uploading..." : "Upload New Photo"}
          </Button>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-700">
              <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-sm">Loading profile data...</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              <input
                type="text"
                value={profileData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Building className="w-4 h-4" />
                Company
              </label>
              <input
                type="text"
                value={profileData.company}
                onChange={(e) => handleChange("company", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Website</label>
              <input
                type="url"
                value={profileData.website}
                onChange={(e) => handleChange("website", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={profileData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setProfileData({
                  name: user?.name || "User",
                  email: user?.email || "user@example.com",
                  phone: "+91 98765 43210",
                  bio: "Creator and educator helping people learn new skills",
                  location: "San Francisco, CA",
                  company: "Specialistly",
                  website: "https://specialistly.com",
                  profileImage: null,
                });
                setSuccessMessage("");
                setErrorMessage("");
              }}
              disabled={isSaving}
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || uploadingPhoto}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Zoom Integration */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Zoom Integration
          </CardTitle>
          <CardDescription>Connect your Zoom account to create video meetings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {zoomConnected ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-green-700 font-medium">✓ Zoom Account Connected</span>
                  </div>
                  <p className="text-sm text-green-600 mt-2">Your Zoom account is connected and ready to use. Meetings will be automatically created when participants book appointments.</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleConnectZoom}
                    disabled={zoomConnecting}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {zoomConnecting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Reconnecting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Re-authorize
                      </span>
                    )}
                  </Button>
                  <Button
                    onClick={handleDisconnectZoom}
                    disabled={zoomConnecting}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    {zoomConnecting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        Disconnecting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Disconnect Zoom
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 mb-4">Connect your Zoom account to enable video meeting creation for appointments and sessions.</p>
                <Button
                  onClick={handleConnectZoom}
                  disabled={zoomConnecting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {zoomConnecting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Connecting to Zoom...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Connect Zoom Account
                    </span>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentSettings() {
  const [stripeConnected, setStripeConnected] = useState(false);
  const [payoutSchedule, setPayoutSchedule] = useState("weekly");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  const handleSavePaymentSettings = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      if (!user?.email) {
        setMessage("Unable to determine your email address");
        return;
      }

      const paymentData = {
        email: user.email,
        payoutSchedule,
      };

      // Call API to save payment settings
      await creatorAPI.save({ ...user, paymentSettings: paymentData });
      
      setMessage("✓ Payment settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save payment settings:", error);
      setMessage(`Failed to save: ${error instanceof Error ? error.message : "Please try again."}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Stripe Account
          </CardTitle>
          <CardDescription>Connect your Stripe account to receive payments</CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <div className={`p-3 rounded-md flex items-center gap-2 mb-4 ${
              message.includes("✓") 
                ? "bg-green-50 border border-green-200" 
                : "bg-red-50 border border-red-200"
            }`}>
              <AlertCircle className={`w-4 h-4 ${
                message.includes("✓") 
                  ? "text-green-600" 
                  : "text-red-600"
              }`} />
              <span className={message.includes("✓") ? "text-green-700" : "text-red-700"}>
                {message}
              </span>
            </div>
          )}
          {!stripeConnected ? (
            <div className="text-center py-8">
              <div className="mb-4 flex justify-center">
                <svg className="w-20 h-8" viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#635BFF" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.9 0 1.85 6.29.97 6.29 5.88z"/>
                </svg>
              </div>
              <p className="text-gray-600 mb-6">
                Connect your Stripe account to start accepting payments from customers
              </p>
              <Button
                onClick={() => setStripeConnected(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Connect with Stripe
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-900">Stripe Connected</p>
                  <p className="text-sm text-green-700">acct_1234567890abcdef</p>
                </div>
                <Button variant="outline" size="sm">
                  Disconnect
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Available Balance</p>
                  <p className="text-2xl font-bold">$12,450.00</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Pending Balance</p>
                  <p className="text-2xl font-bold">$3,200.00</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payout Schedule</label>
                <select
                  value={payoutSchedule}
                  onChange={(e) => setPayoutSchedule(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="flex justify-end">
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleSavePaymentSettings}
                  disabled={isSaving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your saved payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
                  VISA
                </div>
                <div>
                  <p className="font-medium">•••• 4242</p>
                  <p className="text-sm text-gray-600">Expires 12/25</p>
                </div>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Default
              </span>
            </div>

            <Button variant="outline" className="w-full">
              Add New Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AllotmentSlots() {
  const { user } = useAuth();
  const [slots, setSlots] = useState([
    { id: 1, day: "Monday", startTime: "09:00", endTime: "17:00", enabled: true },
    { id: 2, day: "Tuesday", startTime: "09:00", endTime: "17:00", enabled: true },
    { id: 3, day: "Wednesday", startTime: "09:00", endTime: "17:00", enabled: true },
    { id: 4, day: "Thursday", startTime: "09:00", endTime: "17:00", enabled: true },
    { id: 5, day: "Friday", startTime: "09:00", endTime: "17:00", enabled: true },
    { id: 6, day: "Saturday", startTime: "10:00", endTime: "14:00", enabled: false },
    { id: 7, day: "Sunday", startTime: "10:00", endTime: "14:00", enabled: false },
  ]);

  const [slotDuration, setSlotDuration] = useState("60");
  const [bufferTime, setBufferTime] = useState("15");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const toggleSlot = (id: number) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === id ? { ...slot, enabled: !slot.enabled } : slot
      )
    );
  };

  const handleTimeChange = (id: number, field: "startTime" | "endTime", value: string) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === id ? { ...slot, [field]: value } : slot
      )
    );
  };

  const handleSaveAvailability = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      if (!user?.email) {
        setMessage("Unable to determine your email address");
        return;
      }

      const slotsData = {
        email: user.email,
        slots,
        slotDuration: parseInt(slotDuration),
        bufferTime: parseInt(bufferTime),
      };

      // Call API to save availability
      const response = await creatorAPI.save({ ...user, appointmentSlots: slotsData });
      
      setMessage("✓ Availability settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save availability:", error);
      setMessage(`Failed to save: ${error instanceof Error ? error.message : "Please try again."}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Availability Settings</CardTitle>
          <CardDescription>Set your weekly availability for bookings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div className={`p-3 rounded-md flex items-center gap-2 ${
              message.includes("✓") 
                ? "bg-green-50 border border-green-200" 
                : "bg-red-50 border border-red-200"
            }`}>
              <AlertCircle className={`w-4 h-4 ${
                message.includes("✓") 
                  ? "text-green-600" 
                  : "text-red-600"
              }`} />
              <span className={message.includes("✓") ? "text-green-700" : "text-red-700"}>
                {message}
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Slot Duration (minutes)</label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Buffer Time (minutes)</label>
              <select
                value={bufferTime}
                onChange={(e) => setBufferTime(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="0">No buffer</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className={`border rounded-lg p-4 flex items-center gap-4 ${
                  slot.enabled ? "bg-white" : "bg-gray-50"
                }`}
              >
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slot.enabled}
                    onChange={() => toggleSlot(slot.id)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                </label>
                <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                  <span className="font-medium">{slot.day}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleTimeChange(slot.id, "startTime", e.target.value)}
                      disabled={!slot.enabled}
                      className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => handleTimeChange(slot.id, "endTime", e.target.value)}
                      disabled={!slot.enabled}
                      className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                    />
                  </div>
                  <span className={`text-sm ${slot.enabled ? "text-green-600" : "text-gray-400"}`}>
                    {slot.enabled ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleSaveAvailability}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Availability"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MySubscriptions() {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<"free" | "pro">(
    (user?.subscription?.planType as "free" | "pro") || "free"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      billing: "forever",
      status: currentPlan === "free" ? "active" : "available",
      features: [
        "Up to 3 courses",
        "Up to 10 sessions per month",
        "Email support",
        "Specialistly branding",
      ],
    },
    {
      id: "pro",
      name: "Pro Plan",
      price: 999,
      billing: "monthly",
      currency: "₹",
      status: currentPlan === "pro" ? "active" : "available",
      nextBilling: "Feb 25, 2026",
      features: [
        "Unlimited courses",
        "Advanced analytics",
        "Priority support",
        "Custom branding",
      ],
    },
  ];

  const handleUpgrade = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const email = user?.email;
      if (!email) {
        setMessage("Unable to determine your email address");
        return;
      }
      const subscriptionData = {
        email,
        planType: "pro",
        price: 999,
        currency: "₹",
        billingCycle: "monthly",
        features: plans.find(p => p.id === "pro")?.features || [],
        status: "active",
        autoRenew: true,
      };
      
      await subscriptionAPI.changePlan(email, subscriptionData);
      setCurrentPlan("pro");
      
      // Update auth context
      await updateSubscription(subscriptionData);
      
      setMessage("✓ Upgraded to Pro Plan successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Failed to upgrade subscription:", error);
      setMessage(`Failed to upgrade: ${error instanceof Error ? error.message : "Please try again."}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDowngrade = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const email = user?.email;
      if (!email) {
        setMessage("Unable to determine your email address");
        return;
      }
      const subscriptionData = {
        email,
        planType: "free",
        price: 0,
        currency: "₹",
        billingCycle: "forever",
        features: plans.find(p => p.id === "free")?.features || [],
        status: "active",
        autoRenew: false,
      };
      
      await subscriptionAPI.changePlan(email, subscriptionData);
      setCurrentPlan("free");
      
      // Update auth context
      await updateSubscription(subscriptionData);
      
      setMessage("✓ Switched to Free Plan successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Failed to downgrade subscription:", error);
      setMessage(`Failed to downgrade: ${error instanceof Error ? error.message : "Please try again."}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
          <CardDescription>Manage your current subscriptions and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div className={`p-3 rounded-md flex items-center gap-2 ${
              message.includes("✓") 
                ? "bg-green-50 border border-green-200" 
                : "bg-red-50 border border-red-200"
            }`}>
              <AlertCircle className={`w-4 h-4 ${
                message.includes("✓") 
                  ? "text-green-600" 
                  : "text-red-600"
              }`} />
              <span className={message.includes("✓") ? "text-green-700" : "text-red-700"}>
                {message}
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`border rounded-lg p-6 ${
                  plan.status === "active"
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                    <p className="text-gray-600">
                      {plan.price === 0 ? (
                        "Free"
                      ) : (
                        <>
                          {"currency" in plan ? plan.currency : "$"}{plan.price}/{plan.billing}
                        </>
                      )}
                    </p>
                  </div>
                  {plan.status === "active" && (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                      Current Plan
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Features:</p>
                  <ul className="space-y-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.status === "active" ? (
                  <div className="pt-4 border-t">
                    {plan.id === "pro" && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">
                          Next billing:{" "}
                          <span className="font-medium">{plan.nextBilling}</span>
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {plan.id === "pro" && (
                        <>
                          <Button variant="outline" size="sm" className="flex-1">
                            Manage
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-red-600 hover:text-red-700"
                            onClick={handleDowngrade}
                            disabled={isLoading}
                          >
                            {isLoading ? "Processing..." : "Cancel"}
                          </Button>
                        </>
                      )}
                      {plan.id === "free" && (
                        <Button
                          size="sm"
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          onClick={handleUpgrade}
                          disabled={isLoading}
                        >
                          {isLoading ? "Processing..." : "Upgrade to Pro"}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t">
                    {plan.id === "free" && (
                      <Button
                        size="sm"
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={handleDowngrade}
                        disabled={isLoading}
                      >
                        {isLoading ? "Processing..." : "Switch to Free"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}