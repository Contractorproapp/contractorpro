import { Link } from 'react-router-dom'

// ─────────────────────────────────────────────────────────
// IMPORTANT: replace these placeholders before going live with users
// outside your immediate circle, and have a lawyer review.
// ─────────────────────────────────────────────────────────
const GOVERNING_STATE = '[YOUR STATE]'           // e.g. 'California'
const GOVERNING_COUNTY = '[YOUR COUNTY]'         // e.g. 'San Francisco County'
const ARBITRATION_BODY = 'JAMS'                  // or 'AAA' (American Arbitration Association)
const COMPANY_LEGAL_NAME = 'ContractorPro'       // change if you incorporate as something else
const CONTACT_EMAIL = 'Contractorproapp@proton.me'

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link to="/" className="text-brand-600 dark:text-brand-400 text-sm font-semibold hover:underline">← Back</Link>
      <p className="stamp-label text-brand-600 dark:text-brand-400 mt-6">// Legal</p>
      <h1 className="font-display font-bold text-3xl tracking-tight mt-2 mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: April 27, 2026</p>

      <div className="prose prose-sm max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Agreement</h2>
          <p>By creating an account or using {COMPANY_LEGAL_NAME} ("the service", "we", "us"), you agree to these Terms. If you do not agree, do not use the service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">2. The service</h2>
          <p>{COMPANY_LEGAL_NAME} is a software tool that helps contractors manage estimates, leads, invoices, projects, and marketing content. Some features use AI (Anthropic Claude) via your own API key.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. Account and payment</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You must be at least 18 years old and provide accurate information.</li>
            <li>You are responsible for keeping your password confidential and for all activity under your account.</li>
            <li>{COMPANY_LEGAL_NAME} is $29 USD per month after a 7-day free trial, billed via Stripe.</li>
            <li>You can cancel anytime through the in-app billing portal. Cancellation takes effect at the end of the current billing period.</li>
            <li>Anthropic API usage is billed separately by Anthropic based on your own API key.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Refunds and price changes</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Subscriptions are non-refundable for the current billing period unless required by law. Cancellation stops future renewals; you keep access until the end of the period you've already paid for.</li>
            <li>If you believe you were charged in error, contact us within 30 days of the charge and we will investigate. Approved refunds are processed via Stripe within 10 business days.</li>
            <li>We may change pricing with at least 30 days' notice via email or in-app notice. Continued use after the effective date constitutes acceptance of the new price. If you do not agree, you can cancel before the change takes effect.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. Acceptable use</h2>
          <p>You agree not to use the service to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Violate any law or the rights of others.</li>
            <li>Send spam or unsolicited communications.</li>
            <li>Attempt to access other users' data or the service's infrastructure without authorization.</li>
            <li>Reverse engineer, decompile, or attempt to extract the source code of the service except to the extent expressly permitted by applicable law.</li>
            <li>Generate misleading, defamatory, fraudulent, or deceptive content.</li>
            <li>Use the service to compete with us, including building a substantially similar product.</li>
          </ul>
          <p>We may suspend or terminate accounts that violate these rules without refund.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">6. Your content</h2>
          <p>You own the content you create in {COMPANY_LEGAL_NAME} (estimates, invoices, projects, photos, etc.). By using the service, you grant us a limited, worldwide, non-exclusive license to store, display, and process that content solely to provide the service to you. We do not use your content to train AI models or share it with anyone outside the service providers listed in our Privacy Policy.</p>
          <p>You are solely responsible for ensuring you have the right to upload, store, and share any content you put into the service (including client photos, signatures, and contact information).</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">7. AI-generated content</h2>
          <p>AI outputs are generated by Anthropic Claude based on your inputs. They may contain errors, omissions, or inaccuracies. <strong>You are responsible for reviewing and verifying AI-generated content before sending it to clients or relying on it in legal, financial, regulated, or safety-critical contexts.</strong> {COMPANY_LEGAL_NAME} is not responsible for losses, damages, or claims arising from AI-generated content you choose to use.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">8. Public share links</h2>
          <p>The service generates unguessable share links for invoices, estimates, and projects so you can send them to clients without requiring them to sign in. Anyone with a share link can view the linked record. Treat share links like passwords; we are not responsible for misuse of share links you have distributed.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">9. Third-party services</h2>
          <p>The service relies on third parties (Stripe, Supabase, Vercel, Anthropic, Google Fonts). Their availability, pricing, and policies are outside our control. We are not liable for outages or changes in their services that affect your use of {COMPANY_LEGAL_NAME}.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">10. DMCA / copyright</h2>
          <p>We respect intellectual property rights. If you believe content stored in the service infringes your copyright, send a written DMCA notice to {CONTACT_EMAIL} with: (a) your contact information, (b) identification of the copyrighted work, (c) the URL of the allegedly infringing material, (d) a good-faith statement, (e) a statement under penalty of perjury that you are authorized, and (f) your physical or electronic signature. We will investigate and may remove content or terminate repeat infringers.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">11. Termination</h2>
          <p>You may close your account at any time through Profile settings or by emailing us. We may suspend or terminate your account for material breach of these Terms, non-payment, or to comply with law. On termination, your right to use the service ends immediately and we will delete your data per the Privacy Policy retention schedule.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">12. Disclaimers</h2>
          <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. We do not guarantee uninterrupted availability or that the service is free of errors. You are responsible for maintaining your own backups of important business data.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">13. Limitation of liability</h2>
          <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM OR RELATED TO THE SERVICE IS LIMITED TO THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS BEFORE THE CLAIM. WE ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS OR LOST DATA, EVEN IF ADVISED OF THE POSSIBILITY.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">14. Indemnification</h2>
          <p>You agree to defend, indemnify, and hold harmless {COMPANY_LEGAL_NAME} and its operators from any claim, loss, or expense (including reasonable attorneys' fees) arising from (a) your use of the service, (b) your content, (c) your violation of these Terms, or (d) your violation of any law or third-party right.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">15. Governing law and dispute resolution</h2>
          <p>These Terms are governed by the laws of the State of {GOVERNING_STATE}, USA, without regard to conflict-of-laws principles.</p>
          <p><strong>Mandatory arbitration.</strong> Any dispute arising out of or relating to these Terms or the service shall be resolved by binding individual arbitration administered by {ARBITRATION_BODY} under its rules in {GOVERNING_COUNTY}, {GOVERNING_STATE}, or via remote/online proceedings. Judgment on the award may be entered in any court of competent jurisdiction. <strong>Class actions and class arbitrations are not permitted.</strong> You may opt out of arbitration by emailing {CONTACT_EMAIL} within 30 days of first accepting these Terms with the subject "Arbitration Opt-Out".</p>
          <p>Either party may seek injunctive relief in court for intellectual property or unauthorized access claims.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">16. Changes</h2>
          <p>We may update these Terms. Material changes will be communicated by email or in-app notice at least 14 days before they take effect. Continued use after the effective date constitutes acceptance. If you do not agree, stop using the service before the change takes effect.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">17. Miscellaneous</h2>
          <p>If any provision is held unenforceable, the remaining provisions stay in effect. Our failure to enforce any right is not a waiver. You may not assign these Terms without our written consent. These Terms are the entire agreement between you and us regarding the service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">18. Contact</h2>
          <p>Questions: <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">{CONTACT_EMAIL}</a></p>
        </section>
      </div>
    </div>
    </div>
  )
}
