import { Sidebar } from '@/components/Sidebar';
import { NAV } from '@/lib/nav';
import {
  Callout,
  Code,
  CodeBlock,
  Lead,
  Method,
  Section,
  Table,
} from '@/components/ui';

export default function Home() {
  return (
    <div className="lg:flex">
      <Sidebar
        items={NAV}
        title="Flexa Unsubscribe"
        subtitle="Technical documentation · v3.0.3"
        crossLinkHref="/guide/"
        crossLinkLabel="📘 Read the User Guide"
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-24 sm:px-8 lg:px-12">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <header className="py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            WordPress plugin · v3.0.3
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Flexa Unsubscribe
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">
            Adds secure, HMAC-signed unsubscribe links to outgoing WordPress
            email, blocks mail to recipients who opted out, and gives them a
            customizable opt-out / re-subscribe page — managed from a React
            admin.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium">
            {[
              'Requires WordPress 5.8+',
              'Tested up to 6.9',
              'Requires PHP 7.4',
              'GPL v2',
              '7 bundled locales',
            ].map((b) => (
              <span
                key={b}
                className="rounded-full border border-line bg-surface px-3 py-1 text-muted"
              >
                {b}
              </span>
            ))}
          </div>
        </header>

        {/* ── Overview ─────────────────────────────────────────── */}
        <Section id="overview" kicker="Introduction" title="Overview">
          <Lead>
            Flexa Unsubscribe intercepts every email WordPress sends through{' '}
            <Code>wp_mail()</Code> and adds a one-click, cryptographically
            signed unsubscribe link. Once a recipient opts out, the plugin can
            hard-block any future mail to that address and log every blocked
            attempt for audit. Recipients can also re-subscribe themselves.
          </Lead>
          <p>
            All admin screens — Dashboard, Unsubscribes, Blocked Emails,
            Re-subscribed, Reasons, Settings and Appearance — are a single-page
            React app (Vite + TypeScript + shadcn/ui + Tailwind v4) talking to a
            namespaced REST API. The public-facing unsubscribe and re-subscribe
            pages are fully themable from the Appearance screen.
          </p>
          <Table
            head={['Property', 'Value']}
            rows={[
              ['Current version', <Code key="v">3.0.3</Code>],
              ['Requires WordPress', '5.8 or newer'],
              ['Tested up to', 'WordPress 6.9'],
              ['Requires PHP', '7.4 or newer'],
              ['License', 'GPL v2 or later'],
              ['Text domain', <Code key="td">flexa-unsubscribe</Code>],
              [
                'REST namespace',
                <Code key="ns">flexa-unsubscribe/v1</Code>,
              ],
            ]}
          />
        </Section>

        {/* ── How it works ─────────────────────────────────────── */}
        <Section id="how-it-works" kicker="Architecture" title="How it works">
          <p>
            The plugin hooks the <Code>wp_mail</Code> filter twice. Order
            matters: blocking runs first so a fully-blocked send is dropped
            before any footer work happens.
          </p>
          <Table
            head={['Filter callback', 'Priority', 'Responsibility']}
            rows={[
              [
                <Code key="a">flexa_tech_su_block_unsubscribed_emails</Code>,
                <Code key="p5">5</Code>,
                'Strips recipients on the unsubscribe list. If every recipient is blocked, the send is cancelled and the attempt is logged to the blocked-emails table.',
              ],
              [
                <Code key="b">flexa_auto_append_unsubscribe_link</Code>,
                <Code key="p10">10</Code>,
                'Appends the unsubscribe footer (heading + button) to single-recipient emails, converting plain text to HTML when needed and de-duplicating via an HTML marker.',
              ],
            ]}
          />
          <p>
            Both callbacks honour the <strong>exclude keywords</strong> list: if
            the subject contains any configured keyword (case-insensitive), that
            email skips both blocking and auto-append — the escape hatch for
            transactional mail (orders, password resets, invoices).
          </p>
          <p>
            On the front end the plugin watches the home URL for a{' '}
            <Code>flexa_action</Code> query parameter (
            <Code>unsubscribe</Code> or <Code>resubscribe</Code>) plus an{' '}
            <Code>email</Code> and HMAC <Code>token</Code>, then renders the
            themed public page.
          </p>
        </Section>

        {/* ── Installation ─────────────────────────────────────── */}
        <Section id="installation" kicker="Getting started" title="Installation">
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              Upload the <Code>flexa-unsubscribe</Code> folder to{' '}
              <Code>wp-content/plugins/</Code> (or install the{' '}
              <Code>.zip</Code> from the Plugins screen).
            </li>
            <li>Activate the plugin through the WordPress “Plugins” menu.</li>
            <li>
              On activation the plugin provisions three database tables and
              seeds the reasons table with three default opt-out reasons. A
              versioned schema upgrade then runs once per request whenever the
              stored schema version is behind the code.
            </li>
            <li>
              Open <strong>Unsubscribe → Settings</strong> and enable
              auto-append and/or blocking as needed.
            </li>
          </ol>
          <Callout tone="security" title="AUTH_KEY is required">
            <p>
              Unsubscribe tokens are signed with the <Code>AUTH_KEY</Code> salt
              from <Code>wp-config.php</Code> (WordPress always defines it).
              Rotating <Code>AUTH_KEY</Code> invalidates every unsubscribe and
              re-subscribe link already sent — recipients would have to use a
              freshly generated link.
            </p>
          </Callout>
        </Section>

        {/* ── Features ─────────────────────────────────────────── */}
        <Section id="features" kicker="Capabilities" title="Features">
          <Table
            head={['Feature', 'What it does']}
            rows={[
              [
                'Auto-append unsubscribe footer',
                'Adds a signed unsubscribe button to single-recipient outgoing email. Footer heading text, button label and button colour are all admin-configurable.',
              ],
              [
                'Hard recipient blocking',
                'Refuses to send to addresses on the unsubscribe list. Each blocked attempt records subject, from-name/email and headers.',
              ],
              [
                'Exclude keywords',
                'Comma-separated subject keywords that bypass both blocking and auto-append — for transactional mail.',
              ],
              [
                'Re-subscribe flow',
                'Opted-out users get a signed re-subscribe link and a confirmation page; the row is marked re-subscribed rather than deleted.',
              ],
              [
                'Reason capture',
                'The public unsubscribe page can ask why; reasons are admin-managed, sortable, and feed the analytics “by reason” chart.',
              ],
              [
                'Themable public pages',
                'Colours, typography and every copy string on the unsubscribe / re-subscribe / error pages are editable, with a live preview in the admin.',
              ],
              [
                'CSV export',
                'Nonce-protected exports of the unsubscribes, blocked and re-subscribed tables.',
              ],
              [
                'Internationalization',
                'Fully translatable, with seven locales bundled (PHP + JS string translations).',
              ],
            ]}
          />
        </Section>

        {/* ── Settings · General ───────────────────────────────── */}
        <Section
          id="settings-general"
          kicker="Configuration"
          title="Settings · General"
        >
          <p>
            Persisted as <Code>flexa_tech_su_*</Code> options and exposed at{' '}
            <Code>GET|PUT /settings/general</Code>. Booleans travel the wire as
            real JSON <Code>true</Code>/<Code>false</Code> but persist as{' '}
            <Code>&apos;1&apos;</Code>/<Code>&apos;&apos;</Code> strings for
            back-compat with legacy comparisons.
          </p>
          <Table
            head={['Field', 'Type', 'Default', 'Notes']}
            rows={[
              [
                <Code key="1">enable_auto_append</Code>,
                'boolean',
                'false',
                'Append the unsubscribe footer to single-recipient mail.',
              ],
              [
                <Code key="2">exclude_keywords</Code>,
                'string',
                <Code key="d2">Order, Password, Invoice</Code>,
                'Comma-separated, max 500 chars. Case-insensitive subject match.',
              ],
              [
                <Code key="3">enable_blocking</Code>,
                'boolean',
                'true',
                'Hard-stop outbound mail to unsubscribed addresses.',
              ],
              [
                <Code key="4">append_heading_text</Code>,
                'string',
                '“No longer want to receive these emails?”',
                'Line above the button. Max 200 chars, translatable default.',
              ],
              [
                <Code key="5">append_button_text</Code>,
                'string',
                '“Unsubscribe”',
                'Button label. Max 100 chars, translatable default.',
              ],
              [
                <Code key="6">append_button_color</Code>,
                'string',
                <Code key="d6">#dc3545</Code>,
                'Button background. Normalised to a lowercase 6-char hex.',
              ],
            ]}
          />
        </Section>

        {/* ── Settings · Appearance ────────────────────────────── */}
        <Section
          id="settings-appearance"
          kicker="Configuration"
          title="Settings · Appearance"
        >
          <p>
            Themes the public unsubscribe / re-subscribe / error pages. Exposed
            at <Code>GET|PUT /settings/appearance</Code>. Colours are normalised
            to lowercase 6-char hex; <Code>font_family</Code> is an enum;{' '}
            <Code>font_size</Code> must match{' '}
            <Code>{`^\\d+(\\.\\d+)?(px|em|rem|%)$`}</Code>.
          </p>

          <h3 className="pt-2 text-sm font-semibold text-ink">Colours</h3>
          <Table
            head={['Token', 'Default']}
            rows={[
              [<Code key="a">bg_color</Code>, <Code key="1">#f0f2f5</Code>],
              [<Code key="b">box_bg_color</Code>, <Code key="2">#ffffff</Code>],
              [<Code key="c">text_color</Code>, <Code key="3">#333333</Code>],
              [<Code key="d">heading_color</Code>, <Code key="4">#495057</Code>],
              [<Code key="e">button_bg_color</Code>, <Code key="5">#00aad0</Code>],
              [<Code key="f">button_text_color</Code>, <Code key="6">#ffffff</Code>],
              [<Code key="g">button_hover_color</Code>, <Code key="7">#0099bb</Code>],
            ]}
          />

          <h3 className="pt-2 text-sm font-semibold text-ink">Typography</h3>
          <Table
            head={['Token', 'Default', 'Allowed']}
            rows={[
              [
                <Code key="ff">font_family</Code>,
                <Code key="d">sans-serif</Code>,
                'sans-serif · Arial, sans-serif · Helvetica, sans-serif · Georgia, serif · ‘Times New Roman’, serif · ‘Courier New’, monospace',
              ],
              [
                <Code key="fs">font_size</Code>,
                <Code key="d">14px</Code>,
                'Number + px / em / rem / %',
              ],
            ]}
          />

          <h3 className="pt-2 text-sm font-semibold text-ink">Text content</h3>
          <Table
            head={['Token', 'Default copy', 'Sanitiser']}
            rows={[
              [<Code key="1">title_text</Code>, '“Unsubscribed”', 'text'],
              [
                <Code key="2">success_message</Code>,
                '“Email {email} is removed.”',
                <Code key="k">wp_kses_post</Code>,
              ],
              [<Code key="3">button_text</Code>, '“Submit Feedback”', 'text'],
              [
                <Code key="4">thank_you_title</Code>,
                '“Thank you for your feedback!”',
                'text',
              ],
              [
                <Code key="5">thank_you_message</Code>,
                '“We greatly appreciate your input…”',
                'text',
              ],
              [
                <Code key="6">home_link_text</Code>,
                '“Back to Home Page”',
                'text',
              ],
              [
                <Code key="7">error_title</Code>,
                '“We’re Sorry, This Link Is No Longer Valid”',
                'text',
              ],
              [
                <Code key="8">error_message</Code>,
                '“The unsubscribe link… invalid or has expired.”',
                <Code key="k2">wp_kses_post</Code>,
              ],
              [
                <Code key="9">resubscribe_title</Code>,
                '“Successfully Re-subscribed!”',
                'text',
              ],
              [
                <Code key="10">resubscribe_message</Code>,
                '“You have been successfully re-subscribed…”',
                'text',
              ],
            ]}
          />
          <Callout tone="warn" title="HTML-allowed fields">
            <p>
              <Code>success_message</Code> and <Code>error_message</Code> render
              unescaped on the public page, so a safe HTML subset is permitted
              via <Code>wp_kses_post</Code> (links, <Code>&lt;br&gt;</Code>,{' '}
              <Code>&lt;strong&gt;</Code> …). Scripts are stripped. The{' '}
              <Code>{'{email}'}</Code> token in <Code>success_message</Code> is
              replaced with the recipient address.
            </p>
          </Callout>
        </Section>

        {/* ── Unsubscribe links (HMAC) ─────────────────────────── */}
        <Section
          id="unsubscribe-links"
          kicker="Security model"
          title="Unsubscribe links (HMAC)"
        >
          <p>
            Every link carries a token derived from the recipient’s address and
            the site’s <Code>AUTH_KEY</Code>. There is no per-link database
            row — the token <em>is</em> the proof, verified with a
            constant-time <Code>hash_equals()</Code> comparison.
          </p>
          <CodeBlock caption="includes/core.php — link generation">{`$token = hash_hmac('sha256', $email, AUTH_KEY);

add_query_arg([
    'flexa_action' => 'unsubscribe', // or 'resubscribe'
    'email'        => urlencode($email),
    'token'        => $token,
], home_url('/'));`}</CodeBlock>
          <p>
            At the public read site <Code>$_GET[&apos;email&apos;]</Code> and{' '}
            <Code>$_GET[&apos;token&apos;]</Code> are unslashed and sanitised (
            <Code>sanitize_email</Code> / <Code>sanitize_text_field</Code>)
            before the HMAC is recomputed and compared. The HMAC token is the
            CSRF protection for these intentionally public links, so a WordPress
            nonce is deliberately not used here.
          </p>
          <Callout tone="security" title="Rotating salts">
            <p>
              Because the token depends only on the email and{' '}
              <Code>AUTH_KEY</Code>, changing the WordPress secret keys
              invalidates all previously-sent links at once. Plan key rotation
              accordingly.
            </p>
          </Callout>
        </Section>

        {/* ── REST API reference ───────────────────────────────── */}
        <Section
          id="rest-api"
          kicker="Developer reference"
          title="REST API reference"
        >
          <p>
            All routes are registered under{' '}
            <Code>/wp-json/flexa-unsubscribe/v1/</Code>. Every route uses a{' '}
            <Code>permission_callback</Code> of{' '}
            <Code>current_user_can(&apos;manage_options&apos;)</Code> — the sole
            exception is <Code>POST /reason</Code>, which is the public feedback
            submission and authenticates with the same HMAC scheme as the
            unsubscribe links. Authenticated requests need the WordPress auth
            cookie plus the <Code>X-WP-Nonce</Code> header from{' '}
            <Code>wp_create_nonce(&apos;wp_rest&apos;)</Code>.
          </p>

          <h3 className="pt-2 text-sm font-semibold text-ink">
            Shared list query parameters
          </h3>
          <p>
            The list endpoints (<Code>/unsubscribes</Code>,{' '}
            <Code>/blocked</Code>, <Code>/resubscribed</Code>) share a paging
            contract and return a uniform envelope:
          </p>
          <Table
            head={['Param', 'Default', 'Bounds']}
            rows={[
              [<Code key="p">page</Code>, '1', 'min 1'],
              [<Code key="pp">per_page</Code>, '20', 'min 1, max 100'],
              [
                <Code key="ob">order_by</Code>,
                'first enum value',
                'per-endpoint column allowlist',
              ],
              [
                <Code key="o">order</Code>,
                'DESC',
                'ASC | DESC (case-insensitive)',
              ],
            ]}
          />
          <CodeBlock caption="List response envelope">{`{
  "items":    [ /* rows */ ],
  "total":    137,
  "page":     1,
  "per_page": 20
}`}</CodeBlock>

          <h3 className="pt-4 text-sm font-semibold text-ink">
            Lists & records
          </h3>
          <Table
            head={['Method', 'Route', 'Purpose']}
            rows={[
              [
                <Method key="1" verb="GET" />,
                <Code key="r1">/unsubscribes</Code>,
                'Paginated unsubscribe list. order_by: unsubscribed_at | email | reason.',
              ],
              [
                <Method key="2" verb="DELETE" />,
                <Code key="r2">/unsubscribes/{'{id}'}</Code>,
                'Delete one unsubscribe row.',
              ],
              [
                <Method key="3" verb="GET" />,
                <Code key="r3">/blocked</Code>,
                'Paginated blocked-attempt log. order_by: blocked_at | email | subject | from_email.',
              ],
              [
                <Method key="4" verb="DELETE" />,
                <Code key="r4">/blocked/{'{id}'}</Code>,
                'Delete one blocked-log row.',
              ],
              [
                <Method key="5" verb="POST" />,
                <Code key="r5">/blocked/clear</Code>,
                'Empty the entire blocked-log table.',
              ],
              [
                <Method key="6" verb="GET" />,
                <Code key="r6">/resubscribed</Code>,
                'Paginated re-subscribed list. order_by: resubscribed_at | email | unsubscribed_at.',
              ],
            ]}
          />

          <h3 className="pt-4 text-sm font-semibold text-ink">Reasons</h3>
          <Table
            head={['Method', 'Route', 'Body / params']}
            rows={[
              [
                <Method key="1" verb="GET" />,
                <Code key="r1">/reasons</Code>,
                'All reasons, sorted (not paginated).',
              ],
              [
                <Method key="2" verb="POST" />,
                <Code key="r2">/reasons</Code>,
                <span key="b">
                  <Code>reason_text</Code> (text), <Code>sort_order</Code> (int)
                </span>,
              ],
              [
                <Method key="3" verb="PUT" />,
                <Code key="r3">/reasons/{'{id}'}</Code>,
                <span key="b">
                  <Code>reason_text</Code>, <Code>sort_order</Code>
                </span>,
              ],
              [
                <Method key="4" verb="DELETE" />,
                <Code key="r4">/reasons/{'{id}'}</Code>,
                'Delete one reason.',
              ],
              [
                <Method key="5" verb="POST" />,
                <Code key="r5">/reasons/reorder</Code>,
                <span key="b">
                  <Code>order</Code>: array of reason IDs in new order
                </span>,
              ],
              [
                <Method key="6" verb="POST" />,
                <Code key="r6">/reason</Code>,
                'Public feedback submit — HMAC-verified, not capability-gated.',
              ],
            ]}
          />

          <h3 className="pt-4 text-sm font-semibold text-ink">
            Analytics & settings
          </h3>
          <Table
            head={['Method', 'Route', 'Params']}
            rows={[
              [
                <Method key="1" verb="GET" />,
                <Code key="r1">/analytics/summary</Code>,
                '—',
              ],
              [
                <Method key="2" verb="GET" />,
                <Code key="r2">/analytics/by-date</Code>,
                <span key="p">
                  <Code>period</Code> (sanitised key)
                </span>,
              ],
              [
                <Method key="3" verb="GET" />,
                <Code key="r3">/analytics/by-reason</Code>,
                <span key="p">
                  <Code>limit</Code> (positive int)
                </span>,
              ],
              [
                <span key="m" className="whitespace-nowrap">
                  <Method verb="GET" /> <Method verb="PUT" />
                </span>,
                <Code key="r4">/settings/general</Code>,
                'See Settings · General.',
              ],
              [
                <span key="m" className="whitespace-nowrap">
                  <Method verb="GET" /> <Method verb="PUT" />
                </span>,
                <Code key="r5">/settings/appearance</Code>,
                'See Settings · Appearance.',
              ],
            ]}
          />
        </Section>

        {/* ── Hooks & filters ──────────────────────────────────── */}
        <Section
          id="hooks"
          kicker="Extensibility"
          title="Hooks & filters"
        >
          <p>
            The supported developer extension point is a single filter that
            lets you augment the config object handed to the React admin app:
          </p>
          <CodeBlock caption="includes/Helpers/Helper.php">{`add_filter('flexa_unsubscribe_js_config', function (array $config) {
    // $config carries the REST root, nonce and CSV-export nonces
    // consumed by the admin SPA. Extend it for custom UI add-ons.
    return $config;
});`}</CodeBlock>
          <p>
            The two <Code>wp_mail</Code> filter callbacks (
            <Code>flexa_tech_su_block_unsubscribed_emails</Code> at priority 5
            and <Code>flexa_auto_append_unsubscribe_link</Code> at priority 10)
            are internal but documented under{' '}
            <a href="#how-it-works" className="text-brand-600 underline">
              How it works
            </a>{' '}
            so integrators understand ordering against their own{' '}
            <Code>wp_mail</Code> hooks.
          </p>
        </Section>

        {/* ── i18n ─────────────────────────────────────────────── */}
        <Section
          id="i18n"
          kicker="Localization"
          title="Internationalization"
        >
          <p>
            Text domain <Code>flexa-unsubscribe</Code>. Both PHP strings (
            <Code>.mo</Code>) and the React admin’s JS strings (script-translation{' '}
            <Code>.json</Code> consumed via{' '}
            <Code>wp_set_script_translations</Code>) are localised. Seven locales
            ship in the box:
          </p>
          <div className="flex flex-wrap gap-2 text-sm">
            {[
              'fr_FR — French',
              'de_DE — German',
              'sv_SE — Swedish',
              'it_IT — Italian',
              'zh_CN — Simplified Chinese',
              'ja — Japanese',
              'ar — Arabic',
            ].map((l) => (
              <span
                key={l}
                className="rounded-md border border-line bg-surface px-3 py-1 text-ink-soft"
              >
                {l}
              </span>
            ))}
          </div>
          <p>
            Regenerate the catalog with{' '}
            <Code>wp i18n make-pot</Code> and{' '}
            <Code>wp i18n make-json --no-purge --pretty-print</Code>. The JS
            translation files are keyed by the md5 of the built admin bundle, so
            re-running <Code>make-json</Code> after a rebuild is required for the
            admin UI to stay translated.
          </p>
          <Callout tone="warn" title="Default copy must stay byte-identical">
            <p>
              The translatable defaults for the footer text and the appearance
              copy are duplicated between the read path (
              <Code>includes/core.php</Code> / templates) and the REST
              controller. They must remain byte-identical so both sides resolve
              the same translation entry.
            </p>
          </Callout>
        </Section>

        {/* ── CSV export ───────────────────────────────────────── */}
        <Section id="csv-export" kicker="Data" title="CSV export">
          <p>
            Each list screen offers a CSV download handled via{' '}
            <Code>admin-post.php</Code>. There are three exports —
            unsubscribes, blocked emails and re-subscribed — each guarded by its
            own nonce (<Code>flexa_export_csv</Code>,{' '}
            <Code>flexa_export_blocked_csv</Code>,{' '}
            <Code>flexa_export_resubscribed_csv</Code>) verified with{' '}
            <Code>check_admin_referer()</Code>.
          </p>
          <Callout tone="security" title="Exports contain PII">
            <p>
              CSV exports include recipient email addresses (and, for blocked
              attempts, message subjects and from-headers). Treat the files as
              sensitive personal data — restrict who can run the export and
              where the files are stored.
            </p>
          </Callout>
        </Section>

        {/* ── Database schema ──────────────────────────────────── */}
        <Section
          id="database"
          kicker="Reference"
          title="Database schema"
        >
          <p>Three tables are provisioned on activation:</p>
          <Table
            head={['Table', 'Key columns']}
            rows={[
              [
                <Code key="t1">wp_flexa_unsubscribes</Code>,
                'id, email (unique), token, reason, unsubscribed_at, resubscribed_at (nullable — set on re-subscribe).',
              ],
              [
                <Code key="t2">wp_flexa_blocked_emails</Code>,
                'id, email, subject, from_email, from_name, headers, blocked_at.',
              ],
              [
                <Code key="t3">wp_flexa_unsubscribe_reasons</Code>,
                'id, reason_text, sort_order, created_at (seeded with 3 defaults).',
              ],
            ]}
          />
          <p>
            A re-subscribe does not delete the unsubscribe row; it stamps{' '}
            <Code>resubscribed_at</Code>, which is what separates the
            “Unsubscribes” and “Re-subscribed” admin lists. The “Blocked
            Emails” list is an independent audit log of <em>send attempts</em>{' '}
            that were stopped — not the opt-out list itself.
          </p>
        </Section>

        {/* ── Changelog ────────────────────────────────────────── */}
        <Section id="changelog" kicker="History" title="Changelog">
          <ChangelogEntry version="3.0.3">
            <li>
              <strong>New:</strong> Customizable unsubscribe email footer — the
              footer heading, button label and button colour are now editable
              from <strong>Settings → General</strong> (previously
              hard-coded).
            </li>
            <li>
              <strong>i18n:</strong> New footer strings translated across all
              seven bundled locales.
            </li>
          </ChangelogEntry>
          <ChangelogEntry version="3.0.2">
            <li>
              <strong>Security:</strong> Sanitise{' '}
              <Code>$_GET[&apos;email&apos;]</Code> /{' '}
              <Code>$_GET[&apos;token&apos;]</Code> at the public read site,
              with the HMAC token documented as the CSRF layer.
            </li>
            <li>
              <strong>Compatibility:</strong> Replace inline{' '}
              <Code>&lt;style&gt;</Code>/<Code>&lt;script&gt;</Code> in the
              public templates with the WordPress enqueue API.
            </li>
            <li>
              <strong>Docs:</strong> Fix the source-repository URL in{' '}
              <Code>readme.txt</Code>.
            </li>
          </ChangelogEntry>
          <ChangelogEntry version="3.0.0">
            <li>
              <strong>Complete admin rewrite</strong> — the seven admin pages
              are now a React SPA (Vite + TypeScript + shadcn/ui + Tailwind v4).
            </li>
            <li>
              <strong>New:</strong> REST API under{' '}
              <Code>/wp-json/flexa-unsubscribe/v1/</Code> covering every screen.
            </li>
            <li>
              <strong>New:</strong> Dashboard charts, live Appearance preview,
              client search + server sort/pagination, bookmarkable URL table
              state.
            </li>
            <li>
              <strong>Security:</strong> CSV export handlers now verify nonces
              via <Code>check_admin_referer()</Code>.
            </li>
            <li>
              <strong>Change:</strong> Menu label “Unsubscribe” at position 60;
              slug changed <Code>flexa-su</Code> → <Code>flexa-unsubscribe</Code>{' '}
              (legacy bookmarks 404). Removed the legacy{' '}
              <Code>flexa_get_analytics_data</Code> AJAX endpoint. Declares{' '}
              <strong>Requires PHP 7.4</strong>.
            </li>
          </ChangelogEntry>
          <ChangelogEntry version="2.0.2">
            <li>Pagination for large lists.</li>
          </ChangelogEntry>
          <ChangelogEntry version="2.0.1">
            <li>Menu refinements.</li>
          </ChangelogEntry>
          <ChangelogEntry version="2.0.0">
            <li>Analytics page introduced.</li>
          </ChangelogEntry>
        </Section>

        <footer className="pt-12 text-sm text-muted">
          <p>
            Flexa Unsubscribe v3.0.3 · documentation generated from the plugin
            source. GPL v2 or later.
          </p>
        </footer>
      </main>
    </div>
  );
}

function ChangelogEntry({
  version,
  children,
}: {
  version: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <h3 className="mb-2 font-mono text-sm font-bold text-brand-700">
        v{version}
      </h3>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-ink-soft">
        {children}
      </ul>
    </div>
  );
}
