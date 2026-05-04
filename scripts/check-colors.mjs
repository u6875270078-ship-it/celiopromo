import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// T-shirts specifically
const { rows: ts } = await client.query(`
  SELECT COUNT(*) as total,
    COUNT(*) FILTER (WHERE color IS NOT NULL AND color NOT LIKE '% - %' AND LENGTH(color) <= 40) as valid_color,
    COUNT(*) FILTER (WHERE color_images IS NOT NULL) as has_ci
  FROM products WHERE category = 'T-Shirts'
`);
console.log('T-Shirts:', ts[0]);

// Sample T-shirt with color
const { rows: s } = await client.query(`
  SELECT id, name, color, color_images IS NOT NULL as has_ci,
    variants::text LIKE '%"color":null%' as variants_null_color
  FROM products WHERE category = 'T-Shirts' LIMIT 5
`);
console.log('\nT-Shirt samples:');
s.forEach(r => console.log(` ${r.id}: color="${r.color}" ci=${r.has_ci} variantsNullColor=${r.variants_null_color}`));

// One full variant check
const { rows: v } = await client.query(`
  SELECT id, name, color,
    (SELECT jsonb_array_elements(variants::jsonb)->>'color' FROM products p2 WHERE p2.id = p.id LIMIT 1) as first_variant_color
  FROM products p WHERE category = 'T-Shirts' LIMIT 3
`);
console.log('\nFirst variant color:');
v.forEach(r => console.log(` ${r.id} "${r.name.slice(0,40)}" productColor="${r.color}" variantColor="${r.first_variant_color}"`));

await client.end();
