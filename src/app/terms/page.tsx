import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, AlertOctagon, Scale, ShieldAlert } from "lucide-react";

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>
        <p className="text-sm text-muted">Last updated: June 15, 2026</p>
      </div>

      <div className="space-y-12 text-sm sm:text-base leading-relaxed text-muted">
        {/* Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-10">
          <div className="p-6 bg-surface border border-border rounded-2xl flex flex-col gap-3">
            <Scale className="w-6 h-6 text-primary" />
            <h3 className="font-semibold text-primary font-syne">Acceptable Use</h3>
            <p className="text-xs text-muted">
              Users must not abuse the API or run automated scrapers to scan media. Quotas are strictly enforced.
            </p>
          </div>
          <div className="p-6 bg-surface border border-border rounded-2xl flex flex-col gap-3">
            <ShieldAlert className="w-6 h-6 text-primary" />
            <h3 className="font-semibold text-primary font-syne">Disclaimer</h3>
            <p className="text-xs text-muted">
              Forensic tools offer probabilistic predictions. Results should be treated as indications, not absolute proof.
            </p>
          </div>
          <div className="p-6 bg-surface border border-border rounded-2xl flex flex-col gap-3">
            <AlertOctagon className="w-6 h-6 text-primary" />
            <h3 className="font-semibold text-primary font-syne">Account Termination</h3>
            <p className="text-xs text-muted">
              We reserve the right to suspend accounts displaying suspicious usage patterns or terms violations.
            </p>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold font-syne text-primary">1. Agreement to Terms</h2>
          <p>
            By accessing or using Tattva.ai, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold font-syne text-primary">2. Acceptable Use Policy</h2>
          <p>
            You agree to use Tattva.ai solely for legitimate verification and analytical purposes. Prohibited actions include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Attempting to bypass our API rate-limiting or daily scan quotas.</li>
            <li>Deploying automated crawlers, web-scrapers, or load testers to flood our servers.</li>
            <li>Uploading illegal, malicious, or highly sensitive content (e.g. materials containing child exploitation, malware, or viruses).</li>
            <li>Using the detection platform to reverse-engineer deepfake generators to bypass detection algorithms.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold font-syne text-primary">3. Disclaimer of Verdict Accuracy</h2>
          <p>
            Our software relies on deep-learning models (e.g., Vision Transformers, Swin Transformers, Wav2Vec 2.0) and forensic algorithms (Error Level Analysis) to evaluate media.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-primary">Indication Only:</strong> The scan outcomes and verdicts (Authentic, Suspicious, Deepfake) are probabilistic predictions rather than absolute binary proofs.
            </li>
            <li>
              <strong className="text-primary">No Liability:</strong> Tattva.ai does not guarantee 100% accuracy and is not liable for false positives, false negatives, or any real-world decisions made based on the generated reports.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold font-syne text-primary">4. Intellectual Property</h2>
          <p>
            The technology, designs, source code, UI elements, and logo of Tattva.ai are the intellectual property of Tattva.ai. The uploaded files remain the intellectual property of their respective owners.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold font-syne text-primary">5. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your access to Tattva.ai if we detect activity violating these Terms, including multi-account registrations or token exploitation.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold font-syne text-primary">6. Modifications to Terms</h2>
          <p>
            We may update these terms occasionally. We will publish the updated terms here. Your continued use of the website represents acceptance of the revised Terms of Service.
          </p>
        </section>
      </div>
    </div>
  );
}
