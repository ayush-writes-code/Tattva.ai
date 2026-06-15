import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, FileText, EyeOff } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-primary py-16 px-6 sm:px-12 md:px-24 max-w-4xl mx-auto">
      <div className="mb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <h1 className="text-4xl sm:text-5xl font-bold font-syne tracking-tight mb-4 text-primary">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted">Last updated: June 15, 2026</p>
      </div>

      <div className="space-y-12 text-sm sm:text-base leading-relaxed text-muted">
        {/* Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-10">
          <div className="p-6 bg-surface border border-border rounded-2xl flex flex-col gap-3">
            <EyeOff className="w-6 h-6 text-primary" />
            <h3 className="font-semibold text-primary font-syne">No File Storage</h3>
            <p className="text-xs text-muted">
              Uploaded files are processed in-memory and never permanently saved to our databases or storage buckets.
            </p>
          </div>
          <div className="p-6 bg-surface border border-border rounded-2xl flex flex-col gap-3">
            <Lock className="w-6 h-6 text-primary" />
            <h3 className="font-semibold text-primary font-syne">Data Security</h3>
            <p className="text-xs text-muted">
              End-to-end transit encryption secures your media transfers directly to our forensic execution environments.
            </p>
          </div>
          <div className="p-6 bg-surface border border-border rounded-2xl flex flex-col gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <h3 className="font-semibold text-primary font-syne">Anonymized Processing</h3>
            <p className="text-xs text-muted">
              Our AI analysis engine runs independently. No user-identifiable profile data is sent to the models.
            </p>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold font-syne text-primary">1. Overview & Commitment</h2>
          <p>
            At Tattva.ai, we are committed to defending digital truth while strictly protecting your privacy. This Privacy Policy details how we handle information, specifically addressing file uploads, authentication data, and usage tracking. 
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold font-syne text-primary">2. Media Upload & Processing</h2>
          <p>
            The core feature of Tattva.ai is multi-modal deepfake and synthetic media detection. We understand the sensitive nature of your media:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-primary">Transient Processing:</strong> When you upload an image, video, or audio file, it is processed in-memory or stored temporarily on our FastAPI/Hugging Face processing node for the duration of the scan.
            </li>
            <li>
              <strong className="text-primary">No Retention:</strong> Once the neural network analysis and forensic evaluations are completed, the file is immediately discarded. We do <strong className="text-primary">not</strong> write your media files to any persistent cloud storage or database buckets.
            </li>
            <li>
              <strong className="text-primary">Anonymized Inference:</strong> Your user identity is never shared with the AI models. The API request forwards the file with a service key only.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold font-syne text-primary">3. Information We Collect</h2>
          <p>
            To manage user limits and provide authentication, we use Supabase to collect and store the following:
          </p>
          <div className="overflow-x-auto my-4">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-primary">
                  <th className="p-3 font-semibold font-syne">Category</th>
                  <th className="p-3 font-semibold font-syne">Data Collected</th>
                  <th className="p-3 font-semibold font-syne">Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="p-3 font-medium text-primary">Authentication</td>
                  <td className="p-3">Email address, OAuth provider token, unique User ID</td>
                  <td className="p-3">To allow secure sign-ins via Google, GitHub, or Discord.</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-3 font-medium text-primary">Profile Details</td>
                  <td className="p-3">Nickname, avatar image URL</td>
                  <td className="p-3">To customize your dashboard experience.</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-3 font-medium text-primary">Usage Metrics</td>
                  <td className="p-3">Scans today, last scan date, total used credits</td>
                  <td className="p-3">To enforce daily scan quotas and prevent API misuse.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold font-syne text-primary">4. Data Sharing & Third Parties</h2>
          <p>
            We respect your digital integrity. We do not sell, trade, or share your personal data with third-party advertising companies. 
          </p>
          <p>
            Data transfers are restricted to operational microservices:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-primary">Supabase:</strong> For cloud hosting of your user session and metadata profile.
            </li>
            <li>
              <strong className="text-primary">FastAPI/Hugging Face:</strong> To run the backend neural network inference.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold font-syne text-primary">5. Security Measures</h2>
          <p>
            We implement state-of-the-art security practices:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>TLS 1.3 encryption on all API routes to prevent interception in transit.</li>
            <li>Row Level Security (RLS) is strictly enabled on our Supabase PostgreSQL databases, ensuring users can only read or write their own profile records.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold font-syne text-primary">6. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or wish to request the deletion of your account metadata, please contact us at:
          </p>
          <p className="font-medium text-primary">
            privacy@tattva.ai
          </p>
        </section>
      </div>
    </div>
  );
}
