import React from 'react';

interface ZoomDocumentationProps {
  onBack?: () => void;
}

export const ZoomDocumentation: React.FC<ZoomDocumentationProps> = ({ onBack }) => {
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
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
          Specialistly Zoom Integration
        </h1>
        <p className="text-gray-500 mb-4">Documentation for using Zoom with Specialistly</p>
        <p className="text-sm text-gray-400 mb-10">Last updated: March 2026</p>

        {/* Table of Contents */}
        <nav className="bg-gray-50 rounded-xl p-6 mb-12">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Contents</h2>
          <ul className="space-y-2 text-sm">
            <li><a href="#overview" className="text-blue-600 hover:underline">Overview</a></li>
            <li><a href="#prerequisites" className="text-blue-600 hover:underline">Prerequisites</a></li>
            <li><a href="#adding-the-app" className="text-blue-600 hover:underline">Adding the App</a></li>
            <li><a href="#personal-consulting" className="text-blue-600 hover:underline">Personal Consulting (1:1 Booking)</a></li>
            <li><a href="#usage" className="text-blue-600 hover:underline">Usage Guide</a></li>
            <li><a href="#removing-the-app" className="text-blue-600 hover:underline">Removing the App</a></li>
            <li><a href="#troubleshooting" className="text-blue-600 hover:underline">Troubleshooting</a></li>
          </ul>
        </nav>

        {/* Overview */}
        <section id="overview" className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Specialistly is a platform that connects specialists (consultants, educators, professionals) with customers
            seeking their expertise. The Zoom integration enables specialists to automatically create Zoom meetings
            for their <strong>Personal Consulting</strong> (1:1) sessions, so both parties get a seamless video conferencing experience.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            Specialists create <strong>Personal Consulting</strong> offerings via <strong>Offerings → Add Service → 1:1 Consulting</strong>,
            configure their weekly availability in <strong>Settings → Manage Availability</strong>, and the platform automatically
            generates bookable time slots. Customers browse available slots on the specialist's branded website and book appointments
            directly.
          </p>
          <p className="text-gray-700 leading-relaxed">
            When a customer books a consulting slot, a Zoom meeting is automatically generated and the meeting link
            is shared with both the specialist and the customer via email and the platform dashboard. No manual meeting setup is required.
          </p>
        </section>

        {/* Prerequisites */}
        <section id="prerequisites" className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Prerequisites</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2 leading-relaxed">
            <li>A Specialistly account registered as a <strong>Specialist</strong></li>
            <li>A Zoom account (free or paid)</li>
            <li>At least one <strong>Personal Consulting (1:1)</strong> service created under <strong>Offerings</strong></li>
            <li>Availability configured via <strong>Settings → Manage Availability</strong></li>
          </ul>
        </section>

        {/* Adding the App */}
        <section id="adding-the-app" className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Adding the App</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Follow these steps to connect your Zoom account to Specialistly:
          </p>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Log in to Specialistly</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Go to <a href="https://specialistly.com" className="text-blue-600 hover:underline">specialistly.com</a> and
                  log in with your specialist account. If you don't have an account yet, sign up and select "Specialist" as your account type.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Navigate to Settings</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Click <strong>Settings</strong> in the left sidebar of your dashboard.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Find the Zoom Integration section</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Scroll down on the Settings page until you see the <strong>Zoom Integration</strong> section.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Click "Connect Zoom Account"</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Click the <strong>Connect Zoom Account</strong> button. You will be redirected to Zoom's authorization page.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Authorize the App on Zoom</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  On the Zoom authorization page, review the permissions requested and click <strong>Allow</strong> to grant
                  Specialistly access to create meetings on your behalf. The permissions requested are:
                </p>
                <ul className="list-disc list-inside text-gray-600 text-sm mt-2 space-y-1 ml-4">
                  <li><strong>View your meetings</strong> — to check existing meeting schedules</li>
                  <li><strong>Manage your meetings</strong> — to create and update meetings for booked consultations</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">6</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Confirmation</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  After authorizing, you'll be redirected back to Specialistly. The Settings page will now show your Zoom
                  account as <strong>Connected</strong> with a green status indicator. New consultation bookings will
                  automatically include a Zoom meeting link.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Personal Consulting */}
        <section id="personal-consulting" className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Personal Consulting (1:1 Booking)</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Personal Consulting is the core offering type on Specialistly. It allows specialists to offer 1:1 consultation
            sessions that customers can book directly from the specialist's branded website or profile.
          </p>

          <div className="space-y-6">
            {/* Step 1: Create offering */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Create a Personal Consulting Offering</h3>
              <ol className="list-decimal list-inside text-gray-600 text-sm mt-2 space-y-2 ml-4 leading-relaxed">
                <li>Go to <strong>Offerings</strong> in the left sidebar.</li>
                <li>Click <strong>Add Service</strong>.</li>
                <li>Select <strong>1:1 Consulting</strong> as the service type.</li>
                <li>Fill in the title, description, duration, price, and currency (USD or INR).</li>
                <li>Optionally upload a thumbnail image.</li>
                <li>Click <strong>Create</strong> to save. The service is created in <strong>Active</strong> status.</li>
              </ol>
              <p className="text-gray-500 text-sm mt-3">
                When you activate a consulting service, bookable time slots are automatically generated based on your availability schedule.
              </p>
            </div>

            {/* Step 2: Configure availability */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Configure Your Availability</h3>
              <ol className="list-decimal list-inside text-gray-600 text-sm mt-2 space-y-2 ml-4 leading-relaxed">
                <li>Go to <strong>Settings → Manage Availability</strong>.</li>
                <li>Set your weekly schedule — choose which days you're available and the time ranges for each day.</li>
                <li>Configure slot duration (30, 45, 60, or 90 minutes), buffer time between sessions, and break periods.</li>
                <li>Set booking rules: minimum notice, maximum advance booking window, and cancellation deadline.</li>
                <li>Click <strong>Save</strong>. Bookable consulting slots are automatically regenerated to match your updated schedule.</li>
              </ol>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> Whenever you update your availability, all future unbooked slots are automatically regenerated.
                  Existing bookings are never affected — only unused slots are refreshed.
                </p>
              </div>
            </div>

            {/* Step 3: Branded website booking */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 3: Customers Book from Your Website</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                Customers can book a personal consultation from your branded website in two ways:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-2 ml-4 leading-relaxed">
                <li><strong>Services Section:</strong> Your consulting services appear on the Services page with a <strong>Book Now</strong> button that opens the consulting calendar.</li>
                <li><strong>Book Appointment Section:</strong> You can add a dedicated <strong>Book Appointment</strong> section to any page via the Page Builder. This shows a prominent call-to-action that opens the booking calendar.</li>
              </ul>
              <p className="text-gray-600 text-sm leading-relaxed mt-3">
                The booking calendar displays your available time slots. The customer selects a date, picks a slot, provides their name and email, and confirms the booking.
              </p>
            </div>

            {/* Step 4: Zoom meeting auto-created */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 4: Zoom Meeting is Auto-Created</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                When a booking is confirmed, the following happens automatically:
              </p>
              <ol className="list-decimal list-inside text-gray-600 text-sm space-y-2 ml-4 leading-relaxed">
                <li>A Zoom meeting is created for the booked date and time using the specialist's connected Zoom account.</li>
                <li>The Zoom meeting link, meeting ID, and passcode are attached to the booking record.</li>
                <li>Both the specialist and the customer receive email confirmations with the meeting details.</li>
                <li>The booking appears on the specialist's dashboard with the Zoom link ready to use.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Usage */}
        <section id="usage" className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Usage Guide</h2>

          <div className="space-y-8">
            {/* Feature: Auto meeting creation */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Automatic Meeting Creation</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                Once Zoom is connected, meetings are created automatically whenever a customer books a consulting slot.
              </p>
              <p className="text-sm text-gray-500"><strong>How it works:</strong></p>
              <ol className="list-decimal list-inside text-gray-600 text-sm mt-2 space-y-1 ml-4">
                <li>A customer visits your branded website and books an available consulting slot via the Services page or a Book Appointment section.</li>
                <li>Specialistly automatically creates a Zoom meeting for the scheduled date and time.</li>
                <li>Both you and the customer receive the Zoom meeting link via email confirmation.</li>
                <li>At the scheduled time, both parties join using the provided Zoom link.</li>
              </ol>
            </div>

            {/* Feature: Consulting Slots */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Managing Availability &amp; Consulting Slots</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                Set your weekly availability so the platform can generate bookable consulting slots for your customers.
              </p>
              <p className="text-sm text-gray-500"><strong>Steps:</strong></p>
              <ol className="list-decimal list-inside text-gray-600 text-sm mt-2 space-y-1 ml-4">
                <li>Go to <strong>Settings → Manage Availability</strong> in your dashboard.</li>
                <li>Set your available days, time ranges, slot duration, and buffer time.</li>
                <li>Click Save — bookable slots are automatically generated for the next 90 days.</li>
                <li>Create a <strong>1:1 Consulting</strong> service under <strong>Offerings → Add Service</strong>.</li>
                <li>Your branded website's Services page and any Book Appointment sections will display the booking calendar.</li>
                <li>When a customer books a slot, a Zoom meeting is automatically scheduled.</li>
              </ol>
              <p className="text-gray-500 text-sm mt-3">
                Updating your availability at any time will regenerate all future unbooked slots to match the new schedule.
              </p>
            </div>

            {/* Feature: Meeting Management */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Viewing Upcoming Meetings</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                View all your scheduled consulting sessions and their meeting links.
              </p>
              <p className="text-sm text-gray-500"><strong>Steps:</strong></p>
              <ol className="list-decimal list-inside text-gray-600 text-sm mt-2 space-y-1 ml-4">
                <li>Go to <strong>Dashboard</strong> to see your upcoming bookings.</li>
                <li>Each booking shows the Zoom meeting link, date, time, and customer details.</li>
                <li>Click the meeting link to join at the scheduled time.</li>
              </ol>
            </div>

            {/* Feature: Page Builder & Website */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Professional Website</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                Build a branded website where customers can learn about your services and book consultations.
              </p>
              <p className="text-sm text-gray-500"><strong>Features:</strong></p>
              <ul className="list-disc list-inside text-gray-600 text-sm mt-2 space-y-1 ml-4">
                <li>Drag-and-drop page builder with hero, about, services, gallery, Book Appointment, and more sections.</li>
                <li>Custom subdomain (yourname.specialistly.com).</li>
                <li>Consulting booking calendar embedded on your Services page and Book Appointment sections.</li>
                <li>Course creation and sales.</li>
              </ul>
            </div>

            {/* Feature: Courses */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Courses & Learning</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                Create and sell online courses to share your expertise at scale.
              </p>
              <p className="text-sm text-gray-500"><strong>Steps:</strong></p>
              <ol className="list-decimal list-inside text-gray-600 text-sm mt-2 space-y-1 ml-4">
                <li>Go to <strong>Courses</strong> in the sidebar and click <strong>Create Course</strong>.</li>
                <li>Add course details, lessons, and pricing.</li>
                <li>Publish the course — customers can purchase and access it from your profile or website.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Removing the App */}
        <section id="removing-the-app" className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Removing the App</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            You can disconnect the Zoom integration at any time. Here's how:
          </p>

          <div className="space-y-6 mb-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Disconnect from Specialistly</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Go to <strong>Settings</strong> → scroll to the <strong>Zoom Integration</strong> section → click <strong>"Disconnect"</strong>.
                  This immediately revokes Specialistly's access to your Zoom account.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Remove from Zoom (optional)</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  You can also remove the app directly from your Zoom account:
                </p>
                <ol className="list-decimal list-inside text-gray-600 text-sm mt-2 space-y-1 ml-4">
                  <li>Log in to <a href="https://marketplace.zoom.us" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Zoom Marketplace</a>.</li>
                  <li>Click <strong>Manage → Installed Apps</strong>.</li>
                  <li>Find <strong>Specialistly</strong> and click <strong>Uninstall</strong>.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* De-authorization implications */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">What happens when you disconnect</h3>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-2 leading-relaxed">
              <li><strong>Existing meetings are not deleted</strong> — any Zoom meetings that were already created will remain in your Zoom account. You can manually delete them from Zoom if needed.</li>
              <li><strong>New bookings won't include Zoom links</strong> — future consultation bookings will no longer auto-generate Zoom meeting links. You'll need to provide meeting links manually or reconnect Zoom.</li>
              <li><strong>Your Specialistly account is unaffected</strong> — your profile, courses, consulting slots, and all other data remain intact. Only the Zoom connection is removed.</li>
              <li><strong>Tokens are deleted</strong> — Specialistly immediately deletes your Zoom OAuth tokens (access token and refresh token) from our servers upon disconnection.</li>
            </ul>
          </div>

          {/* Data handling */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Data Handling on Removal</h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              When you disconnect the Zoom integration or uninstall the app:
            </p>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-2 leading-relaxed">
              <li>Your Zoom OAuth credentials are permanently deleted from Specialistly's servers.</li>
              <li>No Zoom user data is retained after disconnection.</li>
              <li>Meeting IDs stored in booking records are retained for historical reference but are no longer linked to your Zoom account.</li>
              <li>You can request full account and data deletion by emailing <a href="mailto:support@specialistly.com" className="text-blue-600 hover:underline">support@specialistly.com</a>.</li>
            </ul>
          </div>
        </section>

        {/* Troubleshooting */}
        <section id="troubleshooting" className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Troubleshooting</h2>
          <div className="space-y-4">
            {[
              {
                q: "I connected Zoom but meetings are not being created for new bookings.",
                a: "Your Zoom connection may have expired. Go to Settings → Zoom Integration and check the status. If it shows disconnected, click 'Connect Zoom Account' again to re-authorize. If the issue persists, disconnect and reconnect your Zoom account."
              },
              {
                q: "I see 'Zoom meeting creation failed' when a customer books.",
                a: "This can happen if your Zoom account has reached its meeting limit (free accounts allow up to 100 meetings). Upgrade your Zoom plan or delete old meetings. Also verify your Zoom account is still active."
              },
              {
                q: "The meeting link doesn't work.",
                a: "Ensure the meeting hasn't been manually deleted from your Zoom account. If deleted, the link becomes invalid. You can create a new Zoom meeting manually and share the link with your customer via the Messages section."
              },
              {
                q: "I disconnected Zoom by accident. Will I lose my bookings?",
                a: "No. Disconnecting Zoom only removes the ability to auto-create new meetings. All existing bookings, meetings already created, and your account data remain unchanged. Simply reconnect Zoom in Settings to restore automatic meeting creation."
              },
              {
                q: "Can I use a different Zoom account?",
                a: "Yes. Disconnect your current Zoom account in Settings, then click 'Connect Zoom Account' again and log in with the new Zoom account you want to use."
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
        </section>

        {/* Support CTA */}
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Need more help?</h2>
          <p className="text-gray-600 text-sm mb-4">Contact our support team for assistance.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href="mailto:support@specialistly.com"
              className="inline-block bg-gray-900 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-800 transition"
            >
              Email Support
            </a>
            <a
              href="https://specialistly.com?page=support"
              className="inline-block border border-gray-300 text-gray-900 px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition"
            >
              Visit Support Center
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-4">Support hours: Mon–Fri, 9 AM – 6 PM IST | First response within 24 hours</p>
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

export default ZoomDocumentation;
