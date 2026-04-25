import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link to="/" className="text-brand-600 dark:text-brand-400 text-sm font-semibold hover:underline">← Back</Link>
      <p className="stamp-label text-brand-600 dark:text-brand-400 mt-6">// Legal</p>
      <h1 className="font-display font-bold text-3xl tracking-tight mt-2 mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: April 21, 2026</p>

      <div className="prose prose-sm max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Who we are</h2>
          <p>ContractorPro ("we", "us") provides software for contractors to manage estimates, leads, invoices, projects, and marketing content. This policy explains what data we collect and how we use it.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">2. Data we collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account data:</strong> email address, password (hashed), business name, phone number, logo image.</li>
            <li><strong>Business data:</strong> estimates, leads, invoices, projects, and notes you create within the app.</li>
            <li><strong>Payment data:</strong> processed by Stripe. We store your Stripe customer and subscription IDs, but never your card number.</li>
            <li><strong>API keys:</strong> your Anthropic (Claude) API key is stored encrypted and used only to generate content on your behalf.</li>
            <li><strong>Usage data:</strong> basic server logs (IP address, timestamps) retained for security and debugging.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. How we use your data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Providing the service (authentication, data storage, AI content generation).</li>
            <li>Processing your subscription via Stripe.</li>
            <li>Emailing you about your account (password resets, billing notices). We do not send marketing emails.</li>
            <li>Investigating abuse or security incidents.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Data sharing</h2>
          <p>We do not sell your data. We share only with service providers strictly necessary to operate the product:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> — database, authentication, file storage.</li>
            <li><strong>Vercel</strong> — application hosting.</li>
            <li><strong>Stripe</strong> — payment processing.</li>
            <li><strong>Anthropic</strong> — AI content generation, using your own API key.</li>
          </ul>
          <p>Your business data (estimates, invoices, leads, projects) is isolated per-account via row-level security. Other ContractorPro users cannot access your data.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. Public share links</h2>
          <p>If you generate a public link for an invoice or project, anyone with the link can view that specific record. The link is not indexed and cannot be guessed, but it should be treated like a password — only share it with intended recipients.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">6. Your rights</h2>
          <p>You can request export or deletion of your account and all associated data at any time by emailing the address below. You can also cancel your subscription and delete your account through the in-app billing portal.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">7. Data retention</h2>
          <p>We retain your data for as long as your account is active. After account deletion, data is removed within 30 days, except where retention is required for legal or accounting purposes.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">8. Security</h2>
          <p>Data is encrypted in transit (HTTPS) and at rest. Passwords are hashed. Access to the production database is restricted and protected by two-factor authentication.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">9. Changes</h2>
          <p>We may update this policy. Material changes will be communicated via email or an in-app notice before taking effect.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">10. Contact</h2>
          <p>Questions or requests: <a href="mailto:Contractorproapp@proton.me" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">Contractorproapp@proton.me</a></p>
        </section>
      </div>
    </div>
    </div>
  )
}
