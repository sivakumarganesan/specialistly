import React, { useState, useEffect } from 'react';
import { Loader, Menu, X, MapPin, Phone, Facebook, Instagram, Youtube, Twitter, Linkedin, LogIn, BookOpen, User, LogOut, Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import { pageBuilderAPI, authAPI } from '@/app/api/apiClient';
import { PublicPageViewer } from './PublicPageViewer';
import { PublicMyLearning } from './PublicMyLearning';
import { PublicCourseViewer } from './PublicCourseViewer';
import { getSubdomainInfo } from '@/app/utils/subdomainUtils';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "/api";

type ActiveView = 'pages' | 'my-learning' | 'course-viewer';

interface PublicWebsiteProps {
  subdomain?: string;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({ subdomain: propSubdomain }) => {
  const [website, setWebsite] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPageSlug, setCurrentPageSlug] = useState<string>('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<any>(null);

  // Auth state
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [authUser, setAuthUser] = useState<{ id: string; name: string; email: string } | null>(() => {
    try { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; } catch { return null; }
  });
  const isLoggedIn = !!(authToken && authUser);

  // View routing
  const [activeView, setActiveView] = useState<ActiveView>('pages');
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);

  // Login modal
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTab, setLoginTab] = useState<'login' | 'signup'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Change password modal
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showChangePasswordFields, setShowChangePasswordFields] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordMessage, setChangePasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Listen for auth changes from other components (e.g. PublicCourseCheckout)
  useEffect(() => {
    const onStorage = () => {
      const token = localStorage.getItem('authToken');
      setAuthToken(token);
      try { const u = localStorage.getItem('user'); setAuthUser(u ? JSON.parse(u) : null); } catch { setAuthUser(null); }
    };
    window.addEventListener('storage', onStorage);
    // Also poll once on focus (same-tab localStorage changes don't fire storage event)
    const onFocus = () => onStorage();
    window.addEventListener('focus', onFocus);

    // Listen for "Go to My Learning" from checkout modal
    const onNavigateMyLearning = () => {
      onStorage(); // Refresh auth state from localStorage
      setActiveView('my-learning');
      window.scrollTo(0, 0);
    };
    window.addEventListener('navigate-my-learning', onNavigateMyLearning);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('navigate-my-learning', onNavigateMyLearning);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setAuthError(data.error || 'Login failed'); return; }
      setAuthToken(data.token);
      setAuthUser({ id: data.user.id, name: data.user.name, email: data.user.email });
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userType', data.userType || 'customer');
      setShowLoginModal(false);
      setLoginEmail(''); setLoginPassword('');
      setActiveView('my-learning');
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally { setAuthLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (signupPassword !== signupConfirm) { setAuthError('Passwords do not match'); return; }
    if (signupPassword.length < 6) { setAuthError('Password must be at least 6 characters'); return; }
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword, confirmPassword: signupConfirm, isSpecialist: false, userType: 'customer' }),
      });
      const data = await res.json();
      if (!res.ok) { setAuthError(data.error || 'Signup failed'); return; }
      setAuthToken(data.token);
      setAuthUser({ id: data.user.id, name: data.user.name, email: data.user.email });
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userType', data.userType || 'customer');
      setShowLoginModal(false);
      setSignupName(''); setSignupEmail(''); setSignupPassword(''); setSignupConfirm('');
      setActiveView('my-learning');
    } catch (err: any) {
      setAuthError(err.message || 'Signup failed');
    } finally { setAuthLoading(false); }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setAuthUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    setActiveView('pages');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordMessage(null);

    // Validation
    if (!changePasswordData.currentPassword || !changePasswordData.newPassword || !changePasswordData.confirmPassword) {
      setChangePasswordMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    if (changePasswordData.newPassword.length < 6) {
      setChangePasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setChangePasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (changePasswordData.currentPassword === changePasswordData.newPassword) {
      setChangePasswordMessage({ type: 'error', text: 'New password must be different from current password' });
      return;
    }

    setChangePasswordLoading(true);
    try {
      const response = await authAPI.changePassword(
        authToken || '',
        changePasswordData.currentPassword,
        changePasswordData.newPassword,
        changePasswordData.confirmPassword
      );

      if (response.success) {
        setChangePasswordMessage({ type: 'success', text: '✓ Your password has been changed successfully!' });
        setChangePasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setShowChangePasswordModal(false);
          setChangePasswordMessage(null);
        }, 2000);
      } else {
        setChangePasswordMessage({ type: 'error', text: response.error || 'Failed to change password' });
      }
    } catch (err) {
      setChangePasswordMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to change password'
      });
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const navigateToMyLearning = () => {
    if (!isLoggedIn) { setShowLoginModal(true); return; }
    setActiveView('my-learning');
    setIsMobileNavOpen(false);
    window.scrollTo(0, 0);
  };

  const navigateToPages = () => {
    setActiveView('pages');
    setIsMobileNavOpen(false);
    window.scrollTo(0, 0);
  };

  const openCourseViewer = (enrollmentId: string) => {
    setSelectedEnrollmentId(enrollmentId);
    setActiveView('course-viewer');
    window.scrollTo(0, 0);
  };

  const subdomainInfo = getSubdomainInfo();
  const actualSubdomain = propSubdomain || subdomainInfo.subdomain;

  // Load website data on mount or subdomain change
  useEffect(() => {
    if (!actualSubdomain) {
      setError('No subdomain found');
      setIsLoading(false);
      return;
    }

    const loadWebsite = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch website and pages data - use relative path to respect same-origin
        const response = await fetch(
          `/api/page-builder/public/websites/${actualSubdomain}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Website not found');
          }
          throw new Error('Failed to load website');
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to load website');
        }

        setWebsite(data.data.website);
        const pagesList = data.data.pages || [];
        setPages(pagesList);
        
        // Set home page or first page as default
        const homePage = pagesList.find((p: any) => p.isHomePage) || pagesList[0];
        if (homePage) {
          setCurrentPageSlug(homePage.slug);
          setCurrentPage(homePage);
        }
      } catch (err) {
        console.error('Error loading public website:', err);
        setError(err instanceof Error ? err.message : 'Failed to load website');
      } finally {
        setIsLoading(false);
      }
    };

    loadWebsite();
  }, [actualSubdomain]);

  // Handle page navigation
  const handlePageClick = (page: any) => {
    setCurrentPageSlug(page.slug);
    setCurrentPage(page);
    setActiveView('pages');
    setIsMobileNavOpen(false);
    window.scrollTo(0, 0);
  };

  // Intercept internal link clicks (e.g. CTA buttons with href="/about-us")
  // so they navigate within the SPA instead of doing a full page reload
  const handleInternalLinkClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
    if (!target) return;
    const href = target.getAttribute('href');
    if (!href || !href.startsWith('/') || href.startsWith('//')) return;
    // Strip leading slash to get the slug
    const slug = href.replace(/^\/+/, '');
    const matchedPage = pages.find((p: any) => p.slug === slug);
    if (matchedPage) {
      e.preventDefault();
      handlePageClick(matchedPage);
    }
  };

  // Auth buttons for navbars
  const renderAuthButton = (color: string, textColor: string) => {
    if (isLoggedIn) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={navigateToMyLearning}
            className={`flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80 ${activeView === 'my-learning' ? 'opacity-100' : 'opacity-80'}`}
            style={{ color: textColor }}
          >
            <BookOpen className="w-4 h-4" /> My Learning
          </button>
          <div className="relative group">
            <button className="flex items-center gap-1.5 text-sm font-medium opacity-80 hover:opacity-100 transition" style={{ color: textColor }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: color, color: '#fff' }}>
                {authUser?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 min-w-[160px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <p className="px-3 py-1.5 text-xs text-gray-500 truncate border-b">{authUser?.email}</p>
              <button onClick={() => { setShowChangePasswordModal(true); setChangePasswordMessage(null); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" /> Change Password
              </button>
              <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <button
        onClick={() => { setAuthError(null); setShowLoginModal(true); }}
        className="flex items-center gap-1.5 text-sm font-medium opacity-80 hover:opacity-100 transition"
        style={{ color: textColor }}
      >
        <LogIn className="w-4 h-4" /> Login
      </button>
    );
  };

  // Change password modal
  const renderChangePasswordModal = () => {
    if (!showChangePasswordModal) return null;
    const brandColor = website?.branding?.primaryColor || '#3B82F6';
    
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowChangePasswordModal(false)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5" /> Change Password
            </h2>
            <button onClick={() => setShowChangePasswordModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Error/Success Message */}
            {changePasswordMessage && (
              <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                changePasswordMessage.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{changePasswordMessage.text}</span>
              </div>
            )}

            {/* Current Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Current Password</label>
              <div className="relative">
                <input
                  type={showChangePasswordFields.current ? 'text' : 'password'}
                  value={changePasswordData.currentPassword}
                  onChange={(e) => setChangePasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                  disabled={changePasswordLoading}
                  className="w-full border rounded-lg px-3 py-2 text-sm pr-10 focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': brandColor } as any}
                />
                <button
                  type="button"
                  onClick={() => setShowChangePasswordFields(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-2.5 text-gray-400"
                >
                  {showChangePasswordFields.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">New Password</label>
              <div className="relative">
                <input
                  type={showChangePasswordFields.new ? 'text' : 'password'}
                  value={changePasswordData.newPassword}
                  onChange={(e) => setChangePasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  disabled={changePasswordLoading}
                  className="w-full border rounded-lg px-3 py-2 text-sm pr-10 focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': brandColor } as any}
                />
                <button
                  type="button"
                  onClick={() => setShowChangePasswordFields(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-2.5 text-gray-400"
                >
                  {showChangePasswordFields.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">Min. 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Confirm Password</label>
              <div className="relative">
                <input
                  type={showChangePasswordFields.confirm ? 'text' : 'password'}
                  value={changePasswordData.confirmPassword}
                  onChange={(e) => setChangePasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  disabled={changePasswordLoading}
                  className="w-full border rounded-lg px-3 py-2 text-sm pr-10 focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': brandColor } as any}
                />
                <button
                  type="button"
                  onClick={() => setShowChangePasswordFields(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-2.5 text-gray-400"
                >
                  {showChangePasswordFields.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={changePasswordLoading}
                className="flex-1 text-white font-medium py-2 rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: brandColor }}
              >
                {changePasswordLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Update Password
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
                disabled={changePasswordLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Login/Signup modal
  const renderLoginModal = () => {
    if (!showLoginModal) return null;
    const brandColor = website?.branding?.primaryColor || '#3B82F6';
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLoginModal(false)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">{loginTab === 'login' ? 'Sign In' : 'Create Account'}</h2>
            <button onClick={() => setShowLoginModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg">
            <button onClick={() => { setLoginTab('login'); setAuthError(null); }} className={`flex-1 text-sm font-medium py-1.5 rounded-md transition ${loginTab === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Login</button>
            <button onClick={() => { setLoginTab('signup'); setAuthError(null); }} className={`flex-1 text-sm font-medium py-1.5 rounded-md transition ${loginTab === 'signup' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Sign Up</button>
          </div>

          {authError && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{authError}</div>}

          {loginTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <input type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:outline-none" style={{ '--tw-ring-color': brandColor } as any} />
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm pr-10 focus:ring-2 focus:outline-none" style={{ '--tw-ring-color': brandColor } as any} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
              <button type="submit" disabled={authLoading} className="w-full text-white font-medium py-2 rounded-lg text-sm disabled:opacity-50" style={{ backgroundColor: brandColor }}>
                {authLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3">
              <input type="text" placeholder="Full name" value={signupName} onChange={e => setSignupName(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:outline-none" style={{ '--tw-ring-color': brandColor } as any} />
              <input type="email" placeholder="Email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:outline-none" style={{ '--tw-ring-color': brandColor } as any} />
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm pr-10 focus:ring-2 focus:outline-none" style={{ '--tw-ring-color': brandColor } as any} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
              <input type="password" placeholder="Confirm password" value={signupConfirm} onChange={e => setSignupConfirm(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:outline-none" style={{ '--tw-ring-color': brandColor } as any} />
              <button type="submit" disabled={authLoading} className="w-full text-white font-medium py-2 rounded-lg text-sm disabled:opacity-50" style={{ backgroundColor: brandColor }}>
                {authLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading website...</p>
        </div>
      </div>
    );
  }

  if (error || !website) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Website Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'This website is not available'}</p>
          <p className="text-sm text-gray-500">
            Subdomain: <code className="bg-gray-200 px-2 py-1 rounded">{actualSubdomain}</code>
          </p>
        </div>
      </div>
    );
  }

  // Show empty state if no pages
  if (!pages || pages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{website?.branding?.siteName || 'Welcome'}</h1>
          <p className="text-gray-600 mb-4">No pages published yet</p>
          <p className="text-sm text-gray-500">
            {website?.branding?.tagline || 'Coming soon'}
          </p>
        </div>
      </div>
    );
  }

  // Extract topbar and navbar sections from the home page (or first page)
  const homePage = pages.find((p: any) => p.isHomePage) || pages[0];
  const homePageSections = homePage?.sections || [];
  const topBarSection = homePageSections.find((s: any) => s.type === 'topbar');
  const navBarSection = homePageSections.find((s: any) => s.type === 'navbar');
  const hasCustomHeader = !!(topBarSection || navBarSection);

  const socialIcons: Record<string, React.ReactNode> = {
    facebook: <Facebook className="w-3.5 h-3.5" />,
    instagram: <Instagram className="w-3.5 h-3.5" />,
    youtube: <Youtube className="w-3.5 h-3.5" />,
    twitter: <Twitter className="w-3.5 h-3.5" />,
    linkedin: <Linkedin className="w-3.5 h-3.5" />,
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: `'${website?.branding?.fontFamily || 'Inter'}', system-ui, -apple-system, sans-serif` }}>
      {/* Google Fonts */}
      {website?.branding?.fontFamily && !['system-ui', 'Georgia'].includes(website.branding.fontFamily) && (
        <link
          href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(website.branding.fontFamily)}:wght@300;400;500;600;700&display=swap`}
          rel="stylesheet"
        />
      )}

      {/* ─── Custom Header (TopBar + NavBar sections) ─── */}
      {hasCustomHeader ? (
        <header className="sticky top-0 z-40">
          {/* Top Bar */}
          {topBarSection && (() => {
            const tc = topBarSection.content || {};
            const bgColor = tc.backgroundColor || '#00acc1';
            const textColor = tc.textColor || '#ffffff';
            const socialLinks: { platform: string; url: string }[] = tc.socialLinks || [];
            return (
              <div style={{ backgroundColor: bgColor, color: textColor }} className="py-2 px-4 text-xs sm:text-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    {tc.address && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tc.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:opacity-80"
                        style={{ color: textColor }}
                      >
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{tc.address}</span>
                      </a>
                    )}
                    {tc.phone && (
                      <a href={`tel:${tc.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:opacity-80" style={{ color: textColor }}>
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{tc.phone}</span>
                      </a>
                    )}
                  </div>
                  {socialLinks.length > 0 && (
                    <div className="flex items-center gap-3">
                      {socialLinks.map((link, i) => (
                        <a key={i} href={link.url || '#'} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" style={{ color: textColor }}>
                          {socialIcons[link.platform] || <span className="text-xs">{link.platform}</span>}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Nav Bar */}
          {(() => {
            const nc = navBarSection?.content || {};
            const navBgColor = nc.backgroundColor || website?.branding?.headerBgColor || '#ffffff';
            const navTextColor = nc.textColor || '#333333';
            const navLinkColor = nc.linkColor || navTextColor;
            const brandColor = nc.brandColor || website?.branding?.primaryColor || '#00acc1';
            const brandName = nc.brandName || website?.branding?.siteName || 'Website';
            const logoUrl = nc.logoUrl || website?.branding?.logo || '';
            const logoDisplayMode = nc.logoDisplayMode || 'both';
            const showLogo = logoUrl && (logoDisplayMode === 'both' || logoDisplayMode === 'logo' || (logoDisplayMode === 'auto' && logoUrl));
            const showText = logoDisplayMode === 'both' || logoDisplayMode === 'text' || (logoDisplayMode === 'auto' && !logoUrl);
            // Merge section-defined menu items with page links
            const sectionMenuItems: { label: string; url: string }[] = nc.menuItems || [];
            const hasMenuItems = sectionMenuItems.length > 0;

            return (
              <nav style={{ backgroundColor: navBgColor }} className="border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {showLogo && <img src={logoUrl} alt={brandName} className="h-12 w-auto object-contain" />}
                    {showText && <span className="text-lg sm:text-xl font-bold tracking-tight" style={{ color: brandColor }}>{brandName}</span>}
                  </div>

                  {/* Desktop nav */}
                  <div className="hidden md:flex items-center gap-6">
                    {/* Section-defined menu items */}
                    {sectionMenuItems.map((item, i) => (
                      <a key={`menu-${i}`} href={item.url || '#'} className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: navLinkColor }}>
                        {item.label}
                      </a>
                    ))}
                    {/* Page links as text menu */}
                    {pages.map((page) => (
                      <button
                        key={page._id}
                        onClick={() => handlePageClick(page)}
                        className={`text-sm font-medium transition-opacity ${currentPageSlug === page.slug && activeView === 'pages' ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
                        style={{ color: currentPageSlug === page.slug && activeView === 'pages' ? brandColor : navLinkColor }}
                      >
                        {page.title}
                      </button>
                    ))}
                    {/* Auth button */}
                    {renderAuthButton(brandColor, navLinkColor)}
                  </div>

                  {/* Mobile hamburger */}
                  {(pages.length > 0 || hasMenuItems) && (
                    <button className="md:hidden p-1" style={{ color: navTextColor }} onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}>
                      {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                  )}
                </div>

                {/* Mobile menu */}
                {isMobileNavOpen && (
                  <div className="md:hidden border-t border-gray-200 px-4 py-3 space-y-1" style={{ backgroundColor: navBgColor }}>
                    {sectionMenuItems.map((item, i) => (
                      <a key={`mob-menu-${i}`} href={item.url || '#'} className="block text-sm font-medium py-2 hover:opacity-80" style={{ color: navLinkColor }}>
                        {item.label}
                      </a>
                    ))}
                    {pages.map((page) => (
                      <button
                        key={page._id}
                        onClick={() => handlePageClick(page)}
                        className={`block w-full text-left text-sm font-medium py-2 ${currentPageSlug === page.slug && activeView === 'pages' ? '' : 'opacity-80'}`}
                        style={{ color: currentPageSlug === page.slug && activeView === 'pages' ? brandColor : navLinkColor }}
                      >
                        {page.title}
                      </button>
                    ))}
                    {/* Mobile auth */}
                    <div className="pt-2 border-t border-gray-200 mt-2">
                      {isLoggedIn ? (
                        <>
                          <button onClick={navigateToMyLearning} className="block w-full text-left text-sm font-medium py-2" style={{ color: navLinkColor }}>
                            <BookOpen className="w-4 h-4 inline mr-1.5" />My Learning
                          </button>
                          <button onClick={handleLogout} className="block w-full text-left text-sm font-medium py-2 text-red-500">
                            <LogOut className="w-4 h-4 inline mr-1.5" />Sign out
                          </button>
                        </>
                      ) : (
                        <button onClick={() => { setAuthError(null); setShowLoginModal(true); setIsMobileNavOpen(false); }} className="block w-full text-left text-sm font-medium py-2" style={{ color: navLinkColor }}>
                          <LogIn className="w-4 h-4 inline mr-1.5" />Login
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </nav>
            );
          })()}
        </header>
      ) : (
      /* ─── Fallback Header (original branded header with text menu) ─── */
      <header
        className="shadow-sm sticky top-0 z-40"
        style={{ 
          backgroundColor: website?.branding?.headerBgColor || website?.branding?.primaryColor || '#3B82F6',
        }}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-shrink-0">
            {website?.branding?.logo && (
              <img src={website.branding.logo} alt={website?.branding?.siteName} className="h-12 w-auto object-contain" />
            )}
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: website?.branding?.headerTextColor || '#ffffff' }}>
              {website?.branding?.siteName || 'Website'}
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-6 flex-1 justify-end">
            {pages.map((page) => {
              const headerText = website?.branding?.headerTextColor || '#ffffff';
              const isActive = currentPageSlug === page.slug && activeView === 'pages';
              return (
                <button
                  key={page._id}
                  onClick={() => handlePageClick(page)}
                  className="text-sm font-medium transition-opacity"
                  style={{
                    color: headerText,
                    opacity: isActive ? 1 : 0.75,
                    borderBottom: isActive ? `2px solid ${headerText}` : '2px solid transparent',
                    paddingBottom: '2px',
                  }}
                >
                  {page.title}
                </button>
              );
            })}
            {/* Auth button */}
            {renderAuthButton(website?.branding?.primaryColor || '#3B82F6', website?.branding?.headerTextColor || '#ffffff')}
          </div>

          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="md:hidden p-2"
            style={{ color: website?.branding?.headerTextColor || '#ffffff' }}
          >
            {isMobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {isMobileNavOpen && (
          <div className="md:hidden border-t border-white border-opacity-20 px-4 py-3 space-y-1" style={{ backgroundColor: website?.branding?.headerBgColor || website?.branding?.primaryColor || '#1f2937' }}>
            {pages.map((page) => (
              <button
                key={page._id}
                onClick={() => handlePageClick(page)}
                className="block w-full text-left px-4 py-2 text-sm font-medium transition-opacity"
                style={{
                  color: website?.branding?.headerTextColor || '#ffffff',
                  opacity: currentPageSlug === page.slug && activeView === 'pages' ? 1 : 0.7,
                }}
              >
                {page.title}
              </button>
            ))}
            {/* Mobile auth */}
            <div className="pt-2 border-t border-white border-opacity-20 mt-2">
              {isLoggedIn ? (
                <>
                  <button onClick={navigateToMyLearning} className="block w-full text-left px-4 py-2 text-sm font-medium" style={{ color: website?.branding?.headerTextColor || '#ffffff' }}>
                    <BookOpen className="w-4 h-4 inline mr-1.5" />My Learning
                  </button>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm font-medium opacity-80" style={{ color: website?.branding?.headerTextColor || '#ffffff' }}>
                    <LogOut className="w-4 h-4 inline mr-1.5" />Sign out
                  </button>
                </>
              ) : (
                <button onClick={() => { setAuthError(null); setShowLoginModal(true); setIsMobileNavOpen(false); }} className="block w-full text-left px-4 py-2 text-sm font-medium" style={{ color: website?.branding?.headerTextColor || '#ffffff' }}>
                  <LogIn className="w-4 h-4 inline mr-1.5" />Login
                </button>
              )}
            </div>
          </div>
        )}
      </header>
      )}

      {/* Login Modal */}
      {renderLoginModal()}

      {/* Change Password Modal */}
      {renderChangePasswordModal()}

      {/* Page Content */}
      <main className="flex-1" onClick={activeView === 'pages' ? handleInternalLinkClick : undefined}>
        {activeView === 'pages' && currentPageSlug && currentPage && (
          <PublicPageViewer
            subdomain={actualSubdomain || ''}
            pageSlug={currentPageSlug}
            pageData={currentPage}
          />
        )}
        {activeView === 'my-learning' && isLoggedIn && (
          <PublicMyLearning
            specialistEmail={website?.creatorEmail || ''}
            onOpenCourse={openCourseViewer}
            brandColor={website?.branding?.primaryColor}
          />
        )}
        {activeView === 'course-viewer' && isLoggedIn && selectedEnrollmentId && (
          <PublicCourseViewer
            enrollmentId={selectedEnrollmentId}
            onBack={() => setActiveView('my-learning')}
            brandColor={website?.branding?.primaryColor}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: website?.branding?.footerBgColor || '#111827', color: website?.branding?.footerTextColor || '#ffffff' }} className="py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-2">{website?.branding?.siteName}</h3>
              <p className="text-sm opacity-60">{website?.branding?.tagline}</p>
            </div>
            <div>
              <h4 className="font-bold mb-2">Pages</h4>
              <ul className="space-y-1">
                {pages.map((page) => (
                  <li key={page._id}>
                    <button
                      onClick={() => handlePageClick(page)}
                      className="opacity-60 hover:opacity-100 transition text-sm"
                    >
                      {page.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-2">About</h4>
              <p className="text-sm opacity-60">
                Built with Specialistly Branded Page Builder
              </p>
            </div>
          </div>
          <div className="border-t mt-8 pt-8" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
            <p className="text-sm text-center opacity-60">
              © {new Date().getFullYear()} {website?.branding?.siteName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicWebsite;
