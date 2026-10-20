# Circular Resource Intelligence Platform — Beta V2 presentation build

## Scope
This build preserves the supplied dashboard, GIS, sector-specific datasets, CRROM, comparisons, Knowledge Hub, and role-specific Action Center behavior. It is the English-only presentation fallback: full Hindi/Marathi translation of dynamically generated content is not verified and must not be claimed.

## Authentication
The supplied sign-up/login is a **browser-local prototype**, NOT Supabase OTP, secure identity verification, or a multi-user production account system. Do not enter real passwords or personal data. A real Supabase project URL, publishable/anon key, and configured email OTP are required before secure authentication can be implemented and tested.

## Deploy
Upload this folder's files to Netlify or commit them to a GitHub repository and connect Netlify. No build command required. The static files must be at the publish root.

## Screenshot checklist
1. Home page: national indicators and sector choices.
2. Waste Intelligence: agriculture, plastic, e-waste, and regional sorting.
3. GIS: map loads, legend and markers are legible.
4. Compare: sector/regional comparisons.
5. Knowledge Hub: explanatory content.
6. Action Center: select Farmer or Industry, sign up with **fictional demo details**, enter quantity, generate a plan and verify contacts differ by sector and region.
7. Download Action Report and check the result.

## Scientific caveats
CRROM is an opportunity/prioritization index, not recovered percentage. Contact directories are informational leads, not purchase guarantees. All computed results must be checked against the frozen Jupyter results before submission.

## Release status
Syntax checked with Node.js. Live browser functional testing, external map/chart CDN availability, Supabase integration, and full translation are **not** certified.
