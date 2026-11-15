# Logiscool Winter Camps 2026/27 – Dubai Customs landing page

Files
- `index.html` – the page (Tailwind CSS via CDN, brand colours/fonts from the brand book)
- `app.js` – camps, dates, prices, form logic. **Prices and dates are at the top of this file.**
- `google-apps-script/Code.gs` – Google Form + Sheet backend and email notifications
- `assets/` – logos, camp images, and the camp descriptions PDF that parents can download

Open `index.html` in a browser to preview. Until the endpoint is connected the page runs in
**preview mode** (the success screen says "nothing was saved").

## Connect it to Google Forms / Sheets (10 minutes)

1. Go to https://script.google.com → **New project**. Paste all of `Code.gs` over the default file.
2. At the top, set `TEAM_EMAILS` to the address(es) that should be notified.
3. Select the `setup` function → **Run**. Approve the permissions (Forms, Sheets, Mail).
   Open **View > Logs**: it prints the links to the Form and the response Sheet.
   The Sheet gets the Form responses tab (one row per registration) and a **Camp Roster** tab
   (one row per child per camp week – handy for class lists).
4. **Deploy > New deployment > type: Web app**. Execute as: **Me**. Who has access: **Anyone**. Deploy.
5. Copy the Web app URL (ends in `/exec`) into `CONFIG.endpoint` in `app.js`.
6. Open the `/exec` URL in a browser: you should see `{"ok":true,...,"configured":true}`.
7. Optional: run `testSubmission` in the editor to push a fake registration through (check the Sheet + email),
   then delete those test rows.

If you edit `Code.gs` later: **Deploy > Manage deployments > Edit > New version**, otherwise the live URL keeps the old code.

## Pricing rule (confirm this)
Implemented as **per child, per camp week**, list price → Dubai Customs discount:
- Dubai (Cityland, Oasis, Mirdif): AED 1,100 − 30% = AED 770
- Sharjah: AED 680 − 20% = AED 544

The flyers' early-bird / multi-week / sibling offers are not applied. To change anything, edit `PRICING`
in **both** `app.js` and `Code.gs` (the server recalculates the total and ignores the browser's numbers).

## Hosting
Any static host works (Netlify, Vercel, GitHub Pages, your own server). Tailwind is loaded from its CDN, which is fine for a
campaign page; for a permanent site, compile it with the Tailwind CLI.
