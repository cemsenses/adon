# ADON contact email backend — pending Google authorization

This isolated Worker is intended for the redesigned ADON contact form. It does not change the existing site's Formspree form or the clone's mailto form. Nothing sends until CONTACT_ENABLED is true and the three Google secrets are configured.

## Design

POST https://<deployed-preview-worker-host>/api/contact accepts JSON: name, email, company (optional), solution (optional), message, website (empty honeypot). It sends a plain-text message from and to info@adon.com.tr, setting Reply-To to the visitor. Only the mailbox owner is authorized with Google; site visitors never sign in. Google receives the form contents for email delivery. No third-party form service is used.

The Worker uses Gmail's send-only scope, fixed recipient, bounded input, strict origins, a honeypot, and Cloudflare rate limiting (five requests/minute/IP). Origin checks are not bot authentication. IP limits can affect shared networks and Cloudflare limits are local/eventually consistent. Add Turnstile if actual abuse warrants it. A timeout after Gmail accepts a message may leave delivery uncertain; the endpoint never automatically retries a send. The frontend must disable its submit button during submission and preserve input on failure.

## One-time Google setup (mailbox owner)

1. Open https://console.cloud.google.com/ with the Google Workspace organization account. Create/select an organization-owned project named ADON Website. Enable Gmail API.
2. Configure Google Auth Platform with Internal audience (if available for the organization's project). Request only https://www.googleapis.com/auth/gmail.send. A personal/external project needs its own publishing/consent review; do not leave a production refresh token in an external Testing app, where it may expire in seven days.
3. Create a Web application OAuth client. For the one-time setup via Google's OAuth Playground, authorize redirect URI https://developers.google.com/oauthplayground . In Playground settings choose Use your own OAuth credentials and enter that client's ID/secret there, never in chat or Git.
4. Authorize the gmail.send scope as info@adon.com.tr, with offline access; exchange the authorization code for a refresh token. Use your own client credentials, not Playground's default credentials. No mailbox-read scope is needed.
5. Store GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN as encrypted secrets on the adon-contact-preview Worker. Do not put their values into wrangler.toml, GitHub source, frontend code or this README. Keep the secrets exclusively in the provider's secret interface. Refresh tokens remain revocable and may require reauthorization after account/security changes.

## Activation sequence

1. Review/merge this preparation PR. Run Contact Worker deploy manually in GitHub Actions; this first deploy remains disabled. Existing repository Cloudflare credentials must have access to this new Worker and route; their existence/permissions have not been independently verified for contact deployment.
2. Add the three secrets above in Cloudflare. Confirm the returned workers.dev URL and that rate-limit namespace 912607 is not used by another service. Do not alter /gundem routes.
3. Change CONTACT_ENABLED in wrangler.toml to true and deploy manually again. Secrets are not part of the config file.
4. Send one authorized test request and verify actual receipt in info@adon.com.tr, Reply-To, and an actual reply to the test sender. Unit tests use mocked Google responses and do not prove delivery or live route availability.
5. Only after delivery succeeds, update the clone's form handler to POST the fields as JSON to this endpoint; add the empty website honeypot and loading/success/error UI. Keep the current website design. Test desktop and mobile, CORS from the clone origin and invalid input and repeated submission. Remove the old mailto submit handler when activating the new one.

## Validation

Run `npm test` in contact-worker (Node 22). This tests origins, disabled state, throttling, size, header injection, honeypot, Turkish MIME content, fixed recipient, Reply-To and Google errors. Live Cloudflare/Gmail validation is still required.

References: https://developers.google.com/workspace/gmail/api/guides/sending ; https://developers.google.com/identity/protocols/oauth2/web-server ; https://developers.cloudflare.com/workers/configuration/secrets/ ; https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/

## Clone-first constraint

Only the cloned site is in scope. No routes may be attached to adon.com.tr or www.adon.com.tr at this stage. The Worker is named adon-contact-preview and accepts only the clone origin. Obtain its actual workers.dev URL from the deployment result; do not guess the account subdomain. Do not modify the original form or production branch while preparing this change. Original-domain activation requires a later explicit migration instruction.
