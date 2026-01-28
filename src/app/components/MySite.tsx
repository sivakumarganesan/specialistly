import { useState, useEffect, useRef } from "react";
import { Globe, Check, X, Eye, Settings as SettingsIcon, Palette, Layout, Share2, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useAuth } from "@/app/context/AuthContext";
import { websiteAPI, courseAPI, serviceAPI } from "@/app/api/apiClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

type MySiteTab = "setup" | "customize" | "content" | "preview";

interface WebsiteData {
  subdomain?: string;
  isConfigured?: boolean;
  branding?: {
    siteName: string;
    tagline: string;
    logo: string;
    primaryColor: string;
    secondaryColor: string;
  };
  theme?: {
    mode: "light" | "dark";
  };
  content?: {
    selectedCourses: string[];
    selectedServices: string[];
  };
  footer?: {
    text: string;
    style: "minimal" | "detailed" | "custom";
    showSocialLinks: boolean;
    showContactInfo: boolean;
  };
  isPublished?: boolean;
}

export function MySite() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<MySiteTab>("setup");
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWebsiteData = async () => {
      if (!user?.email) return;
      try {
        setIsLoading(true);
        const response = await websiteAPI.getWebsite(user.email);
        if (response && response.data) {
          setWebsiteData(response.data);
          console.log("Website data loaded:", response.data);
        }
      } catch (error) {
        console.error("Failed to fetch website data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWebsiteData();
  }, [user?.email]);

  const tabs = [
    { id: "setup" as MySiteTab, label: "Setup", icon: Globe },
    { id: "customize" as MySiteTab, label: "Customize", icon: Palette },
    { id: "content" as MySiteTab, label: "Content", icon: Layout },
    { id: "preview" as MySiteTab, label: "Preview", icon: Eye },
  ];

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <p className="text-gray-600">Loading website configuration...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Site</h1>
        <p className="text-gray-600">Create your custom subdomain and public-facing site for customers</p>
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
        {activeTab === "setup" && <SubdomainSetup websiteData={websiteData} setWebsiteData={setWebsiteData} />}
        {activeTab === "customize" && <SiteCustomization websiteData={websiteData} setWebsiteData={setWebsiteData} />}
        {activeTab === "content" && <ContentSelection websiteData={websiteData} setWebsiteData={setWebsiteData} />}
        {activeTab === "preview" && <SitePreview websiteData={websiteData} />}
      </div>
    </div>
  );
}

function SubdomainSetup({ websiteData, setWebsiteData }: { websiteData: WebsiteData | null; setWebsiteData: (data: WebsiteData) => void }) {
  const { user } = useAuth();
  const [subdomain, setSubdomain] = useState(websiteData?.subdomain || "");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditMode, setIsEditMode] = useState(!websiteData?.isConfigured);

  const checkAvailability = async () => {
    if (!subdomain) return;
    
    setIsChecking(true);
    // Mock availability check - subdomains with less than 5 chars are "taken"
    setIsAvailable(subdomain.length >= 5);
    setIsChecking(false);
  };

  const handleSetupDomain = async () => {
    if (!user?.email || !subdomain) return;
    
    try {
      setIsSaving(true);
      const response = await websiteAPI.updateSubdomain(user.email, { subdomain });
      if (response && response.data) {
        setWebsiteData(response.data);
        setSuccessMessage("Subdomain configured successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Failed to setup subdomain:", error);
      alert("Failed to setup subdomain. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyUrl = () => {
    if (websiteData?.subdomain) {
      navigator.clipboard.writeText(`https://${websiteData.subdomain}.specialistly.com`);
    }
  };

  const isConfigured = websiteData?.isConfigured || false;

  return (
    <div className="space-y-6">
      {(!isConfigured || isEditMode) ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {isEditMode ? 'Change Domain' : 'Subdomain Setup'}
              </CardTitle>
              <CardDescription>
                {isEditMode ? 'Update your subdomain' : 'Choose a unique subdomain for your public site'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Subdomain
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center border rounded-lg overflow-hidden">
                    <input
                      type="text"
                      value={subdomain}
                      onChange={(e) => {
                        setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                        setIsAvailable(null);
                      }}
                      placeholder="yourname"
                      className="flex-1 px-4 py-2 focus:outline-none"
                    />
                    <span className="px-3 py-2 bg-gray-100 text-gray-600 border-l">
                      .specialistly.com
                    </span>
                  </div>
                  <Button
                    onClick={checkAvailability}
                    disabled={!subdomain || isChecking}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isChecking ? "Checking..." : "Check"}
                  </Button>
                </div>

                {isAvailable !== null && (
                  <div className={`mt-3 flex items-center gap-2 ${isAvailable ? "text-green-600" : "text-red-600"}`}>
                    {isAvailable ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="text-sm">
                          {subdomain}.specialistly.com is available!
                        </span>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        <span className="text-sm">
                          {subdomain}.specialistly.com is already taken
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Guidelines:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use only lowercase letters, numbers, and hyphens</li>
                  <li>• Must be at least 5 characters long</li>
                  <li>• Cannot start or end with a hyphen</li>
                  <li>• Choose something memorable for your customers</li>
                </ul>
              </div>

              {isAvailable && (
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSetupDomain}
                    disabled={isSaving}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isSaving ? "Setting up..." : "Setup This Domain"}
                  </Button>
                </div>
              )}
              
              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700">
                  {successMessage}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Why Create a Subdomain?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Share2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Easy Sharing</h4>
                    <p className="text-sm text-gray-600">
                      Share a single link with all your customers
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Palette className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Custom Branding</h4>
                    <p className="text-sm text-gray-600">
                      Customize colors, logo, and theme
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Layout className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Professional Look</h4>
                    <p className="text-sm text-gray-600">
                      Create a dedicated storefront for your offerings
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <SettingsIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Full Control</h4>
                    <p className="text-sm text-gray-600">
                      Choose which courses and services to display
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Domain Configured Successfully
            </CardTitle>
            <CardDescription>Your public site is ready to customize</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="text-sm text-gray-600 mb-2">Your site URL:</p>
              <div className="flex items-center gap-3">
                <a
                  href={`https://${websiteData?.subdomain}.specialistly.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-2xl font-bold text-purple-600 hover:underline flex items-center gap-2"
                >
                  {websiteData?.subdomain}.specialistly.com
                  <ExternalLink className="w-5 h-5" />
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUrl}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy URL
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">0</div>
                <p className="text-sm text-gray-600">Site Visitors</p>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">0</div>
                <p className="text-sm text-gray-600">Published Items</p>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">Active</div>
                <p className="text-sm text-gray-600">Site Status</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Customize your site's branding and theme</li>
                <li>Select which courses and services to publish</li>
                <li>Preview your site before sharing</li>
                <li>Share your URL with customers!</li>
              </ol>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditMode(true)}
              >
                Change Domain
              </Button>
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => window.open(`https://${websiteData?.subdomain}.specialistly.com`, '_blank')}
              >
                Visit Site
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SiteCustomization({ websiteData, setWebsiteData }: { websiteData: WebsiteData | null; setWebsiteData: (data: WebsiteData) => void }) {
  const { user } = useAuth();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [brandingData, setBrandingData] = useState({
    siteName: websiteData?.branding?.siteName || "My Creator Site",
    tagline: websiteData?.branding?.tagline || "Welcome to my site",
    primaryColor: websiteData?.branding?.primaryColor || "#9333ea",
    secondaryColor: websiteData?.branding?.secondaryColor || "#ec4899",
    logo: websiteData?.branding?.logo || "",
  });

  const [theme, setTheme] = useState<"light" | "dark">(websiteData?.theme?.mode || "light");
  const [footerData, setFooterData] = useState({
    text: websiteData?.footer?.text || "© 2026 My Creator Site. All rights reserved.",
    style: websiteData?.footer?.style || "minimal" as "minimal" | "detailed" | "custom",
    showSocialLinks: websiteData?.footer?.showSocialLinks || false,
    showContactInfo: websiteData?.footer?.showContactInfo || false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [logoPreview, setLogoPreview] = useState(brandingData.logo);

  const handleChange = (field: string, value: string) => {
    setBrandingData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setBrandingData((prev) => ({ ...prev, logo: base64String }));
      setLogoPreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const triggerLogoUpload = () => {
    logoInputRef.current?.click();
  };

  const clearLogo = () => {
    setBrandingData((prev) => ({ ...prev, logo: "" }));
    setLogoPreview("");
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  const handleSaveChanges = async () => {
    if (!user?.email) return;
    
    try {
      setIsSaving(true);
      const response = await websiteAPI.updateBranding(user.email, {
        branding: brandingData,
        theme: { mode: theme },
        footer: footerData,
      });
      if (response && response.data) {
        setWebsiteData(response.data);
        setSuccessMessage("Changes saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Failed to save changes:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Customize your site's branding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Site Name</label>
              <input
                type="text"
                value={brandingData.siteName}
                onChange={(e) => handleChange("siteName", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tagline</label>
              <input
                type="text"
                value={brandingData.tagline}
                onChange={(e) => handleChange("tagline", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Logo</label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                {logoPreview ? (
                  <div className="space-y-2">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-20 h-20 mx-auto bg-gray-100 rounded-lg object-cover"
                    />
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={triggerLogoUpload}
                      >
                        Change Logo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearLogo}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Globe className="w-12 h-12 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-600">Upload your logo</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={triggerLogoUpload}
                    >
                      Upload Image
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Color Theme</CardTitle>
            <CardDescription>Choose your brand colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={brandingData.primaryColor}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingData.primaryColor}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Secondary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={brandingData.secondaryColor}
                    onChange={(e) => handleChange("secondaryColor", e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingData.secondaryColor}
                    onChange={(e) => handleChange("secondaryColor", e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Theme Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    theme === "light"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-full h-16 bg-white border rounded mb-2"></div>
                  <p className="font-medium">Light</p>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    theme === "dark"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-full h-16 bg-gray-900 border rounded mb-2"></div>
                  <p className="font-medium">Dark</p>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
            
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700">
                {successMessage}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Footer Customization</CardTitle>
            <CardDescription>Customize how your footer appears</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Footer Style</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setFooterData((prev) => ({ ...prev, style: "minimal" }))}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    footerData.style === "minimal"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-sm">Minimal</p>
                  <p className="text-xs text-gray-600 mt-1">Just copyright</p>
                </button>
                <button
                  onClick={() => setFooterData((prev) => ({ ...prev, style: "detailed" }))}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    footerData.style === "detailed"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-sm">Detailed</p>
                  <p className="text-xs text-gray-600 mt-1">With options</p>
                </button>
                <button
                  onClick={() => setFooterData((prev) => ({ ...prev, style: "custom" }))}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    footerData.style === "custom"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-sm">Custom</p>
                  <p className="text-xs text-gray-600 mt-1">Full control</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Footer Text</label>
              <textarea
                value={footerData.text}
                onChange={(e) => setFooterData((prev) => ({ ...prev, text: e.target.value }))}
                placeholder="© 2026 My Creator Site. All rights reserved."
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={2}
              />
            </div>

            {footerData.style === "detailed" && (
              <>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showSocial"
                    checked={footerData.showSocialLinks}
                    onChange={(e) => setFooterData((prev) => ({ ...prev, showSocialLinks: e.target.checked }))}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="showSocial" className="text-sm font-medium cursor-pointer">
                    Show social media links
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showContact"
                    checked={footerData.showContactInfo}
                    onChange={(e) => setFooterData((prev) => ({ ...prev, showContactInfo: e.target.checked }))}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="showContact" className="text-sm font-medium cursor-pointer">
                    Show contact information
                  </label>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Preview */}
      <div className="lg:sticky lg:top-24 h-fit">
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>See how your site will look</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`border rounded-lg overflow-hidden ${theme === "dark" ? "bg-gray-900" : "bg-white"}`}>
              {/* Header Preview */}
              <div
                className="p-4 border-b"
                style={{
                  backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                  borderColor: theme === "dark" ? "#374151" : "#e5e7eb",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: brandingData.primaryColor }}
                    >
                      K
                    </div>
                    <span
                      className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                    >
                      {brandingData.siteName}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className={`h-8 w-16 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}></div>
                    <div className={`h-8 w-16 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}></div>
                  </div>
                </div>
              </div>

              {/* Hero Preview */}
              <div
                className="p-8 text-center"
                style={{
                  background: `linear-gradient(135deg, ${brandingData.primaryColor} 0%, ${brandingData.secondaryColor} 100%)`,
                }}
              >
                <h1 className="text-2xl font-bold text-white mb-2">
                  {brandingData.siteName}
                </h1>
                <p className="text-white/90">{brandingData.tagline}</p>
              </div>

              {/* Content Preview */}
              <div className={`p-6 ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className={`rounded-lg overflow-hidden ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
                    >
                      <div className="h-24 bg-gray-300"></div>
                      <div className="p-3">
                        <div className={`h-3 rounded mb-2 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}></div>
                        <div className={`h-2 rounded w-2/3 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ContentSelection({ websiteData, setWebsiteData }: { websiteData: WebsiteData | null; setWebsiteData: (data: WebsiteData) => void }) {
  const { user } = useAuth();
  const [selectedCourses, setSelectedCourses] = useState<string[]>(websiteData?.content?.selectedCourses || []);
  const [selectedServices, setSelectedServices] = useState<string[]>(websiteData?.content?.selectedServices || []);
  const [courses, setCourses] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchContent();
  }, [user]);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      // Fetch courses for current user
      const coursesResponse = await courseAPI.getAll();
      const allCourses = Array.isArray(coursesResponse?.data) ? coursesResponse.data : [];
      
      // Filter for active courses by the current user
      const userCourses = allCourses.filter(
        (course: any) => course.creator === user?.email && course.status === "active"
      );
      setCourses(userCourses);

      // Fetch services for current user
      const servicesResponse = await serviceAPI.getAll();
      const allServices = Array.isArray(servicesResponse?.data) ? servicesResponse.data : [];
      
      // Filter for active services by the current user
      const userServices = allServices.filter(
        (service: any) => service.creator === user?.email && service.status === "active"
      );
      setServices(userServices);
    } catch (error) {
      console.error("Failed to fetch content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCourse = (id: string) => {
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSaveContent = async () => {
    if (!user?.email) return;
    
    try {
      setIsSaving(true);
      const response = await websiteAPI.updateContent(user.email, {
        selectedCourses,
        selectedServices,
      });
      if (response && response.data) {
        setWebsiteData(response.data);
        setSuccessMessage("Content selection saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Failed to save content:", error);
      alert("Failed to save content. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Published Courses</CardTitle>
              <CardDescription>Select courses to display on your public site</CardDescription>
            </div>
            <div className="text-sm text-gray-600">
              {selectedCourses.length} of {courses.length} selected
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading your courses...</div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active courses found. Create and activate courses to add them to your site.
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => {
                const isSelected = selectedCourses.includes(course._id);
                return (
                  <div
                    key={course._id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => toggleCourse(course._id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex items-center h-6">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCourse(course._id)}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{course.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                            {course.courseType || "Course"}
                          </span>
                          <span>₹{course.price}</span>
                          <span>{course.enrolledStudents?.length || 0} students</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Published Services</CardTitle>
              <CardDescription>Select services to display on your public site</CardDescription>
            </div>
            <div className="text-sm text-gray-600">
              {selectedServices.length} of {services.length} selected
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading your services...</div>
          ) : services.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active services found. Create and activate services to add them to your site.
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => {
                const isSelected = selectedServices.includes(service._id);
                return (
                  <div
                    key={service._id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => toggleService(service._id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex items-center h-6">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleService(service._id)}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{service.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                            {service.serviceType || "Service"}
                          </span>
                          <span>₹{service.price}</span>
                          <span>{service.bookings?.length || 0} bookings</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button 
          variant="outline"
          onClick={handleSaveContent}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700">
          {successMessage}
        </div>
      )}
    </div>
  );
}

function SitePreview({ websiteData }: { websiteData: WebsiteData | null }) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(true);

  useEffect(() => {
    const fetchPreviewContent = async () => {
      if (!user?.email) return;
      try {
        setLoadingPreview(true);
        
        // Fetch courses created by this user
        const coursesResponse = await courseAPI.getAll({ creator: user.email });
        const activeCourses = coursesResponse?.data
          ?.filter((course: any) => course.status === "published" || course.status === "active")
          .slice(0, 3) || [];
        setCourses(activeCourses);

        // Fetch services created by this user
        const servicesResponse = await serviceAPI.getAll({ creator: user.email });
        const activeServices = servicesResponse?.data
          ?.filter((service: any) => service.status === "active")
          .slice(0, 2) || [];
        setServices(activeServices);
      } catch (error) {
        console.error("Failed to fetch preview content:", error);
      } finally {
        setLoadingPreview(false);
      }
    };

    fetchPreviewContent();
  }, [user?.email]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Site Preview</CardTitle>
              <CardDescription>Preview how your site appears to customers</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Desktop
              </Button>
              <Button variant="outline" size="sm">
                Mobile
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden bg-white">
            {/* Preview Header */}
            <div className="border-b p-4 bg-white">
              <div className="flex items-center justify-between max-w-6xl mx-auto">
                <div className="flex items-center gap-2">
                  {websiteData?.branding?.logo ? (
                    <img
                      src={websiteData.branding.logo}
                      alt="Logo"
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: websiteData?.branding?.primaryColor || "#9333ea" }}
                    >
                      {websiteData?.branding?.siteName?.[0] || "S"}
                    </div>
                  )}
                  <span className="font-bold text-lg">{websiteData?.branding?.siteName || "My Creator Site"}</span>
                </div>
                <div className="flex gap-4">
                  <button className="text-gray-700 hover:text-purple-600">Courses</button>
                  <button className="text-gray-700 hover:text-purple-600">Services</button>
                  <button className="text-gray-700 hover:text-purple-600">About</button>
                </div>
              </div>
            </div>

            {/* Preview Hero */}
            <div 
              className="text-white p-12 text-center"
              style={{
                background: `linear-gradient(135deg, ${websiteData?.branding?.primaryColor || "#9333ea"} 0%, ${websiteData?.branding?.secondaryColor || "#ec4899"} 100%)`,
              }}
            >
              <h1 className="text-4xl font-bold mb-4">{websiteData?.branding?.siteName || "My Creator Site"}</h1>
              <p className="text-xl mb-6 text-white/90">
                {websiteData?.branding?.tagline || "Welcome to my creator site"}
              </p>
              <Button className="bg-white text-purple-600 hover:bg-gray-100">
                Explore Courses
              </Button>
            </div>

            {/* Preview Courses */}
            <div className="p-8 bg-gray-50">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">Featured Courses</h2>
                {loadingPreview ? (
                  <div className="text-center py-8 text-gray-600">Loading courses...</div>
                ) : courses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <div key={course._id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-40 bg-gradient-to-br from-purple-400 to-pink-400"></div>
                        <div className="p-4">
                          <h3 className="font-semibold mb-2 line-clamp-2">{course.title}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-purple-600">₹{course.price || 0}</span>
                            <span className="text-sm text-gray-600">{course.enrollments?.length || 0} students</span>
                          </div>
                          <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                            Enroll Now
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No published courses yet</div>
                )}
              </div>
            </div>

            {/* Preview Services */}
            <div className="p-8 bg-white">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">Services</h2>
                {loadingPreview ? (
                  <div className="text-center py-8 text-gray-600">Loading services...</div>
                ) : services.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {services.map((service) => (
                      <div key={service._id} className="border rounded-lg p-6 hover:border-purple-500 transition-colors">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{service.title}</h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{service.description}</p>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-2xl font-bold text-purple-600">₹{service.price || 0}</span>
                          <span className="text-sm text-gray-600">{service.duration || 0} min</span>
                        </div>
                        <Button variant="outline" className="w-full">
                          Book Now
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No active services yet</div>
                )}
              </div>
            </div>

            {/* Preview Footer */}
            <div className="border-t p-6 bg-gray-900 text-white">
              <div className="max-w-6xl mx-auto">
                {websiteData?.footer?.style === "minimal" && (
                  <div className="text-center">
                    <p className="text-gray-400">{websiteData?.footer?.text}</p>
                  </div>
                )}

                {websiteData?.footer?.style === "detailed" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-8 mb-6 pb-6 border-b border-gray-700">
                      <div>
                        <h4 className="font-semibold mb-2">Quick Links</h4>
                        <ul className="text-sm text-gray-400 space-y-1">
                          <li><a href="#" className="hover:text-white">Courses</a></li>
                          <li><a href="#" className="hover:text-white">Services</a></li>
                          <li><a href="#" className="hover:text-white">About</a></li>
                        </ul>
                      </div>
                      {websiteData?.footer?.showContactInfo && (
                        <div>
                          <h4 className="font-semibold mb-2">Contact</h4>
                          <ul className="text-sm text-gray-400 space-y-1">
                            <li>Email: contact@example.com</li>
                            <li>Phone: +91 XXXXX XXXXX</li>
                          </ul>
                        </div>
                      )}
                      {websiteData?.footer?.showSocialLinks && (
                        <div>
                          <h4 className="font-semibold mb-2">Follow Us</h4>
                          <ul className="text-sm text-gray-400 space-y-1">
                            <li><a href="#" className="hover:text-white">Twitter</a></li>
                            <li><a href="#" className="hover:text-white">LinkedIn</a></li>
                            <li><a href="#" className="hover:text-white">Instagram</a></li>
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="text-center text-sm text-gray-400">
                      <p>{websiteData?.footer?.text}</p>
                    </div>
                  </div>
                )}

                {websiteData?.footer?.style === "custom" && (
                  <div className="text-center">
                    <p className="text-gray-300 whitespace-pre-wrap">{websiteData?.footer?.text}</p>
                  </div>
                )}

                {!websiteData?.footer?.style && (
                  <div className="text-center">
                    <p className="text-gray-400">© 2026 {websiteData?.branding?.siteName || "Creator Site"}. All rights reserved.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline">
          Edit Customization
        </Button>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Live Site
        </Button>
      </div>
    </div>
  );
}