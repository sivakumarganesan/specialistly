import { useState, useEffect } from "react";
import { brandingAPI, serviceAPI } from "@/app/api/apiClient";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Mail, Phone, MapPin, ExternalLink, Star } from "lucide-react";

interface BrandingData {
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
  footer: {
    enabled: boolean;
    copyrightText: string;
    showSocialLinks: boolean;
  };
  socialLinks: any[];
}

interface SpecialistLandingPageProps {
  slug: string;
}

export function SpecialistLandingPage({ slug }: SpecialistLandingPageProps) {
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const brandingResponse = await brandingAPI.getPublicBranding(slug);
        if (brandingResponse.data) {
          setBranding(brandingResponse.data);
          
          // Load services if needed
          try {
            const servicesResponse = await serviceAPI.getAll({ creator: brandingResponse.data.email });
            if (servicesResponse.data) {
              let filteredServices = servicesResponse.data.filter((s: any) => s.status === 'active');
              
              // If selectedServices are specified, filter to only those
              if (brandingResponse.data.selectedServices?.length > 0) {
                const selectedIds = brandingResponse.data.selectedServices.map((s: any) => 
                  typeof s === 'string' ? s : s._id
                );
                filteredServices = filteredServices.filter((s: any) => 
                  selectedIds.includes(s._id?.toString() || s._id)
                );
              }
              
              setServices(filteredServices);
            }
          } catch (err) {
            console.error("Failed to load services:", err);
          }
        }
      } catch (err: any) {
        setError(err.message || "Page not found");
      } finally {
        setIsLoading(false);
      }
    };

    loadPageData();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading page...</p>
        </div>
      </div>
    );
  }

  if (error || !branding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "The specialist page you're looking for doesn't exist."}</p>
          <Button onClick={() => window.location.href = '/'}>Return Home</Button>
        </Card>
      </div>
    );
  }

  // Safe color access with defaults
  const primaryColor = branding?.colors?.primary || "#3B82F6";
  const secondaryColor = branding?.colors?.secondary || "#1F2937";
  const accentColor = branding?.colors?.accent || "#10B981";

  return (
    <div className="min-h-screen" style={{ '--primary': primaryColor } as any}>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding.logoUrl && (
              <img src={branding.logoUrl} alt="Logo" className="h-10 w-10 rounded-full" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{branding.businessName}</h1>
              <p className="text-sm text-gray-600">{branding.businessTagline}</p>
            </div>
          </div>
          <nav className="hidden md:flex gap-6">
            {branding.about.enabled && <a href="#about" className="text-gray-600 hover:text-gray-900">About</a>}
            {branding.services.enabled && <a href="#services" className="text-gray-600 hover:text-gray-900">Services</a>}
            {branding.testimonials.enabled && <a href="#testimonials" className="text-gray-600 hover:text-gray-900">Reviews</a>}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="py-16 px-4 text-white text-center"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">{branding.header.title}</h1>
          <p className="text-xl mb-8 opacity-90">{branding.header.subtitle}</p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            {branding.header.ctaButtonText}
          </Button>
        </div>
      </section>

      {/* About Section */}
      {branding.about.enabled && (
        <section id="about" className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {branding.about.profileImage && (
                <img
                  src={branding.about.profileImage}
                  alt="Profile"
                  className="rounded-lg shadow-lg h-80 w-full object-cover"
                />
              )}
              <div>
                <h2 className="text-4xl font-bold mb-4">{branding.about.title}</h2>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-6">
                  {branding.about.bio}
                </p>
                <Button
                  size="lg"
                  style={{ backgroundColor: secondaryColor }}
                  className="text-white"
                >
                  Get in Touch
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Services Section */}
      {branding.services.enabled && (
        <section id="services" className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">{branding.services.title}</h2>
              {branding.services.description && (
                <p className="text-gray-600 text-lg">{branding.services.description}</p>
              )}
            </div>

            {branding.services.displayMode === 'grid' && (
              <div className="grid md:grid-cols-3 gap-6">
                {services.map((service) => (
                  <Card key={service._id} className="p-6 hover:shadow-lg transition">
                    <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-bold">${service.price}</span>
                      <Badge>{service.duration}</Badge>
                    </div>
                    <Button className="w-full" style={{ backgroundColor: accentColor }}>
                      Book Now
                    </Button>
                  </Card>
                ))}
              </div>
            )}

            {branding.services.displayMode === 'list' && (
              <div className="space-y-4">
                {services.map((service) => (
                  <Card key={service._id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                        <p className="text-gray-600 mb-2">{service.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold mb-2">${service.price}</p>
                        <Button size="sm" style={{ backgroundColor: accentColor }}>
                          Book
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {branding.testimonials.enabled && branding.testimonials.testimonials.length > 0 && (
        <section id="testimonials" className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">{branding.testimonials.title}</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {branding.testimonials.testimonials.map((testimonial, idx) => (
                <Card key={idx} className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.message}"</p>
                  <div className="border-t pt-4">
                    <p className="font-semibold">{testimonial.name}</p>
                    {testimonial.title && (
                      <p className="text-sm text-gray-600">{testimonial.title}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {branding.cta.enabled && (
        <section className="py-16 px-4 text-white text-center" style={{ backgroundColor: secondaryColor }}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">{branding.cta.title}</h2>
            <p className="text-xl mb-8 opacity-90">{branding.cta.description}</p>
            <Button size="lg" className="bg-white" style={{ color: secondaryColor }}>
              {branding.cta.buttonText}
            </Button>
          </div>
        </section>
      )}

      {/* Social Links */}
      {branding.footer.showSocialLinks && branding.socialLinks.length > 0 && (
        <section className="py-8 px-4 bg-gray-100">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-gray-600 mb-4">Connect with me on social media</p>
            <div className="flex justify-center gap-6 flex-wrap">
              {branding.socialLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white transition"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <span className="capitalize text-sm font-medium">{link.platform}</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      {branding.footer.enabled && (
        <footer className="bg-gray-900 text-white py-8 px-4 text-center">
          <p>{branding.footer.copyrightText || `© 2024 ${branding.businessName}. All rights reserved.`}</p>
          <p className="text-gray-400 text-sm mt-2">Powered by Specialistly Marketplace</p>
        </footer>
      )}
    </div>
  );
}
