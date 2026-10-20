# Circular Resource Intelligence Platform — Beta V2

## What this package does
This package upgrades the exact uploaded six-file website. It preserves the original `data.js`, analytical calculations, charts, GIS, regional comparison and role-based Action Center logic. A separate `beta-auth.js` provides optional real Supabase email-OTP authentication.

## Important limitations
- **Without Supabase configuration** the website runs in its **existing browser-local prototype login mode**, which is not secure authentication.
- **With Supabase configuration** the login uses a verified email link. The user must receive and click the link; the website does not generate or store passwords.
- Analytics are unchanged from the uploaded ZIP and have **not** been independently validated against the final Jupyter notebook.
- The existing website deliberately uses **English only** (`currentLanguage()` returns `'en'`); do not claim complete Hindi/Marathi support. We have not altered working analytical functionality to attempt unreliable partial translation.
- No live browser end-to-end testing or Netlify deployment has been performed by this package builder.

## Step 1: Create Supabase project (recommended for Beta V2)
1. Go to https://supabase.com/dashboard and create a project.
2. In **Authentication → Providers → Email**, enable email OTP/magic-link sign-in.
3. In **Authentication → URL Configuration**, set Site URL to `https://extraordinary-kataifi-e08389.netlify.app` and add `https://extraordinary-kataifi-e08389.netlify.app/**` to redirect URLs.
4. In **Project Settings → API Keys**, copy your **publishable** key (or legacy `anon` key) and Project URL.
5. Open `supabase-config.js` and paste only those two public values. **Never paste a secret or service-role key.**
6. Save the file and deploy. The website switches to email-link sign-in automatically.
7. Test with a real email inbox, including logout and sign-in again.

## Step 2: Update the EXISTING Netlify site
1. Sign in at https://app.netlify.com/ and open the existing site `extraordinary-kataifi-e08389`.
2. Open **Deploys**, then use the manual deploy/drop-folder option (Netlify UI wording may vary).
3. Extract the ZIP and drag the extracted folder containing `index.html` (not the ZIP itself) into the deploy area.
4. Wait for deploy completion and open https://extraordinary-kataifi-e08389.netlify.app/ .
5. Use an incognito window or hard refresh (Ctrl+Shift+R) to avoid cached JavaScript.
6. Do not create a new Netlify site; doing so would give you a different URL and invalidate any QR code for the original URL.

## Step 3: Screenshot and acceptance checklist
- Landing page: correct project title and three waste streams.
- Waste Intelligence: agriculture, plastic and e-waste; compare generation, recovered/processed and gap against the frozen notebook.
- GIS: map loads; state markers are **regional centroids**, not exact facility coordinates; legend matches CRROM.
- Action Center: access requires login; role, sector, subtype and region changes lead to appropriate outputs; do not describe directory entries as guaranteed buyers.
- Compare: two different regions/years; labels and values consistent.
- Knowledge Hub: official portal links open.
- Profile: note that analysis history is browser-local even with Supabase sign-in.
- Test desktop and mobile widths and export/download actions.
- Only after all checks pass, capture screenshots for the Black Book and generate a QR code for the existing live URL.

## Suggested Black Book screenshot captions
1. Beta V2 Landing Page and Resource Recovery Snapshot
2. Waste Intelligence Dashboard — Generation, Recovery and Gap
3. GIS Resource Map — Regional Opportunity Indicators
4. Action Center — Waste Subtype and Region Selection
5. Action Plan — Recovery Pathways and Contact Routes
6. Regional Comparison and Knowledge Hub
