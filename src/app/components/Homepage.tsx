import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import {
  ChevronRight,
  Search,
  Calendar,
  CreditCard,
  Users,
  TrendingUp,
  Star,
  CheckCircle,
  Play,
  ArrowRight,
} from 'lucide-react';

interface HomepageProps {
  onSignup: () => void;
  onLogin: () => void;
}

export function Homepage({ onSignup, onLogin }: HomepageProps) {
  const [activeTab, setActiveTab] = useState<'specialist' | 'customer'>('specialist');

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-lg text-gray-900">Specialistly</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition">
                How It Works
              </a>
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition">
                For Specialists
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={onLogin}>
                Sign In
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={onSignup}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">
              Transform Your Expertise Into Income
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              Connect with Specialists. Book Sessions. Grow Together.
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed">
              Specialistly is the all-in-one platform where specialists manage bookings,
              payments, and client relationships—while customers discover and book the
              perfect expert for their needs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                onClick={onSignup}
              >
                Start Free <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Watch Demo
              </Button>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full border-2 border-white"
                  />
                ))}
              </div>
              <span>
                <strong className="text-gray-900">500+</strong> specialists already earning
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-purple-400 via-pink-400 to-purple-600 rounded-2xl h-96 flex items-center justify-center text-white text-center p-8">
              <div className="space-y-4">
                <div className="text-6xl">📅</div>
                <p className="text-lg font-semibold">Manage Bookings Seamlessly</p>
                <p className="text-sm opacity-90">From inquiry to payment, all in one place</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Tabs */}
      <section id="how-it-works" className="bg-gray-50 py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you're offering services or searching for expertise, Specialistly
              makes it simple
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex justify-center mb-16">
            <div className="inline-flex bg-white rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setActiveTab('specialist')}
                className={`px-6 py-3 rounded-md font-medium transition flex items-center gap-2 ${
                  activeTab === 'specialist'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                For Specialists
              </button>
              <button
                onClick={() => setActiveTab('customer')}
                className={`px-6 py-3 rounded-md font-medium transition flex items-center gap-2 ${
                  activeTab === 'customer'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Search className="w-4 h-4" />
                For Customers
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="grid md:grid-cols-3 gap-8">
            {activeTab === 'specialist' ? (
              <>
                <div className="bg-white rounded-xl p-8 border border-gray-200 hover:border-purple-300 transition">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                    <span className="text-2xl">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Create Your Profile</h3>
                  <p className="text-gray-600">
                    Set up your specialist profile with services, pricing, availability, and bio. Showcase your expertise.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-8 border border-gray-200 hover:border-purple-300 transition">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                    <span className="text-2xl">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Receive Bookings</h3>
                  <p className="text-gray-600">
                    Get notifications when customers book your services. Manage your calendar effortlessly.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-8 border border-gray-200 hover:border-purple-300 transition">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                    <span className="text-2xl">3</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Grow & Earn</h3>
                  <p className="text-gray-600">
                    Build your reputation, get paid automatically, and scale your business with our tools.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white rounded-xl p-8 border border-gray-200 hover:border-purple-300 transition">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                    <span className="text-2xl">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Browse Specialists</h3>
                  <p className="text-gray-600">
                    Search and filter specialists by service, expertise, price, and availability. Read reviews.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-8 border border-gray-200 hover:border-purple-300 transition">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                    <span className="text-2xl">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Book & Pay</h3>
                  <p className="text-gray-600">
                    Choose a time slot, book instantly, and pay securely. Get instant confirmation.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-8 border border-gray-200 hover:border-purple-300 transition">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                    <span className="text-2xl">3</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Meet & Connect</h3>
                  <p className="text-gray-600">
                    Join your session online. Message directly with the specialist. Build your network.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful tools to manage your specialist business or find the right expert
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {[
            {
              icon: Calendar,
              title: 'Smart Scheduling',
              description: 'Automated booking system with balance and reminders',
            },
            {
              icon: CreditCard,
              title: 'Secure Payments',
              description: 'Instant payouts with transparent pricing and no hidden fees',
            },
            {
              icon: Users,
              title: 'Client Management',
              description: 'Manage profiles, history, and direct messaging in one place',
            },
            {
              icon: TrendingUp,
              title: 'Analytics & Growth',
              description: 'Track earnings, bookings, and build your reputation',
            },
          ].map((feature, idx) => (
            <div key={idx} className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-600">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="bg-gradient-to-br from-purple-50 to-blue-50 py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Trusted by Specialists Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See why specialists choose Specialistly to grow their business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Johnson',
                role: 'Business Coach',
                quote:
                  'Specialistly helped me organize my coaching practice. I went from 5 clients to 25 in 3 months!',
                rating: 5,
              },
              {
                name: 'Michael Chen',
                role: 'Fitness Consultant',
                quote:
                  'The automated booking system saved me hours every week. My clients love the seamless experience.',
                rating: 5,
              },
              {
                name: 'Emma Rodriguez',
                role: 'Career Coach',
                quote:
                  'Professional platform, reliable support, and fair pricing. Highly recommend to any specialist.',
                rating: 5,
              },
            ].map((testimonial, idx) => (
              <Card key={idx} className="p-8">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">{testimonial.quote}</p>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-12 md:p-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of specialists earning on their own terms. It's free to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100"
              onClick={onSignup}
            >
              As a Specialist
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-purple-700"
              onClick={onSignup}
            >
              As a Customer
            </Button>
          </div>
          <p className="text-purple-100 text-sm mt-6">
            No credit card required • Free to join • Start earning today
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-white mb-4">Specialistly</h3>
              <p className="text-sm">
                The platform connecting specialists with customers who need their expertise.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Features
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-sm">
              &copy; 2026 Specialistly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
