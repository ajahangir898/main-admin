// Minimal manual check script: confirms that tenant-data PUT accepts JSON bodies.
// Usage (PowerShell):
//   node scripts/verify-products-save.js http://localhost:5000 TENANT_ID
// Adjust base URL/tenantId as needed.

const baseUrl = process.argv[2] || 'http://localhost:5000';
const tenantId = process.argv[3];

if (!tenantId) {
  console.error('Missing tenantId. Example: node scripts/verify-products-save.js http://localhost:5000 <TENANT_ID>');
  process.exit(1);
}

const run = async () => {
  const key = 'products';
  const url = `${baseUrl}/api/tenant-data/${encodeURIComponent(tenantId)}/${key}`;

  const testProduct = {
    id: Date.now(),
    name: `Verify Save ${new Date().toISOString()}`,
    price: 123,
    image: '/uploads/images/test.webp',
    status: 'Active'
  };

  // Fetch current
  const beforeRes = await fetch(url, { headers: { Accept: 'application/json' } });
  const beforeJson = await beforeRes.json();
  const before = Array.isArray(beforeJson?.data) ? beforeJson.data : [];

  const next = [...before, testProduct];

  const putRes = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ data: next })
  });

  if (!putRes.ok) {
    const text = await putRes.text();
    throw new Error(`PUT failed: ${putRes.status} ${putRes.statusText}: ${text}`);
  }

  // Fetch again
  const afterRes = await fetch(url, { headers: { Accept: 'application/json' } });
  const afterJson = await afterRes.json();
  const after = Array.isArray(afterJson?.data) ? afterJson.data : [];

  const found = after.some((p) => p && p.id === testProduct.id);
  console.log(found ? 'OK: product saved and reloaded.' : 'FAILED: product not found after save.');
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
