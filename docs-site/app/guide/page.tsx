import Link from 'next/link';

import { Sidebar } from '@/components/Sidebar';
import { GUIDE_NAV } from '@/lib/nav';
import {
  Callout,
  Code,
  Lead,
  Screenshot,
  Section,
  Step,
  Steps,
  Table,
} from '@/components/ui';

export default function Guide() {
  return (
    <div className="lg:flex">
      <Sidebar
        items={GUIDE_NAV}
        title="Flexa Unsubscribe"
        subtitle="User guide · v3.0.3"
        crossLinkHref="/"
        crossLinkLabel="← Technical documentation"
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-24 sm:px-8 lg:px-12">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <header className="py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            User guide · v3.0.3
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Getting the most out of Flexa Unsubscribe
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">
            A step-by-step walkthrough of every admin screen - no code
            required. Follow it in order the first time, then dip back in
            whenever you need a refresher.
          </p>
        </header>

        {/* ── Getting started ──────────────────────────────────── */}
        <Section id="start" kicker="Step 1" title="Getting started">
          <Lead>
            Once the plugin is activated you’ll find a new{' '}
            <strong>Unsubscribe</strong> item in the WordPress admin menu on
            the left. Everything in this guide lives under that menu.
          </Lead>
          <Steps>
            <Step>
              In the WordPress admin sidebar, click{' '}
              <strong>Unsubscribe</strong>. It sits in the lower group of the
              menu, near Settings.
            </Step>
            <Step>
              The plugin opens on its <strong>Dashboard</strong>. The sub-tabs
              along the top - Dashboard, Unsubscribes, Blocked Emails,
              Re-subscribed, Reasons, Settings, Appearance - are the seven
              screens covered below.
            </Step>
          </Steps>
          <Screenshot
            alt="WordPress admin sidebar with the “Unsubscribe” menu item"
            caption="public/screenshots/menu.png"
          />
          <Callout tone="info" title="Who can see this?">
            <p>
              Only administrators (users who can “manage options”) can open the
              Flexa Unsubscribe screens. Editors and shop managers won’t see
              the menu.
            </p>
          </Callout>
        </Section>

        {/* ── Dashboard ────────────────────────────────────────── */}
        <Section id="dashboard" kicker="Step 2" title="The Dashboard">
          <Lead>
            The Dashboard is your at-a-glance health check: how many people
            have opted out, how many sends were blocked, and the trends over
            time.
          </Lead>
          <p>You’ll see:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Summary cards</strong> - totals for unsubscribes, blocked
              attempts and re-subscribes.
            </li>
            <li>
              <strong>Over-time chart</strong> - unsubscribes plotted by date
              so you can spot spikes after a campaign.
            </li>
            <li>
              <strong>By-reason chart</strong> - why people are leaving, drawn
              from the reasons you configure later in this guide.
            </li>
          </ul>
          <Screenshot
            alt="Dashboard with summary cards and the trend / reason charts"
            caption="public/screenshots/dashboard.png"
          />
        </Section>

        {/* ── Turn on protection ───────────────────────────────── */}
        <Section
          id="enable"
          kicker="Step 3"
          title="Turn on protection (Settings → General)"
        >
          <Lead>
            This is the one screen you must visit to make the plugin do
            anything. Open the <strong>Settings</strong> tab.
          </Lead>
          <Steps>
            <Step>
              Turn on <strong>Auto-append unsubscribe link</strong> so a
              one-click unsubscribe button is added to outgoing emails that go
              to a single recipient.
            </Step>
            <Step>
              Turn on <strong>Block unsubscribed recipients</strong> so the
              plugin refuses to send to anyone who has opted out. Every blocked
              attempt is logged (see <a href="#blocked" className="text-brand-600 underline">Blocked Emails</a>).
            </Step>
            <Step>
              Review <strong>Exclude keywords</strong>. Any email whose subject
              contains one of these words (case-insensitive) skips{' '}
              <em>both</em> blocking and the appended footer. The default -{' '}
              <Code>Order, Password, Invoice</Code> - keeps transactional mail
              like receipts and password resets flowing. Add your own,
              comma-separated.
            </Step>
            <Step>
              Click <strong>Save changes</strong>. The button stays disabled
              until you’ve actually changed something, and an “Unsaved
              changes” hint appears while edits are pending.
            </Step>
          </Steps>
          <Screenshot
            alt="Settings → General with the auto-append / blocking toggles and exclude keywords"
            caption="public/screenshots/settings-general.png"
          />
          <Callout tone="warn" title="Use exclude keywords for important mail">
            <p>
              Order confirmations, password resets and invoices should{' '}
              <em>never</em> be blocked or carry an unsubscribe button. Keep
              their subject keywords in the exclude list.
            </p>
          </Callout>
        </Section>

        {/* ── Customize the email footer ───────────────────────── */}
        <Section
          id="footer"
          kicker="Step 4"
          title="Customize the email footer"
        >
          <Lead>
            On the same <strong>Settings</strong> screen, the “Unsubscribe
            footer” block controls exactly what the appended button looks like
            in the emails your recipients receive.
          </Lead>
          <Table
            head={['Field', 'What it changes', 'Default']}
            rows={[
              [
                'Footer heading text',
                'The line of text shown just above the button.',
                '“No longer want to receive these emails?”',
              ],
              [
                'Unsubscribe button label',
                'The text on the button itself.',
                '“Unsubscribe”',
              ],
              [
                'Unsubscribe button color',
                'The button’s background colour (pick from the colour swatch or type a hex value).',
                '#dc3545 (red)',
              ],
            ]}
          />
          <p>
            Edit any of the three, click <strong>Save changes</strong>, and
            send yourself a test email to confirm it looks the way you want.
          </p>
          <Screenshot
            alt="The “Unsubscribe footer” block: heading text, button label and colour picker"
            caption="public/screenshots/settings-footer.png"
          />
          <Callout tone="info" title="Auto-append must be on">
            <p>
              These three fields only matter when{' '}
              <strong>Auto-append unsubscribe link</strong> (Step 3) is turned
              on - that’s what actually adds the footer to outgoing mail.
            </p>
          </Callout>
        </Section>

        {/* ── Appearance ───────────────────────────────────────── */}
        <Section
          id="appearance"
          kicker="Step 5"
          title="Style the public unsubscribe page"
        >
          <Lead>
            When someone clicks the button, they land on a page hosted by your
            site. The <strong>Appearance</strong> tab lets you match it to your
            brand - with a live preview so you see every change instantly.
          </Lead>
          <p>You can adjust:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Colours</strong> - page background, card background, text,
              headings and the action button (normal + hover).
            </li>
            <li>
              <strong>Typography</strong> - font family (choose from a short
              list) and base font size.
            </li>
            <li>
              <strong>All the wording</strong> - the page title, the
              confirmation message, the feedback button, the thank-you text,
              the “back to home” link, and the messages shown for expired links
              and successful re-subscribes.
            </li>
          </ul>
          <Steps>
            <Step>Change a colour, font or piece of text on the left.</Step>
            <Step>
              Watch the <strong>live preview</strong> on the right update as
              you type.
            </Step>
            <Step>
              Click <strong>Save changes</strong> when you’re happy.
            </Step>
          </Steps>
          <Screenshot
            alt="Appearance editor on the left with the live preview of the public page on the right"
            caption="public/screenshots/appearance.png"
          />
          <Callout tone="info" title="The {email} placeholder">
            <p>
              In the success message, the text <Code>{'{email}'}</Code> is
              automatically replaced with the recipient’s real email address on
              the live page. Leave it in place if you want to show them which
              address was removed.
            </p>
          </Callout>
        </Section>

        {/* ── Unsubscribes list ────────────────────────────────── */}
        <Section
          id="unsubscribes"
          kicker="Step 6"
          title="The Unsubscribes list"
        >
          <Lead>
            The <strong>Unsubscribes</strong> tab is the master list of every
            address that has opted out, the reason they gave (if any), and
            when.
          </Lead>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Search</strong> the list instantly as you type.
            </li>
            <li>
              <strong>Sort</strong> by clicking a column header (email, reason,
              date).
            </li>
            <li>
              <strong>Paginate</strong> through large lists. The page, sort and
              order are stored in the URL, so you can bookmark or share an exact
              view.
            </li>
            <li>
              <strong>Delete a row</strong> if you need to remove someone from
              the opt-out list manually (they’ll start receiving mail again).
            </li>
          </ul>
          <Screenshot
            alt="Unsubscribes list with search box, sortable columns and pagination"
            caption="public/screenshots/unsubscribes.png"
          />
        </Section>

        {/* ── Blocked Emails ───────────────────────────────────── */}
        <Section
          id="blocked"
          kicker="Step 7"
          title="Blocked Emails"
        >
          <Lead>
            This is an <strong>audit log of send attempts that were stopped</strong>{' '}
            because the recipient had opted out - it is not the opt-out list
            itself.
          </Lead>
          <p>
            Each entry records the recipient, the email subject, who it was
            from, and when the send was blocked. Use it to confirm the plugin
            is doing its job, or to investigate “why didn’t my customer get
            that email?”.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Search, sort and paginate just like the Unsubscribes list.</li>
            <li>Delete a single log entry, or use the clear action to empty the whole log.</li>
          </ul>
          <Screenshot
            alt="Blocked Emails log showing recipient, subject, sender and blocked date"
            caption="public/screenshots/blocked.png"
          />
        </Section>

        {/* ── Re-subscribed ────────────────────────────────────── */}
        <Section
          id="resubscribed"
          kicker="Step 8"
          title="The Re-subscribed list"
        >
          <Lead>
            People who opted out can opt back in via a re-subscribe link. When
            they do, their row isn’t deleted - it’s marked re-subscribed and
            shown here.
          </Lead>
          <p>
            This screen lets you see who changed their mind and when, which is
            handy for measuring whether a win-back campaign worked. Same
            search / sort / pagination controls as the other lists.
          </p>
          <Screenshot
            alt="Re-subscribed list with original opt-out date and re-subscribe date"
            caption="public/screenshots/resubscribed.png"
          />
        </Section>

        {/* ── Reasons ──────────────────────────────────────────── */}
        <Section id="reasons" kicker="Step 9" title="Manage opt-out reasons">
          <Lead>
            On the <strong>Reasons</strong> tab you decide which choices people
            see when they unsubscribe. Their selection feeds the “by reason”
            chart on the Dashboard.
          </Lead>
          <Steps>
            <Step>
              <strong>Add</strong> a reason by typing it and saving - it starts
              with three sensible defaults.
            </Step>
            <Step>
              <strong>Edit</strong> the wording of any reason in place.
            </Step>
            <Step>
              <strong>Reorder</strong> them so the most likely reasons appear
              first.
            </Step>
            <Step>
              <strong>Delete</strong> any you don’t want to offer.
            </Step>
          </Steps>
          <Screenshot
            alt="Reasons manager with add, edit, reorder and delete controls"
            caption="public/screenshots/reasons.png"
          />
        </Section>

        {/* ── Export ───────────────────────────────────────────── */}
        <Section id="export" kicker="Step 10" title="Export to CSV">
          <Lead>
            The Unsubscribes, Blocked Emails and Re-subscribed lists each have
            an <strong>Export CSV</strong> button. It downloads the full list
            as a spreadsheet you can open in Excel, Google Sheets or your CRM.
          </Lead>
          <Screenshot
            alt="A list screen with the Export CSV button highlighted"
            caption="public/screenshots/export.png"
          />
          <Callout tone="security" title="Exports contain personal data">
            <p>
              These files include email addresses (and, for blocked mail,
              subjects and sender details). Treat them as sensitive: only
              download them when needed, store them securely, and delete copies
              you no longer require.
            </p>
          </Callout>
        </Section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <Section
          id="faq"
          kicker="Help"
          title="Troubleshooting & FAQ"
        >
          <FaqItem q="The unsubscribe button isn’t appearing in my emails.">
            Check three things: (1) <strong>Auto-append</strong> is turned on
            in Settings; (2) the email goes to a{' '}
            <strong>single recipient</strong> (the footer is skipped for
            multi-recipient mail); (3) the subject doesn’t contain one of your{' '}
            <strong>exclude keywords</strong>.
          </FaqItem>
          <FaqItem q="What’s the difference between “Unsubscribes” and “Blocked Emails”?">
            <strong>Unsubscribes</strong> is the list of people who opted out.{' '}
            <strong>Blocked Emails</strong> is a log of individual{' '}
            <em>send attempts</em> that were stopped because the recipient was
            on that list. One unsubscribed person can generate many blocked-log
            entries.
          </FaqItem>
          <FaqItem q="Someone re-subscribed - did their data get deleted?">
            No. A re-subscribe keeps the original row and simply marks it
            re-subscribed, which is why it shows up on the Re-subscribed
            screen. They’ll start receiving mail again.
          </FaqItem>
          <FaqItem q="Old unsubscribe links suddenly stopped working.">
            Unsubscribe links are signed with your site’s secret keys. If those
            keys were rotated (in <Code>wp-config.php</Code>), every link sent
            before the change becomes invalid. Recipients just need a fresh
            email with a new link.
          </FaqItem>
          <FaqItem q="A transactional email got blocked by mistake.">
            Add a distinctive word from its subject to{' '}
            <strong>Exclude keywords</strong> in Settings. Anything matching
            that keyword bypasses both blocking and the appended footer.
          </FaqItem>
          <p className="pt-4 text-sm text-muted">
            Need the technical details (REST API, hooks, database schema)? See
            the{' '}
            <Link href="/" className="text-brand-600 underline">
              technical documentation
            </Link>
            .
          </p>
        </Section>

        <footer className="pt-12 text-sm text-muted">
          <p>Flexa Unsubscribe v3.0.3 · user guide. GPL v2 or later.</p>
        </footer>
      </main>
    </div>
  );
}

function FaqItem({
  q,
  children,
}: {
  q: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <p className="font-semibold text-ink">{q}</p>
      <p className="mt-2 text-sm leading-7 text-ink-soft">{children}</p>
    </div>
  );
}
