TOBAKKSBUTIKK – STABIL DEPLOY-VERSJON

Denne versjonen er bevisst bygget uten Next.js build-trinn.
Den kan publiseres direkte på Vercel uten app/pages-feilen.

Filer som skal ligge i GitHub root:
- index.html
- admin.html
- cart.html
- styles.css
- app.js
- admin.js
- cart.js
- vercel.json
- sample_products_import.csv

Admin:
https://DITT-DOMENE/admin

Viktig:
Admin lagrer foreløpig data i nettleserens localStorage.
Neste steg er Supabase database og login, uten å endre designet eller starte på nytt.
