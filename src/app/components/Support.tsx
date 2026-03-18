import React from 'react';

interface SupportProps {
  onBack?: () => void;
}

export const Support: React.FC<SupportProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={onBack || (() => { window.location.href = '/'; })}
            className="text-gray-600 hover:text-gray-900 transition text-sm"
          >
            ← Back to Specialistly
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-bold text-lg text-gray-900">Specialistly</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">Support Center</h1>
        <p className="text-gray-500 mb-10">We're here to help. Reach out to us through any of the channels below.</p>

        {/* Support Options Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Email Support */}
          <div className="border border-gray-200 rounded-xl p-6">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Email Support</h3>
            <p className="text-gray-600 text-sm mb-3">Send us an email and we'll get back to you promptly.</p>
            <a href="mailto:support@specialistly.com" className="text-gray-900 font-medium underline text-sm">
              support@specialistly.com
            </a>
          </div>

          {/* Live Chat */}
          <div className="border border-gray-200 rounded-xl p-6">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">In-App Messaging</h3>
            <p className="text-gray-600 text-sm mb-3">Logged-in users can message our support team directly from the Messages section in the dashboard.</p>
            <span className="text-gray-500 text-sm">Available within your account</span>
          </div>

          {/* Knowledge Base */}
          <div className="border border-gray-200 rounded-xl p-6">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Help Documentation</h3>
            <p className="text-gray-600 text-sm mb-3">Browse guides on using the platform — courses, consulting, page builder, Zoom integration, and more.</p>
            <a href="mailto:support@specialistly.com?subject=Help%20Request" className="text-gray-900 font-medium underline text-sm">
              Request a guide
            </a>
          </div>

          {/* Report an Issue */}
          <div className="border border-gray-200 rounded-xl p-6">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Report an Issue</h3>
            <p className="text-gray-600 text-sm mb-3">Found a bug or experiencing a problem? Let us know so we can fix it.</p>
            <a href="mailto:support@specialistly.com?subject=Bug%20Report" className="text-gray-900 font-medium underline text-sm">
              Report a bug
            </a>
          </div>
        </div>

        {/* Support Hours & SLA */}
        <div className="border border-gray-200 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Support Hours & Response Times</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Support Team Hours</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Monday – Friday<br />
                9:00 AM – 6:00 PM IST<br />
                (Indian Standard Time, UTC+5:30)
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">First Response SLA</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We aim to respond to all support requests within <strong>24 hours</strong> on business days. Critical issues (service outages, payment problems) are prioritized for faster response.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Resolution Time</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Most issues are resolved within <strong>48 hours</strong>. Complex issues involving third-party integrations (Zoom, Razorpay) may take up to 5 business days.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "How do I connect my Zoom account?",
                a: "Go to Settings → scroll to the Zoom Integration section → click \"Connect Zoom Account\". You'll be redirected to Zoom to authorize the connection. Once approved, Zoom meetings will be automatically created for your booked consulting sessions."
              },
              {
                q: "How do I disconnect my Zoom account?",
                a: "Go to Settings → Zoom Integration section → click \"Disconnect\". Your existing meetings will remain active, but new bookings will no longer auto-create Zoom meetings."
              },
              {
                q: "I'm having trouble with my Zoom meetings not being created.",
                a: "Ensure your Zoom account is still connected in Settings. If the connection was lost, reconnect your Zoom account. If the issue persists, email support@specialistly.com with your account email and we'll investigate."
              },
              {
                q: "How do I get a refund for a course or consulting session?",
                a: "Refund policies are set by individual specialists. Please contact the specialist directly through the Messages section, or email support@specialistly.com if you need help mediating."
              },
              {
                q: "How do I delete my account?",
                a: "Email support@specialistly.com with your registered email address and request account deletion. We'll process your request within 5 business days."
              },
            ].map((item, i) => (
              <details key={i} className="border border-gray-200 rounded-lg">
                <summary className="px-6 py-4 cursor-pointer font-medium text-gray-900 text-sm hover:bg-gray-50 transition">
                  {item.q}
                </summary>
                <p className="px-6 pb-4 text-gray-600 text-sm leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Contact Form CTA */}
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Still need help?</h2>
          <p className="text-gray-600 text-sm mb-4">Our support team is ready to assist you.</p>
          <a
            href="mailto:support@specialistly.com"
            className="inline-block bg-gray-900 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-800 transition"
          >
            Contact Support
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Specialistly. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Support;
