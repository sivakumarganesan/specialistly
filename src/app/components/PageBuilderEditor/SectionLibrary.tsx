import React from 'react';
import { PageSection } from '@/app/hooks/usePageBuilder';
import {
  Flame,
  LayoutGrid,
  MessageSquare,
  Users,
  Mail,
  DollarSign,
  Zap,
  FileText,
  Image,
  Award,
  BookOpen,
  HelpCircle,
  GraduationCap,
  PanelTop,
  Navigation,
  Play,
} from 'lucide-react';

interface SectionTemplate {
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  defaultContent: Record<string, any>;
}

const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    type: 'topbar',
    name: 'Top Bar',
    description: 'Small bar with address, phone & social links',
    icon: <PanelTop className="w-6 h-6" />,
    defaultContent: {
      address: '',
      phone: '',
      backgroundColor: '#00acc1',
      textColor: '#ffffff',
      socialLinks: [],
    },
  },
  {
    type: 'navbar',
    name: 'Navigation',
    description: 'Brand name/logo with navigation menu',
    icon: <Navigation className="w-6 h-6" />,
    defaultContent: {
      brandName: 'My Brand',
      brandColor: '#00acc1',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      logoUrl: '',
      menuItems: [],
    },
  },
  {
    type: 'hero',
    name: 'Hero',
    description: 'Large banner with headline, subtitle, and CTA — supports slideshow',
    icon: <Flame className="w-6 h-6" />,
    defaultContent: {
      accentColor: '#00b4d8',
      autoplaySeconds: 5,
      slides: [
        {
          title: 'Welcome to Your Website',
          accentText: '',
          subtitle: 'Create an amazing first impression',
          ctaText: 'Get Started',
          ctaLink: '',
          backgroundImage: '',
          overlayImage: '',
        },
      ],
      overlayOpacity: 0.3,
    },
  },
  {
    type: 'services',
    name: 'Services',
    description: 'Showcase your services or products',
    icon: <LayoutGrid className="w-6 h-6" />,
    defaultContent: {
      title: 'Our Services',
      description: 'What we offer',
      layout: 'grid',
      services: [],
    },
  },
  {
    type: 'courses',
    name: 'Courses',
    description: 'Showcase your courses and training programs',
    icon: <GraduationCap className="w-6 h-6" />,
    defaultContent: {
      title: 'Our Courses',
      description: 'Learn from industry experts',
      layout: 'grid',
      courses: [],
    },
  },
  {
    type: 'testimonials',
    name: 'Testimonials',
    description: 'Display client testimonials and reviews',
    icon: <MessageSquare className="w-6 h-6" />,
    defaultContent: {
      title: 'What Our Clients Say',
      testimonials: [],
      layout: 'carousel',
    },
  },
  {
    type: 'about',
    name: 'About',
    description: 'Tell your story',
    icon: <FileText className="w-6 h-6" />,
    defaultContent: {
      title: 'About Us',
      description: 'Our story and mission',
      image: null,
      richText: '',
    },
  },
  {
    type: 'team',
    name: 'Team',
    description: 'Introduce your team members',
    icon: <Users className="w-6 h-6" />,
    defaultContent: {
      title: 'Our Team',
      description: 'Meet the people behind our success',
      members: [],
      layout: 'grid',
    },
  },
  {
    type: 'contact',
    name: 'Contact',
    description: 'Contact form and information',
    icon: <Mail className="w-6 h-6" />,
    defaultContent: {
      title: 'Get In Touch',
      description: 'We would love to hear from you',
      email: '',
      phone: '',
      address: '',
      enableForm: true,
    },
  },
  {
    type: 'pricing',
    name: 'Pricing',
    description: 'Display your pricing plans',
    icon: <DollarSign className="w-6 h-6" />,
    defaultContent: {
      title: 'Pricing Plans',
      description: 'Choose the perfect plan for you',
      plans: [],
    },
  },
  {
    type: 'features',
    name: 'Features',
    description: 'Highlight key features',
    icon: <Zap className="w-6 h-6" />,
    defaultContent: {
      title: 'Key Features',
      description: 'Everything you need',
      features: [],
      layout: 'list',
    },
  },
  {
    type: 'cta',
    name: 'Call to Action',
    description: 'Encourage visitor action',
    icon: <Award className="w-6 h-6" />,
    defaultContent: {
      title: 'Ready to Get Started?',
      description: 'Join thousands of satisfied customers',
      buttonText: 'Start Now',
      backgroundColor: '#3B82F6',
    },
  },
  {
    type: 'faq',
    name: 'FAQ',
    description: 'Answer common questions',
    icon: <HelpCircle className="w-6 h-6" />,
    defaultContent: {
      title: 'Frequently Asked Questions',
      questions: [],
    },
  },
  {
    type: 'gallery',
    name: 'Gallery',
    description: 'Display image gallery',
    icon: <Image className="w-6 h-6" />,
    defaultContent: {
      title: 'Our Work',
      images: [],
      columns: 3,
    },
  },
  {
    type: 'video',
    name: 'Video Gallery',
    description: 'Showcase YouTube videos',
    icon: <Play className="w-6 h-6" />,
    defaultContent: {
      title: 'Our Videos',
      description: 'Watch our latest content',
      videos: [],
      layout: 'grid',
      columns: 3,
      accentColor: '#FF0000',
    },
  },
  {
    type: 'newsletter',
    name: 'Newsletter',
    description: 'Email subscription & news updates',
    icon: <BookOpen className="w-6 h-6" />,
    defaultContent: {
      title: 'Subscribe to Our Newsletter',
      description: 'Stay updated with our latest news',
      placeholder: 'Enter your email',
      buttonText: 'Subscribe',
      showNewsUpdates: true,
      newsUpdates: [],
    },
  },
  {
    type: 'blog',
    name: 'Blog',
    description: 'Share articles with images and content',
    icon: <FileText className="w-6 h-6" />,
    defaultContent: {
      title: 'Our Blog',
      description: 'Latest insights and articles',
      layout: 'grid',
      posts: [],
    },
  },
];

interface SectionLibraryProps {
  onSelectTemplate: (template: SectionTemplate) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SectionLibrary: React.FC<SectionLibraryProps> = ({
  onSelectTemplate,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Add Section</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {SECTION_TEMPLATES.map((template) => (
              <button
                key={template.type}
                onClick={() => {
                  onSelectTemplate(template);
                  onClose();
                }}
                className="group p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 group-hover:bg-blue-100 rounded-lg mb-3 transition-colors">
                  <div className="text-gray-600 group-hover:text-blue-600">
                    {template.icon}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                <p className="text-xs text-gray-600">{template.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export { SECTION_TEMPLATES };
export default SectionLibrary;
