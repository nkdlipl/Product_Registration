const db = require('./src/config/db');

async function check() {
  try {
    const result = await db.query('SELECT product_id, product_name, image_url, images FROM products');
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
