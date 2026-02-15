import { useState, useEffect } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { useAuth } from "@/app/context/AuthContext";
import { brandingAPI, serviceAPI, courseAPI } from "@/app/api/apiClient";
import WebinarsSection from "@/app/components/WebinarsSection";
import {
  Palette,
  Globe,
  Layout,
  Edit3,
  Eye,
  EyeOff,
  Settings,
  Plus,
  Trash2,
  Copy,
  Check,
  Video,
} from "lucide-react";

interface BrandingData {
  _id?: string;
  slug: string;
  businessName: string;
  businessTagline: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  logoUrl: string;
  header: {
    title: string;
    subtitle: string;
    ctaButtonText: string;
  };
  about: {
    enabled: boolean;
    title: string;
    bio: string;
    profileImage: string;
  };
  services: {
    enabled: boolean;
    title: string;
    description: string;
    displayMode: string;
  };
  testimonials: {
    enabled: boolean;
    title: string;
    testimonials: any[];
  };
  cta: {
    enabled: boolean;
    title: string;
    description: string;
    buttonText: string;
  };
  seoTitle: string;
  seoDescription: string;
  layoutStyle: string;
  isPublished: boolean;
}

export function PageBuilder() {
  const { user } = useAuth();
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"general" | "design" | "sections" | "seo" | "content" | "webinars" | "preview">("general");
  const [slugCopied, setSlugCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Load branding on mount
  useEffect(() => {
    const loadBranding = async () => {
      try {
        if (!user?.email) return;
        
        try {
          const response = await brandingAPI.getMyBranding(user.email);
          if (response.data) {
            setBranding(response.data);
            setIsLoading(false);
            return;
          }
        } catch (error: any) {
          // If not found (404), create default branding
          if (error?.status !== 404) {
            throw error;
          }
        }

        // Create default branding if doesn't exist
        const newBranding: BrandingData = {
          slug: user.email.split('@')[0],
          businessName: "My Service",
          businessTagline: "Professional Services",
          colors: {
            primary: "#3B82F6",
            secondary: "#10B981",
            accent: "#F59E0B",
          },
          logoUrl: "",
          header: {
            title: "Welcome",
            subtitle: "Your Professional Services",
            ctaButtonText: "Book a Session",
          },
          about: {
            enabled: true,
            title: "About Me",
            bio: "",
            profileImage: "",
          },
          services: {
            enabled: true,
            title: "My Services",
            description: "",
            displayMode: "grid",
          },
          testimonials: {
            enabled: false,
            title: "What My Clients Say",
            testimonials: [],
          },
          cta: {
            enabled: true,
            title: "Ready to Get Started?",
            description: "Book a session with me today",
            buttonText: "Get Started",
          },
          seoTitle: "",
          seoDescription: "",
          layoutStyle: "modern",
          isPublished: false,
        };
        
        // Try to create the branding on the backend
        try {
          await brandingAPI.createBranding({
            ...newBranding,
            email: user.email,
            userId: user._id || user.id,
          });
        } catch (createError) {
          console.warn("Could not create branding on backend, using local defaults:", createError);
        }
        
        setBranding(newBranding);
      } catch (error) {
        console.error("Failed to load branding:", error);
        // Still set a default branding even on error
        setBranding({
          slug: user?.email?.split('@')[0] || "specialist",
          businessName: "My Service",
          businessTagline: "Professional Services",
          colors: {
            primary: "#3B82F6",
            secondary: "#10B981",
            accent: "#F59E0B",
          },
          logoUrl: "",
          header: {
            title: "Welcome",
            subtitle: "Your Professional Services",
            ctaButtonText: "Book a Session",
          },
          about: {
            enabled: true,
            title: "About Me",
            bio: "",
            profileImage: "",
          },
          services: {
            enabled: true,
            title: "My Services",
            description: "",
            displayMode: "grid",
          },
          testimonials: {
            enabled: false,
            title: "What My Clients Say",
            testimonials: [],
          },
          cta: {
            enabled: true,
            title: "Ready to Get Started?",
            description: "Book a session with me today",
            buttonText: "Get Started",
          },
          seoTitle: "",
          seoDescription: "",
          layoutStyle: "modern",
          isPublished: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadBranding();
  }, [user?.email]);

  // Load courses and services
  useEffect(() => {
    const loadContentOptions = async () => {
      if (!user?.email) return;
      try {
        const [coursesRes, servicesRes] = await Promise.all([
          courseAPI.getAll({ creator: user.email }),
          serviceAPI.getAll({ creator: user.email }),
        ]);
        
        if (coursesRes?.data) setCourses(coursesRes.data);
        if (servicesRes?.data) setServices(servicesRes.data);
        
        // If branding has selected items, sync them
        if (branding?.selectedCourses?.length) {
          setSelectedCourses(branding.selectedCourses.map(c => typeof c === 'string' ? c : c._id));
        }
        if (branding?.selectedServices?.length) {
          setSelectedServices(branding.selectedServices.map(s => typeof s === 'string' ? s : s._id));
        }
      } catch (error) {
        console.error("Failed to load courses/services:", error);
      }
    };
    
    loadContentOptions();
  }, [user?.email, branding]);

  const handleSaveBranding = async () => {
    if (!user?.email || !branding) return;
    
    try {
      setIsSaving(true);
      await brandingAPI.updateBranding(user.email, {
        ...branding,
        selectedCourses,
        selectedServices,
      });
      // Show success message
    } catch (error) {
      console.error("Failed to save branding:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!user?.email || !branding) return;
    
    try {
      const response = await brandingAPI.togglePublish(user.email);
      if (response.data) {
        setBranding(response.data);
      }
    } catch (error) {
      console.error("Failed to toggle publish:", error);
    }
  };

  const copySlugUrl = () => {
    if (branding?.slug) {
      navigator.clipboard.writeText(`https://specialistly.com/specialist/${branding.slug}`);
      setSlugCopied(true);
      setTimeout(() => setSlugCopied(false), 2000);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!branding) {
    return <div className="p-6">Failed to load page builder</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Page Builder</h1>
          <p className="text-gray-600">Create and customize your specialist marketplace page</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleTogglePublish}
            className="gap-2"
          >
            {branding.isPublished ? (
              <>
                <EyeOff className="h-4 w-4" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Publish
              </>
            )}
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 gap-2"
            onClick={handleSaveBranding}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Subdomain Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1">Your Public Page</h3>
            <p className="text-sm text-gray-600 mb-2">Your marketplace page is accessible at:</p>
            <div className="flex items-center gap-2">
              <code className="bg-white px-3 py-2 rounded border border-blue-200 font-mono text-sm">
                https://specialistly.com/specialist/{branding.slug}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={copySlugUrl}
                className="gap-1"
              >
                {slugCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
          <Badge className={branding.isPublished ? "bg-green-600" : "bg-gray-600"}>
            {branding.isPublished ? "Published" : "Unpublished"}
          </Badge>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {(["general", "design", "sections", "seo", "content", "webinars", "preview"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab === "general" && <span className="flex items-center gap-2"><Settings className="h-4 w-4" /> General</span>}
            {tab === "design" && <span className="flex items-center gap-2"><Palette className="h-4 w-4" /> Design</span>}
            {tab === "sections" && <span className="flex items-center gap-2"><Layout className="h-4 w-4" /> Sections</span>}
            {tab === "seo" && <span className="flex items-center gap-2"><Globe className="h-4 w-4" /> SEO</span>}
            {tab === "content" && <span className="flex items-center gap-2"><Globe className="h-4 w-4" /> Content</span>}
            {tab === "webinars" && <span className="flex items-center gap-2"><Video className="h-4 w-4" /> Webinars</span>}
            {tab === "preview" && <span className="flex items-center gap-2"><Eye className="h-4 w-4" /> Preview</span>}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === "general" && (
        <Card className="p-6 space-y-6">
          <div>
            <Label>Business Name</Label>
            <Input
              value={branding?.businessName || ""}
              onChange={(e) => setBranding({ ...branding, businessName: e.target.value })}
              placeholder="Your business name"
            />
          </div>

          <div>
            <Label>Business Tagline</Label>
            <Input
              value={branding?.businessTagline || ""}
              onChange={(e) => setBranding({ ...branding, businessTagline: e.target.value })}
              placeholder="Your tagline or slogan"
            />
          </div>

          <div>
            <Label>Page Slug</Label>
            <Input
              value={branding?.slug || ""}
              onChange={(e) => setBranding({ ...branding, slug: e.target.value })}
              placeholder="your-slug"
              className="font-mono"
            />
            <p className="text-xs text-gray-600 mt-1">Used in your public URL</p>
          </div>

          <div>
            <Label>Logo URL</Label>
            <Input
              value={branding?.logoUrl || ""}
              onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div>
            <Label>Layout Style</Label>
            <select
              value={branding?.layoutStyle || "modern"}
              onChange={(e) => setBranding({ ...branding, layoutStyle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="minimal">Minimal</option>
              <option value="modern">Modern</option>
              <option value="corporate">Corporate</option>
              <option value="creative">Creative</option>
            </select>
          </div>
        </Card>
      )}

      {/* Design Settings */}
      {activeTab === "design" && (
        <Card className="p-6 space-y-6">
          <h3 className="text-lg font-semibold">Color Scheme</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label>Primary Color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={branding?.colors?.primary || "#3B82F6"}
                  onChange={(e) => setBranding({
                    ...branding,
                    colors: { ...branding?.colors, primary: e.target.value }
                  })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  value={branding?.colors?.primary || "#3B82F6"}
                  onChange={(e) => setBranding({
                    ...branding,
                    colors: { ...branding?.colors, primary: e.target.value }
                  })}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <Label>Secondary Color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={branding?.colors?.secondary || "#10B981"}
                  onChange={(e) => setBranding({
                    ...branding,
                    colors: { ...branding?.colors, secondary: e.target.value }
                  })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  value={branding?.colors?.secondary || "#10B981"}
                  onChange={(e) => setBranding({
                    ...branding,
                    colors: { ...branding?.colors, secondary: e.target.value }
                  })}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <Label>Accent Color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={branding?.colors?.accent || "#F59E0B"}
                  onChange={(e) => setBranding({
                    ...branding,
                    colors: { ...branding?.colors, accent: e.target.value }
                  })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  value={branding?.colors?.accent || "#F59E0B"}
                  onChange={(e) => setBranding({
                    ...branding,
                    colors: { ...branding?.colors, accent: e.target.value }
                  })}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Header Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Header Section</h3>
            <div className="space-y-4">
              <div>
                <Label>Header Title</Label>
                <Input
                  value={branding?.header?.title || ""}
                  onChange={(e) => setBranding({
                    ...branding,
                    header: { ...branding?.header, title: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>Header Subtitle</Label>
                <Input
                  value={branding?.header?.subtitle || ""}
                  onChange={(e) => setBranding({
                    ...branding,
                    header: { ...branding?.header, subtitle: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Page Sections */}
      {activeTab === "sections" && (
        <Card className="p-6 space-y-6">
          {/* About Section */}
          <div className="border-b pb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">About Section</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={branding?.about?.enabled || false}
                  onChange={(e) => setBranding({
                    ...branding,
                    about: { ...branding?.about, enabled: e.target.checked }
                  })}
                />
                Enable
              </label>
            </div>
            <div className="space-y-3">
              <div>
                <Label>About Title</Label>
                <Input
                  value={branding?.about?.title || ""}
                  onChange={(e) => setBranding({
                    ...branding,
                    about: { ...branding?.about, title: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea
                  value={branding?.about?.bio || ""}
                  onChange={(e) => setBranding({
                    ...branding,
                    about: { ...branding?.about, bio: e.target.value }
                  })}
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Services Section */}
          <div className="border-b pb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Services Section</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={branding?.services?.enabled || false}
                  onChange={(e) => setBranding({
                    ...branding,
                    services: { ...branding?.services, enabled: e.target.checked }
                  })}
                />
                Enable
              </label>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Section Title</Label>
                <Input
                  value={branding?.services?.title || ""}
                  onChange={(e) => setBranding({
                    ...branding,
                    services: { ...branding?.services, title: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>Display Mode</Label>
                <select
                  value={branding?.services?.displayMode || "grid"}
                  onChange={(e) => setBranding({
                    ...branding,
                    services: { ...branding?.services, displayMode: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                  <option value="carousel">Carousel</option>
                </select>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Call-to-Action Section</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={branding?.cta?.enabled || false}
                  onChange={(e) => setBranding({
                    ...branding,
                    cta: { ...branding?.cta, enabled: e.target.checked }
                  })}
                />
                Enable
              </label>
            </div>
            <div className="space-y-3">
              <div>
                <Label>CTA Title</Label>
                <Input
                  value={branding?.cta?.title || ""}
                  onChange={(e) => setBranding({
                    ...branding,
                    cta: { ...branding?.cta, title: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>CTA Description</Label>
                <Textarea
                  value={branding?.cta?.description || ""}
                  onChange={(e) => setBranding({
                    ...branding,
                    cta: { ...branding?.cta, description: e.target.value }
                  })}
                  rows={3}
                />
              </div>
              <div>
                <Label>Button Text</Label>
                <Input
                  value={branding?.cta?.buttonText || ""}
                  onChange={(e) => setBranding({
                    ...branding,
                    cta: { ...branding?.cta, buttonText: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* SEO Settings */}
      {activeTab === "seo" && (
        <Card className="p-6 space-y-6">
          <div>
            <Label>Page Title (SEO)</Label>
            <Input
              value={branding?.seoTitle || ""}
              onChange={(e) => setBranding({ ...branding, seoTitle: e.target.value })}
              placeholder="Your page title for search engines"
            />
            <p className="text-xs text-gray-600 mt-1">Recommended: 50-60 characters</p>
          </div>

          <div>
            <Label>Meta Description</Label>
            <Textarea
              value={branding?.seoDescription || ""}
              onChange={(e) => setBranding({ ...branding, seoDescription: e.target.value })}
              placeholder="Description that appears in search results"
              rows={3}
            />
            <p className="text-xs text-gray-600 mt-1">Recommended: 150-160 characters</p>
          </div>

          <div>
            <Label>Keywords</Label>
            <Textarea
              value={branding?.seoTitle || ""}
              onChange={(e) => setBranding({ ...branding, seoTitle: e.target.value })}
              placeholder="Comma-separated keywords"
              rows={3}
            />
          </div>
        </Card>
      )}

      {/* Content Selection */}
      {activeTab === "content" && (
        <Card className="p-6 space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Select Courses to Display</h3>
            {courses.length === 0 ? (
              <p className="text-gray-600">No courses found. Create a course first.</p>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <label key={course._id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(course._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCourses([...selectedCourses, course._id]);
                        } else {
                          setSelectedCourses(selectedCourses.filter(id => id !== course._id));
                        }
                      }}
                      className="w-5 h-5 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{course.title}</p>
                      <p className="text-sm text-gray-600">{course.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-8">
            <h3 className="text-lg font-semibold mb-4">Select Services to Display</h3>
            {services.length === 0 ? (
              <p className="text-gray-600">No services found. Create a service first.</p>
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
                  <label key={service._id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedServices([...selectedServices, service._id]);
                        } else {
                          setSelectedServices(selectedServices.filter(id => id !== service._id));
                        }
                      }}
                      className="w-5 h-5 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{service.title}</p>
                      <p className="text-sm text-gray-600">{service.description}</p>
                      <p className="text-sm text-gray-500">${service.price} • {service.duration} min</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              💡 <strong>Tip:</strong> Selected courses and services will appear on your public branding page. You can change these selections at any time.
            </p>
          </div>
        </Card>
      )}

      {/* Webinars */}
      {activeTab === "webinars" && (
        <div className="space-y-6">
          <WebinarsSection
            specialistEmail={user?.email || ''}
            specialistId={user?.id || ''}
            specialistName={branding?.businessName || 'Specialist'}
          />
        </div>
      )}

      {/* Preview */}
      {activeTab === "preview" && (
        <div className="space-y-6">
          {/* Preview Card */}
          <Card className="p-8 bg-white">
            <div className="max-w-4xl mx-auto">
              {/* Header Section */}
              <div 
                className="rounded-lg p-12 mb-8 text-white text-center"
                style={{ backgroundColor: branding?.colors?.primary || '#3B82F6' }}
              >
                {branding?.logoUrl && (
                  <img 
                    src={branding.logoUrl} 
                    alt="Logo" 
                    className="h-16 mx-auto mb-4 rounded"
                  />
                )}
                <h1 className="text-4xl font-bold mb-2">{branding?.businessName || 'Your Business Name'}</h1>
                <p className="text-xl opacity-90">{branding?.businessTagline || 'Your tagline or slogan'}</p>
              </div>

              {/* About Section */}
              {branding?.about?.enabled && (
                <div className="mb-12 pb-8 border-b">
                  <h2 
                    className="text-3xl font-bold mb-6"
                    style={{ color: branding?.colors?.primary || '#3B82F6' }}
                  >
                    {branding?.about?.title || 'About Me'}
                  </h2>
                  <div className="flex gap-8 items-start">
                    {branding?.about?.profileImage && (
                      <img 
                        src={branding.about.profileImage} 
                        alt="Profile" 
                        className="w-48 h-48 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div>
                      <p className="text-gray-700 text-lg leading-relaxed">{branding?.about?.bio || 'Your bio goes here'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Services Section */}
              {branding?.services?.enabled && selectedServices.length > 0 && (
                <div className="mb-12 pb-8 border-b">
                  <h2 
                    className="text-3xl font-bold mb-6"
                    style={{ color: branding?.colors?.primary || '#3B82F6' }}
                  >
                    {branding?.services?.title || 'Services'}
                  </h2>
                  {branding?.services?.description && (
                    <p className="text-gray-600 mb-8 text-lg">{branding.services.description}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {services
                      .filter(s => selectedServices.includes(s._id))
                      .map((service) => (
                        <div 
                          key={service._id} 
                          className="p-6 rounded-lg border-2 transition hover:shadow-lg"
                          style={{ borderColor: branding?.colors?.secondary || '#10B981' }}
                        >
                          <h3 className="text-xl font-bold mb-2 text-gray-900">{service.title}</h3>
                          <p className="text-gray-600 mb-4">{service.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold" style={{ color: branding?.colors?.accent || '#F59E0B' }}>₹{service.cost}</span>
                            <span className="text-sm text-gray-500">{service.duration} min</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Courses Section */}
              {selectedCourses.length > 0 && (
                <div className="mb-12 pb-8 border-b">
                  <h2 
                    className="text-3xl font-bold mb-6"
                    style={{ color: branding?.colors?.primary || '#3B82F6' }}
                  >
                    Courses
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {courses
                      .filter(c => selectedCourses.includes(c._id))
                      .map((course) => (
                        <div 
                          key={course._id} 
                          className="p-6 rounded-lg border-2 transition hover:shadow-lg"
                          style={{ borderColor: branding?.colors?.secondary || '#10B981' }}
                        >
                          <h3 className="text-xl font-bold mb-2 text-gray-900">{course.title}</h3>
                          <p className="text-gray-600 mb-4">{course.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold" style={{ color: branding?.colors?.accent || '#F59E0B' }}>
                              {course.cost ? `₹${course.cost}` : 'Free'}
                            </span>
                            <span className="text-sm text-gray-500">{course.courseType}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* CTA Section */}
              {branding?.cta?.enabled && (
                <div 
                  className="rounded-lg p-8 text-center text-white"
                  style={{ backgroundColor: branding?.colors?.secondary || '#10B981' }}
                >
                  <h2 className="text-2xl font-bold mb-2">{branding?.cta?.title || 'Ready to Get Started?'}</h2>
                  <p className="mb-6 text-lg opacity-90">{branding?.cta?.description || 'Contact us to learn more'}</p>
                  <button 
                    className="px-8 py-3 rounded-lg font-semibold transition hover:opacity-90"
                    style={{ backgroundColor: branding?.colors?.accent || '#F59E0B', color: '#ffffff' }}
                  >
                    {branding?.cta?.buttonText || 'Get Started'}
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* Preview Info Card */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-900">
              💡 <strong>Preview Info:</strong> This is how your page will look when published. Make changes in other tabs and they will appear here in real-time.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
