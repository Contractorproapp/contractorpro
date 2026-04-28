import { Link } from 'react-router-dom'

const CONTACT_EMAIL = 'Contractorproapp@proton.me'
// Replace with your actual business mailing address before launching to public users.
// Required for CAN-SPAM if you ever send marketing emails, and good practice in any case.
const COMPANY_ADDRESS = '[YOUR BUSINESS MAILING ADDRESS]'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link to="/" className="text-brand-600 dark:text-brand-400 text-sm font-semibold hover:underline">← Back</Link>
      <p className="stamp-label text-brand-600 dark:text-brand-400 mt-6">// Legal</p>
      <h1 className="font-display font-bold text-3xl tracking-tight mt-2 mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: April 27, 2026</p>

      <div className="prose prose-sm max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Who we are</h2>
          <p>ContractorPro ("we", "us") provides software for contractors to manage estimates, leads, invoices, projects, and marketing content. This policy explains what data we collect, how we use it, and the rights you have over it.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">2. Data we collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account data:</strong> email address, password (hashed), business name, phone number, logo image.</li>
            <li><strong>Business data:</strong> estimates, leads, invoices, projects, expenses, mileage entries, photos, and notes you create within the app.</li>
            <li><strong>Payment data:</strong> processed by Stripe. We store your Stripe customer and subscription IDs, but never your card number.</li>
            <li><strong>API keys:</strong> your Anthropic (Claude) API key is stored encrypted (AES-GCM-256) and used only to generate content on your behalf. We never display your key after you've saved it.</li>
            <li><strong>Usage data:</strong> basic server logs (IP address, timestamps) retained for security and debugging.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. Cookies and local storage</h2>
          <p>We use the following browser storage:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Authentication cookies / tokens</strong> — to keep you signed in. Set by Supabase Auth. Strictly necessary for the service to function.</li>
            <li><strong>Local storage</strong> — to remember your theme preference (light/dark mode) and other UI settings.</li>
            <li><strong>Service worker cache</strong> — to make the app load fast and work briefly offline.</li>
          </ul>
          <p>We do not use third-party analytics, advertising trackers, or behavioral cookies. By using the service you consent to the storage above.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. How we use your data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Providing the service (authentication, data storage, AI content generation).</li>
            <li>Processing your subscription via Stripe.</li>
            <li>Emailing you about your account (password resets, billing notices). We do not send marketing emails without your prior opt-in.</li>
            <li>Investigating abuse or security incidents.</li>
            <li>Complying with legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. Data sharing</h2>
          <p>We do not sell your data. We share only with service providers strictly necessary to operate the product:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> — database, authentication, file storage.</li>
            <li><strong>Vercel</strong> — application hosting.</li>
            <li><strong>Stripe</strong> — payment processing.</li>
            <li><strong>Anthropic</strong> — AI content generation, using your own API key.</li>
            <li><strong>Resend</strong> — transactional email delivery (only when enabled).</li>
            <li><strong>Google Fonts</strong> — serves typefaces. Google may receive your IP address as part of this request.</li>
          </ul>
          <p>Your business data (estimates, invoices, leads, projects) is isolated per-account via row-level security. Other ContractorPro users cannot access your data.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">6. Public share links</h2>
          <p>If you generate a public link for an invoice, estimate, or project, anyone with the link can view that specific record. Links are unguessable (128 bits of entropy) and not indexed by search engines, but they should be treated like a password — only share with intended recipients.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">7. Your rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Access</strong> a copy of the personal data we hold about you.</li>
            <li><strong>Correct</strong> inaccurate data (most fields are editable in your Profile).</li>
            <li><strong>Export</strong> your business data (CSV exports are available in-app for expenses; full account exports on request).</li>
            <li><strong>Delete</strong> your account and all associated data.</li>
            <li><strong>Object or restrict</strong> processing of your data.</li>
            <li><strong>Withdraw consent</strong> at any time (note: this may end your access to the service).</li>
          </ul>
          <p>To exercise any of these, email <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">{CONTACT_EMAIL}</a>. We respond within 30 days.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">8. California residents (CCPA/CPRA)</h2>
          <p>If you are a California resident, you have additional rights:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Right to know</strong> what personal information we collect, use, and share — disclosed in sections 2, 4, and 5 above.</li>
            <li><strong>Right to delete</strong> personal information we hold about you (subject to legal exceptions).</li>
            <li><strong>Right to correct</strong> inaccurate personal information.</li>
            <li><strong>Right to opt out of sale or sharing</strong> — <strong>we do not sell or share your personal information for cross-context behavioral advertising.</strong> There is nothing to opt out of.</li>
            <li><strong>Right to non-discrimination</strong> — we will not discriminate against you for exercising any CCPA right.</li>
          </ul>
          <p>To exercise these rights, email {CONTACT_EMAIL}. We may verify your identity by confirming the email address on file.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">9. EU / UK residents (GDPR)</h2>
          <p>If you are in the EU, EEA, or UK, our lawful basis for processing your data is:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Contract</strong> — we process account, business, and payment data to provide the service you signed up for.</li>
            <li><strong>Legitimate interest</strong> — we process minimal usage data (server logs) to keep the service secure.</li>
            <li><strong>Consent</strong> — for any optional features, where consent is the appropriate basis.</li>
            <li><strong>Legal obligation</strong> — for tax, fraud-prevention, and regulatory compliance.</li>
          </ul>
          <p>You have the rights listed in section 7 above plus the right to lodge a complaint with your local data protection authority (e.g. the ICO in the UK).</p>
          <p><strong>International transfers.</strong> Our infrastructure providers (Supabase, Vercel, Anthropic, Stripe) may process your data in the United States. They participate in the EU-U.S. Data Privacy Framework or use Standard Contractual Clauses to provide adequate protection.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">10. Data residency</h2>
          <p>Your data is stored on infrastructure located in the United States (Supabase US-East region by default). If we expand to other regions in the future, we will update this policy.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">11. Data retention</h2>
          <p>We retain your data for as long as your account is active. After you delete your account, we remove your data within 30 days, except where retention is required for legal, tax, or accounting purposes (typically up to 7 years for invoicing records). Anonymized server logs are retained for up to 90 days.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">12. Security</h2>
          <p>Data is encrypted in transit (HTTPS/TLS) and at rest. Passwords are hashed using bcrypt (via Supabase Auth). Anthropic API keys are encrypted with AES-GCM-256, with the encryption key held only as a server-side secret. Access to production infrastructure is restricted and protected by two-factor authentication.</p>
          <p><strong>Breach notification.</strong> If we discover a personal data breach affecting you, we will notify you and (where applicable) the relevant supervisory authority within 72 hours of discovery, in accordance with applicable law.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">13. Children's privacy</h2>
          <p>The service is intended for business users aged 18 and over. We do not knowingly collect personal information from anyone under 18. If we learn we have collected such information, we will delete it.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">14. Changes to this policy</h2>
          <p>We may update this policy. Material changes will be communicated by email or an in-app notice at least 14 days before they take effect. Continued use after the effective date constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">15. Contact</h2>
          <p>Questions or requests:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">{CONTACT_EMAIL}</a></li>
            <li>Mailing address: {COMPANY_ADDRESS}</li>
          </ul>
        </section>
      </div>
    </div>
    </div>
  )
}
