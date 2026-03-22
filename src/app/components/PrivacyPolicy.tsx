import React from 'react';

interface PrivacyPolicyProps {
  onBack?: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
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
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-10">Last updated: March 18, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              Specialistly ("we," "our," or "us") operates the website <strong>specialistly.com</strong> and its subdomains (the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. By using Specialistly, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.1 Personal Information</h3>
            <p className="text-gray-600 leading-relaxed">When you register for an account or use our Service, we may collect:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1.5 mt-2">
              <li>Name and email address</li>
              <li>Profile information (bio, photo, professional details)</li>
              <li>Payment information (processed securely via Razorpay; we do not store full card details)</li>
              <li>Communication data (messages between specialists and customers)</li>
              <li>Content you create (courses, services, website pages)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-1.5 mt-2">
              <li>Browser type and version</li>
              <li>IP address</li>
              <li>Pages visited and time spent on those pages</li>
              <li>Device information</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.3 Third-Party Service Data</h3>
            <p className="text-gray-600 leading-relaxed">
              When you connect third-party services (such as Zoom or Google), we receive limited data as authorized through OAuth, including your email address and the ability to perform authorized actions (e.g., creating Zoom meetings). We store access tokens securely and only use them for the purposes you have authorized.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p className="text-gray-600 leading-relaxed">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1.5 mt-2">
              <li>Provide, operate, and maintain the Service</li>
              <li>Process transactions and send transaction-related communications</li>
              <li>Create and manage your account</li>
              <li>Enable specialists to offer courses, consulting, and services</li>
              <li>Facilitate communication between specialists and customers</li>
              <li>Create Zoom meetings for booked consulting sessions (when authorized)</li>
              <li>Send administrative emails (account verification, password resets, booking confirmations)</li>
              <li>Improve and personalize the Service</li>
              <li>Respond to support requests</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Third-Party Integrations</h2>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">4.1 Zoom</h3>
            <p className="text-gray-600 leading-relaxed">
              Specialistly integrates with Zoom to enable specialists to automatically create video meetings for consulting sessions. When a specialist connects their Zoom account, we request the following OAuth scopes:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1.5 mt-2">
              <li><strong>meeting:write:meeting</strong> — To create meetings when a customer books a session</li>
              <li><strong>meeting:read:meeting</strong> — To read meeting details and provide join links</li>
              <li><strong>user:read:user</strong> — To verify the connected Zoom account</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-2">
              We securely store OAuth tokens and only use them to create meetings on behalf of the specialist. Customers receive a meeting join link; they are not required to authorize any Zoom scopes. Specialists can disconnect their Zoom account at any time from their settings.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">4.2 Payment Processing</h3>
            <p className="text-gray-600 leading-relaxed">
              Payment processing is handled by Razorpay. We do not store complete credit card numbers or financial account details. Please refer to Razorpay's privacy policy for information on how they handle your payment data.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">4.3 Media Storage</h3>
            <p className="text-gray-600 leading-relaxed">
              Uploaded media (images, videos) may be stored using Cloudflare services. These files are associated with your account and are used to deliver content you create on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Data Sharing and Disclosure</h2>
            <p className="text-gray-600 leading-relaxed">We do not sell your personal information. We may share information in the following circumstances:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1.5 mt-2">
              <li><strong>Between specialists and customers:</strong> When a customer books a session or enrolls in a course, relevant contact and booking details are shared with the specialist.</li>
              <li><strong>Service providers:</strong> We use third-party service providers (hosting, email, payment, video conferencing) who process data on our behalf.</li>
              <li><strong>Legal requirements:</strong> We may disclose information if required by law or in response to valid legal processes.</li>
              <li><strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Data Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information, including encryption of data in transit (HTTPS/TLS), secure token storage, and access controls. However, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide you the Service. You may request deletion of your account and associated data by contacting us at the email below. Some information may be retained as required by law or for legitimate business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed">Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1.5 mt-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing of your information</li>
              <li>Withdraw consent for third-party integrations (e.g., disconnect Zoom)</li>
              <li>Data portability</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-2">
              To exercise any of these rights, please contact us at <a href="mailto:support@specialistly.com" className="text-gray-900 underline">support@specialistly.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              We use essential cookies and local storage to maintain your authentication session. We do not use third-party tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Children's Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              Specialistly is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will take steps to delete it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify users of material changes by posting the updated policy on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">12. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-gray-600 mt-2">
              <strong>Email:</strong> <a href="mailto:support@specialistly.com" className="text-gray-900 underline">support@specialistly.com</a><br />
              <strong>Website:</strong> <a href="https://specialistly.com" className="text-gray-900 underline">https://specialistly.com</a>
            </p>
          </section>
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

export default PrivacyPolicy;
