import Link from "next/link"

export const metadata = {
  title: "Privacy Policy — Nectic",
  description: "How Nectic handles your data.",
}

const LAST_UPDATED = "February 2026"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-neutral-100 px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-neutral-900 hover:opacity-70 transition-opacity">
          Nectic
        </Link>
        <Link href="/" className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
          ← Back
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">Legal</p>
        <h1 className="text-3xl font-light text-neutral-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-neutral-400 mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-10 text-sm text-neutral-600 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-neutral-900 mb-3">Who we are</h2>
            <p>
              Nectic is a product intelligence tool for B2B SaaS teams. We help product managers and customer success teams extract customer signals from WhatsApp group conversations.
            </p>
            <p className="mt-3">
              For questions about this policy, contact us at <a href="mailto:hello@nectic.com" className="text-neutral-900 underline">hello@nectic.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 mb-3">What data we process</h2>
            <div className="space-y-4">
              <div className="border-l-2 border-neutral-200 pl-4">
                <p className="font-medium text-neutral-800">Account information</p>
                <p className="mt-1 text-neutral-500">Your name, email address, and password when you create an account.</p>
              </div>
              <div className="border-l-2 border-neutral-200 pl-4">
                <p className="font-medium text-neutral-800">WhatsApp conversation text</p>
                <p className="mt-1 text-neutral-500">
                  When you upload a WhatsApp export, the conversation text is processed by our AI model to extract customer signals. The raw file is parsed in your browser — it is never uploaded to our servers. Only the formatted conversation text is sent for analysis.
                </p>
              </div>
              <div className="border-l-2 border-neutral-200 pl-4">
                <p className="font-medium text-neutral-800">Analysis results</p>
                <p className="mt-1 text-neutral-500">The structured output from each analysis (account health, risk signals, product signals) is stored in your account and linked to your user ID.</p>
              </div>
              <div className="border-l-2 border-neutral-200 pl-4">
                <p className="font-medium text-neutral-800">Usage data</p>
                <p className="mt-1 text-neutral-500">Basic product usage information (e.g. number of accounts connected). We do not use third-party analytics trackers.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 mb-3">Your responsibility as the uploader</h2>
            <p>
              WhatsApp group conversations include messages from multiple people. By uploading a conversation to Nectic, you confirm that:
            </p>
            <ul className="mt-3 space-y-2 list-disc list-outside ml-4">
              <li>You have the authority to share the conversation content for analysis purposes.</li>
              <li>You have informed participants, or are operating under a lawful basis (e.g. a business communication policy) that permits this use.</li>
              <li>You will not upload conversations containing sensitive personal data (health, financial, or identity documents) unless you have explicit consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 mb-3">How we use your data</h2>
            <ul className="space-y-2 list-disc list-outside ml-4">
              <li>To provide the Nectic service — analysing conversations and storing results in your account.</li>
              <li>To improve analysis quality. We may review anonymised analysis outputs to improve our AI prompts. We do not use your raw conversation text to train AI models.</li>
              <li>To contact you about your account or early access status.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 mb-3">Third-party processors</h2>
            <div className="space-y-3">
              <div className="flex gap-4 py-3 border-b border-neutral-100">
                <div className="w-28 flex-shrink-0 text-neutral-800 font-medium">Anthropic</div>
                <div className="text-neutral-500">Processes conversation text to produce analysis results. Data is sent via OpenRouter. Anthropic does not use API inputs to train its models. <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-neutral-700 underline">Privacy policy</a></div>
              </div>
              <div className="flex gap-4 py-3 border-b border-neutral-100">
                <div className="w-28 flex-shrink-0 text-neutral-800 font-medium">Firebase</div>
                <div className="text-neutral-500">Google Cloud Firestore stores your account data and analysis results. Servers are located in the United States. <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-neutral-700 underline">Privacy policy</a></div>
              </div>
              <div className="flex gap-4 py-3 border-b border-neutral-100">
                <div className="w-28 flex-shrink-0 text-neutral-800 font-medium">Vercel</div>
                <div className="text-neutral-500">Hosts the Nectic application. API requests pass through Vercel's infrastructure. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-neutral-700 underline">Privacy policy</a></div>
              </div>
            </div>
            <p className="mt-4 text-neutral-500">
              All third-party processors are contractually required to protect your data and process it only as instructed. Data may be transferred outside Indonesia and the EEA. Where required, we rely on standard contractual clauses or equivalent safeguards.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 mb-3">Data retention</h2>
            <p>
              Analysis results are retained until you delete them or close your account. You can delete any account analysis from the Nectic dashboard at any time. Deleting an account removes all associated analysis data and any shared links.
            </p>
            <p className="mt-3">
              Account information is retained for as long as your account is active. On account closure, we delete your personal data within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 mb-3">Your rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="mt-3 space-y-2 list-disc list-outside ml-4">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data.</li>
              <li>Request deletion of your data (right to erasure).</li>
              <li>Object to or restrict how we process your data.</li>
              <li>Receive your data in a portable format.</li>
            </ul>
            <p className="mt-4">
              To exercise any of these rights, email <a href="mailto:hello@nectic.com" className="text-neutral-900 underline">hello@nectic.com</a>. We will respond within 14 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 mb-3">Indonesia — UU PDP</h2>
            <p>
              Nectic processes personal data as defined under Indonesia&apos;s Personal Data Protection Law (UU No. 27 of 2022). Our legal basis for processing is the performance of a contract — providing the Nectic service you have requested.
            </p>
            <p className="mt-3">
              If you are an Indonesian data subject and wish to exercise your rights under UU PDP, contact us at <a href="mailto:hello@nectic.com" className="text-neutral-900 underline">hello@nectic.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 mb-3">Security</h2>
            <ul className="space-y-2 list-disc list-outside ml-4">
              <li>WhatsApp export files are parsed in your browser and never uploaded to our servers in raw form.</li>
              <li>All data is transmitted over HTTPS.</li>
              <li>Access to your account data is enforced by Firebase Authentication and Firestore security rules — no other user can access your accounts.</li>
              <li>Shared analysis links are token-gated with randomly generated UUIDs.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 mb-3">Changes to this policy</h2>
            <p>
              We will update this policy as the product evolves. Material changes will be communicated by email to registered users. Continued use after a policy update constitutes acceptance.
            </p>
          </section>

          <div className="pt-4 border-t border-neutral-100">
            <p className="text-neutral-400">Questions? <a href="mailto:hello@nectic.com" className="text-neutral-700 underline">hello@nectic.com</a></p>
          </div>

        </div>
      </main>
    </div>
  )
}
