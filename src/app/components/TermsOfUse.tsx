import React from 'react';

interface TermsOfUseProps {
  onBack?: () => void;
}

export const TermsOfUse: React.FC<TermsOfUseProps> = ({ onBack }) => {
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
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">Terms of Use</h1>
        <p className="text-gray-500 mb-10">Last updated: March 18, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By accessing or using Specialistly ("the Service"), operated at <strong>specialistly.com</strong> and its subdomains, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p className="text-gray-600 leading-relaxed">
              Specialistly is an online platform that enables specialists (professionals, consultants, educators, coaches) to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1.5 mt-2">
              <li>Create and sell online courses (self-paced and cohort-based)</li>
              <li>Offer consulting services with online booking and Zoom meeting integration</li>
              <li>Build branded websites with a drag-and-drop page builder</li>
              <li>Manage customers, bookings, and communications</li>
              <li>Accept payments through integrated payment providers</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-2">
              Customers can browse specialists, purchase courses, book consulting sessions, and interact with specialists through the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Account Registration</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-1.5">
              <li>You must provide accurate, complete, and current information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 18 years of age to use the Service.</li>
              <li>You may not create multiple accounts for fraudulent purposes.</li>
              <li>You are responsible for all activities that occur under your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Specialist Responsibilities</h2>
            <p className="text-gray-600 leading-relaxed">If you use the Service as a specialist, you agree to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1.5 mt-2">
              <li>Provide accurate descriptions of your services and courses</li>
              <li>Fulfill booked consulting sessions and course obligations</li>
              <li>Maintain appropriate professional qualifications for the services you offer</li>
              <li>Respond to customer inquiries in a timely manner</li>
              <li>Comply with all applicable laws and regulations related to your profession</li>
              <li>Not use the platform to sell prohibited, illegal, or fraudulent services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Customer Responsibilities</h2>
            <p className="text-gray-600 leading-relaxed">If you use the Service as a customer, you agree to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1.5 mt-2">
              <li>Provide accurate information when booking sessions or purchasing courses</li>
              <li>Attend booked sessions on time or cancel according to the specialist's cancellation policy</li>
              <li>Not misuse, redistribute, or resell course content without authorization</li>
              <li>Treat specialists and other users with respect</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Payments and Refunds</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-1.5">
              <li>All payments are processed securely through Razorpay. Specialistly does not store full payment card details.</li>
              <li>Prices for services and courses are set by individual specialists.</li>
              <li>Specialistly may charge a platform commission on transactions, as disclosed to specialists during onboarding.</li>
              <li>Refund policies are determined by individual specialists. Customers should review the specialist's refund policy before making a purchase.</li>
              <li>Specialistly reserves the right to mediate disputes between specialists and customers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Third-Party Integrations</h2>
            <p className="text-gray-600 leading-relaxed">
              The Service integrates with third-party platforms including but not limited to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1.5 mt-2">
              <li><strong>Zoom:</strong> For creating video conferencing meetings for consulting sessions. By connecting your Zoom account, you authorize Specialistly to create meetings on your behalf.</li>
              <li><strong>Razorpay:</strong> For payment processing. Use of payment services is subject to Razorpay's terms of service.</li>
              <li><strong>Cloudflare:</strong> For media storage and content delivery.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-2">
              Your use of third-party services is subject to those services' own terms and privacy policies. Specialistly is not responsible for the practices of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Intellectual Property</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-1.5">
              <li>The Service and its original content (excluding user-generated content) are owned by Specialistly and protected by copyright and other intellectual property laws.</li>
              <li>Specialists retain ownership of their own course content, service descriptions, and uploaded media.</li>
              <li>By uploading content to the platform, you grant Specialistly a non-exclusive license to display, distribute, and promote your content within the Service.</li>
              <li>Customers may not copy, distribute, or reproduce course materials without the specialist's written permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Prohibited Activities</h2>
            <p className="text-gray-600 leading-relaxed">You may not:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1.5 mt-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with or disrupt the Service or its servers</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Scrape, crawl, or harvest data from the Service without permission</li>
              <li>Use the Service to send spam or unsolicited communications</li>
              <li>Engage in fraudulent transactions or misrepresent your qualifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Termination</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to suspend or terminate your account at our discretion, without prior notice, for conduct that we determine violates these Terms or is harmful to other users, us, or third parties, or for any other reason. You may also delete your account at any time by contacting support.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Disclaimers</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-1.5">
              <li>The Service is provided "as is" and "as available" without warranties of any kind, either express or implied.</li>
              <li>Specialistly does not guarantee the quality, accuracy, or suitability of any specialist's services or courses.</li>
              <li>Specialistly is a platform connecting specialists with customers and is not a party to the service agreements between them.</li>
              <li>We do not guarantee uninterrupted or error-free operation of the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">12. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              To the maximum extent permitted by law, Specialistly shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Service. Our total liability for any claims arising under these Terms shall not exceed the amount paid by you to Specialistly in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">13. Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms will be subject to the exclusive jurisdiction of the courts in Chennai, India.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">14. Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We may modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">15. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have questions about these Terms of Use, please contact us at:
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

export default TermsOfUse;
