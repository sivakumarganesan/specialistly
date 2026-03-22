import React, { useState, useEffect } from 'react';
import { PageSection } from '@/app/hooks/usePageBuilder';

interface NewsUpdate {
  id: string;
  title: string;
  content: string;
  date: string;
  image?: string;
}

export const NewsletterSectionPreview: React.FC<{ section: PageSection }> = ({ section }) => {
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const newsUpdates = (section.content?.newsUpdates || []) as NewsUpdate[];
  const showNewsUpdates = section.content?.showNewsUpdates !== false;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubscribeStatus('loading');
    try {
      const apiUrl = (import.meta.env.VITE_API_URL as string) || '/api';
      const websiteId = section.websiteId || section.content?.websiteId;

      if (!websiteId) {
        setStatusMessage('Subscription configured. Contact the site owner.');
        setSubscribeStatus('success');
        setEmail('');
        return;
      }

      const response = await fetch(`${apiUrl}/newsletter/${websiteId}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        setStatusMessage(data.message || 'Successfully subscribed!');
        setSubscribeStatus('success');
        setEmail('');
      } else {
        setStatusMessage(data.message || 'Subscription failed');
        setSubscribeStatus('error');
      }
    } catch {
      setStatusMessage('Something went wrong. Please try again.');
      setSubscribeStatus('error');
    }
  };

  // Fetch published news updates for public viewing
  const [fetchedUpdates, setFetchedUpdates] = useState<NewsUpdate[]>([]);
  useEffect(() => {
    const websiteId = section.websiteId || section.content?.websiteId;
    if (!websiteId || newsUpdates.length > 0) return;

    const fetchUpdates = async () => {
      try {
        const apiUrl = (import.meta.env.VITE_API_URL as string) || '/api';
        const response = await fetch(`${apiUrl}/newsletter/${websiteId}/updates`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) setFetchedUpdates(data.data || []);
        }
      } catch {
        // silently fail
      }
    };
    fetchUpdates();
  }, [section.websiteId, section.content?.websiteId, newsUpdates.length]);

  const displayUpdates = newsUpdates.length > 0 ? newsUpdates : fetchedUpdates;

  return (
    <div className="py-16 px-4" style={{ backgroundColor: section.content?.backgroundColor || '#eff6ff' }}>
      <div className="max-w-4xl mx-auto">
        {/* Subscribe Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: section.content?.titleColor || undefined }}>{section.title || 'Newsletter'}</h2>
          {section.description && (
            <p className="mb-8 text-lg" style={{ color: section.content?.descriptionColor || '#4b5563' }}>{section.description}</p>
          )}
          <form onSubmit={handleSubscribe} className="flex gap-2 max-w-lg mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setSubscribeStatus('idle'); }}
              placeholder={section.content?.placeholder || 'Enter your email'}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
            <button
              type="submit"
              disabled={subscribeStatus === 'loading'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {subscribeStatus === 'loading' ? 'Subscribing...' : (section.content?.buttonText || 'Subscribe')}
            </button>
          </form>
          {subscribeStatus === 'success' && (
            <p className="text-green-600 text-sm mt-3">{statusMessage}</p>
          )}
          {subscribeStatus === 'error' && (
            <p className="text-red-600 text-sm mt-3">{statusMessage}</p>
          )}
        </div>

        {/* News Updates */}
        {showNewsUpdates && displayUpdates.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold mb-6 text-center">Latest Updates</h3>
            <div className="space-y-6">
              {displayUpdates.map((update) => (
                <article key={update.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className={update.image ? 'md:flex' : ''}>
                    {update.image && (
                      <div className="md:w-64 flex-shrink-0">
                        <img src={update.image} alt={update.title} className="w-full h-48 md:h-full object-cover" />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500">{update.date}</span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{update.title}</h4>
                      <p className="text-gray-600 text-sm">{update.content}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsletterSectionPreview;
