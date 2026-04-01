import { Button } from '@/app/components/ui/button';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CreditCard,
  Globe,
  Headphones,
  LayoutDashboard,
  MessageSquare,
  Video,
  Users,
} from 'lucide-react';

interface HomepageProps {
  onSignup: () => void;
  onLogin: () => void;
}

export function Homepage({ onSignup, onLogin }: HomepageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">Specialistly</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition font-medium">
                Features
              </a>
              <a href="#creators" className="text-sm text-gray-600 hover:text-gray-900 transition font-medium">
                Creator Stories
              </a>
              <a href="#get-started" className="text-sm text-gray-600 hover:text-gray-900 transition font-medium">
                Get Started
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={onLogin} className="text-gray-700 font-medium">
                Sign In
              </Button>
              <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg" onClick={onSignup}>
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.08] tracking-tight">
                Everything to sell online.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                  All in one place.
                </span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Sell courses, offer consulting, manage bookings, and build your branded website
                — Specialistly gives you everything you need to turn expertise into a business.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-8 py-6 text-base font-semibold flex items-center gap-2"
                  onClick={onSignup}
                >
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-sm text-gray-500">
                No credit card required. Free forever to get started.
              </p>
            </div>

            {/* Product Cards */}
            <div className="relative hidden lg:block">
              <div className="relative h-[480px]">
                {/* Card 1 - Online Courses */}
                <div className="absolute left-0 top-8 w-72 bg-sky-100 rounded-2xl p-6 shadow-lg -rotate-6 hover:rotate-0 transition-transform duration-500">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Online Courses</h3>
                  <p className="text-gray-700 text-sm mb-6">
                    Create and sell self-paced or live cohort courses with built-in video hosting.
                  </p>
                  <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-sky-300" />
                      <span className="text-white text-sm font-medium">Self-Paced Course</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Video className="w-5 h-5 text-sky-300" />
                      <span className="text-white text-sm font-medium">Live Cohort Course</span>
                    </div>
                  </div>
                </div>

                {/* Card 2 - Branded Website */}
                <div className="absolute left-36 top-0 w-72 bg-amber-200 rounded-2xl p-6 shadow-lg rotate-2 hover:rotate-0 transition-transform duration-500 z-10">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Website</h3>
                  <p className="text-gray-700 text-sm mb-6">
                    Build a professional branded page in minutes with our page builder.
                  </p>
                  <div className="bg-amber-300 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-800 rounded-full" />
                        <div className="w-2 h-2 bg-gray-800 rounded-full" />
                        <div className="w-2 h-2 bg-gray-800 rounded-full" />
                      </div>
                      <div className="flex-1 h-2 bg-amber-400 rounded" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-16 bg-amber-400/60 rounded-lg" />
                      <div className="h-16 bg-amber-400/60 rounded-lg" />
                    </div>
                  </div>
                </div>

                {/* Card 3 - Consulting */}
                <div className="absolute right-0 top-16 w-72 bg-purple-200 rounded-2xl p-6 shadow-lg rotate-6 hover:rotate-0 transition-transform duration-500">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Consulting</h3>
                  <p className="text-gray-700 text-sm mb-6">
                    Offer 1-on-1 sessions with Zoom integration, calendar slots, and secure payments.
                  </p>
                  <div className="bg-purple-300 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-800 rounded-full" />
                        <div className="w-2 h-2 bg-gray-800 rounded-full" />
                        <div className="w-2 h-2 bg-gray-800 rounded-full" />
                      </div>
                    </div>
                    <div className="h-16 bg-purple-400/50 rounded-lg flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-gray-800 opacity-60" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Curved separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60V30C360 0 720 0 1080 30C1260 45 1380 55 1440 60V60H0Z" fill="#f9fafb"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">
              Everything you need to build{' '}
              <br className="hidden md:block" />
              your online business
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From courses and consulting to payments and marketing — all the tools,
              no juggling multiple platforms.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Online Courses',
                description: 'Create self-paced courses with video lessons, or run live cohort programs with Zoom integration.',
                color: 'bg-sky-100 text-sky-700',
              },
              {
                icon: Calendar,
                title: 'Consulting & Bookings',
                description: 'Let clients book time slots on your calendar. Automatic reminders, Zoom links, and payment collection.',
                color: 'bg-amber-100 text-amber-700',
              },
              {
                icon: Globe,
                title: 'Branded Website',
                description: 'Build a beautiful, professional page to showcase your services with our drag-and-drop page builder.',
                color: 'bg-purple-100 text-purple-700',
              },
              {
                icon: CreditCard,
                title: 'Secure Payments',
                description: 'Accept payments via Stripe and Razorpay with per-specialist credentials. Transparent, no hidden fees.',
                color: 'bg-green-100 text-green-700',
              },
              {
                icon: Users,
                title: 'Customer Management',
                description: 'Track your students and clients, manage enrollments, and communicate directly through messaging.',
                color: 'bg-rose-100 text-rose-700',
              },
              {
                icon: LayoutDashboard,
                title: 'Dashboard & Analytics',
                description: 'See bookings, enrollments, and revenue at a glance. Know what\'s working and grow smarter.',
                color: 'bg-gray-100 text-gray-900',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300 border border-gray-100"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-5`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Creator Stories - Hidden for now, can be enabled later */}
      {/* <section id="creators" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">
              Their businesses finally found{' '}
              <br className="hidden md:block" />
              an all-in-one home. So can yours.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Creators, coaches, consultants, and many more grow their business on Specialistly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: 'Priya Sharma',
                role: 'Wellness Coach',
                description: 'Priya built her wellness coaching brand online, reaching 200+ students with her live cohort meditation courses.',
                gradient: 'from-sky-200 to-sky-300',
                emoji: '🧘‍♀️',
              },
              {
                name: 'James Wilson',
                role: 'Business Consultant',
                description: 'James turned his corporate consulting experience into a thriving 1-on-1 practice with automated booking and payments.',
                gradient: 'from-amber-200 to-amber-300',
                emoji: '💼',
              },
              {
                name: 'Aisha Patel',
                role: 'Fitness Expert',
                description: 'Aisha runs weekly live fitness classes and self-paced workout programs, serving 500+ active members.',
                gradient: 'from-purple-200 to-purple-300',
                emoji: '💪',
              },
              {
                name: 'David Chen',
                role: 'Tech Educator',
                description: 'David launched his coding bootcamp with cohort-based courses and grew his community to 1,000 developers.',
                gradient: 'from-rose-200 to-amber-200',
                emoji: '💻',
              },
            ].map((creator, idx) => (
              <div key={idx} className="group">
                <div className={`bg-gradient-to-br ${creator.gradient} rounded-2xl h-64 flex items-center justify-center mb-5 overflow-hidden group-hover:shadow-lg transition`}>
                  <span className="text-7xl group-hover:scale-110 transition-transform duration-300">{creator.emoji}</span>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Creator Story</p>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{creator.name}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{creator.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* What you can sell */}
      <section className="bg-gray-50 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">
              One platform. Multiple ways to earn.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you teach, coach, or consult — Specialistly has the tools for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Self-Paced Courses',
                description: 'Upload video lessons, organize modules, and let students learn at their own pace. Includes certificates.',
                bg: 'bg-white',
              },
              {
                icon: Video,
                title: 'Live Cohort Courses',
                description: 'Run live classes with automatic Zoom meeting creation. Set schedules, manage cohorts, and engage students.',
                bg: 'bg-white',
              },
              {
                icon: Headphones,
                title: '1-on-1 Consulting',
                description: 'Set your availability, let clients book slots, and get paid automatically. Integrated Zoom for sessions.',
                bg: 'bg-white',
              },
            ].map((item, idx) => (
              <div key={idx} className={`${item.bg} rounded-2xl p-10 text-center border border-gray-100 hover:shadow-lg transition`}>
                <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="get-started" className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Start creating today.
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join specialists who are building their online business with Specialistly.
            It's free to start — no credit card needed.
          </p>
          <Button
            size="lg"
            className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-10 py-6 text-base font-semibold"
            onClick={onSignup}
          >
            Sign Up Free <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="font-bold text-xl text-gray-900">Specialistly</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
                The all-in-one platform for specialists to sell courses, manage consulting, and grow their online business.
              </p>
              {/* Social Links */}
              <div className="flex gap-4 mt-6">
                {['X', 'In', 'YT'].map((label, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 text-xs font-bold cursor-pointer transition"
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="text-gray-600 hover:text-gray-900 transition">Features</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition">Courses</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition">Consulting</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition">Page Builder</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition">About</a></li>
                <li><a href="#creators" className="text-gray-600 hover:text-gray-900 transition">Creator Stories</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition">Blog</a></li>
                <li><a href="/?page=support" className="text-gray-600 hover:text-gray-900 transition">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/?page=privacy" className="text-gray-600 hover:text-gray-900 transition">Privacy Policy</a></li>
                <li><a href="/?page=terms" className="text-gray-600 hover:text-gray-900 transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Specialistly. All rights reserved.
            </p>
            <p className="text-sm text-gray-400">
              Made for creators, by creators.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
