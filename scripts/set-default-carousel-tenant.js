// const TENANT_ID = process.argv[2];

// if (!TENANT_ID) {
//   console.error('Usage: node scripts/set-default-carousel-tenant.js <tenantId>');
//   process.exit(1);
// }

// const API_BASE_URL = (process.env.API_BASE_URL || 'https://systemnextit.com').replace(/\/$/, '');

// const DEFAULT_CAROUSEL_ITEMS = [
//   {
//     id: 'default-carousel-1',
//     name: 'Default Carousel 1',
//     image: 'https://hdnfltv.com/image/nitimages/hero1.webp',
//     mobileImage: 'https://hdnfltv.com/image/nitimages/hero1.webp',
//     url: '#',
//     urlType: 'External',
//     serial: 1,
//     status: 'Publish'
//   },
//   {
//     id: 'default-carousel-2',
//     name: 'Default Carousel 2',
//     image: 'https://hdnfltv.com/image/nitimages/hero2.webp',
//     mobileImage: 'https://hdnfltv.com/image/nitimages/hero2.webp',
//     url: '#',
//     urlType: 'External',
//     serial: 2,
//     status: 'Publish'
//   },
//   {
//     id: 'default-carousel-3',
//     name: 'Default Carousel 3',
//     image: 'https://hdnfltv.com/image/nitimages/hero3.webp',
//     mobileImage: 'https://hdnfltv.com/image/nitimages/hero3.webp',
//     url: '#',
//     urlType: 'External',
//     serial: 3,
//     status: 'Publish'
//   }
// ];

// const getUrl = `${API_BASE_URL}/api/tenant-data/${encodeURIComponent(TENANT_ID)}/website_config`;

// const main = async () => {
//   console.log(`[carousel-default] Target tenant: ${TENANT_ID}`);
//   console.log(`[carousel-default] API: ${API_BASE_URL}`);

//   const getRes = await fetch(getUrl, { method: 'GET' });
//   if (!getRes.ok) {
//     const text = await getRes.text();
//     throw new Error(`GET failed: ${getRes.status} ${getRes.statusText} :: ${text}`);
//   }

//   const getJson = await getRes.json();
//   const current = getJson?.data ?? null;

//   const currentCount = Array.isArray(current?.carouselItems) ? current.carouselItems.length : 0;
//   console.log(`[carousel-default] Current carousel count: ${currentCount}`);

//   const updated = {
//     ...(current && typeof current === 'object' ? current : {}),
//     carouselItems: DEFAULT_CAROUSEL_ITEMS
//   };

//   const putRes = await fetch(getUrl, {
//     method: 'PUT',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ data: updated })
//   });

//   if (!putRes.ok) {
//     const text = await putRes.text();
//     throw new Error(`PUT failed: ${putRes.status} ${putRes.statusText} :: ${text}`);
//   }

//   console.log('[carousel-default] ✅ Updated website_config.carouselItems');

//   // Verify
//   const verifyRes = await fetch(getUrl, { method: 'GET' });
//   if (!verifyRes.ok) {
//     console.warn(`[carousel-default] Warning: verify GET failed: ${verifyRes.status} ${verifyRes.statusText}`);
//     return;
//   }
//   const verifyJson = await verifyRes.json();
//   const verify = verifyJson?.data ?? null;
//   const verifyCount = Array.isArray(verify?.carouselItems) ? verify.carouselItems.length : 0;
//   console.log(`[carousel-default] Verified carousel count: ${verifyCount}`);
// };

// main().catch((err) => {
//   console.error('[carousel-default] ❌ Failed:', err?.message || err);
//   process.exit(1);
// });
