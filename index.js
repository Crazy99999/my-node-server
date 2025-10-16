import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(express.json());

// اتصال قاعدة البيانات
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// نقطة اختبار الاتصال
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "✅ Connected to PostgreSQL successfully!",
      time: result.rows[0].now
    });
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// نقطة تحقق الرخصة (مثال بسيط)
app.post("/api/v1/validate", async (req, res) => {
  const { license, signature } = req.body;
  if (!license || !signature)
    return res.status(400).json({ status: "error", message: "Missing parameters" });

  try {
    const { rows: products } = await pool.query("SELECT * FROM products LIMIT 1");
    if (products.length === 0)
      return res.status(500).json({ status: "error", message: "No product found" });

    const product = products[0];

    // تحقق من سلامة التطبيق
    if (product.signature_hash !== signature)
      return res.status(403).json({ status: "error", message: "Invalid application signature" });

    // تحقق من الرخصة
    const { rows: licenses } = await pool.query("SELECT * FROM licenses WHERE license_key=$1", [license]);
    if (licenses.length === 0)
      return res.status(404).json({ status: "error", message: "Invalid license" });

    const lic = licenses[0];
    const now = Math.floor(Date.now() / 1000);

    if (lic.status === "banned")
      return res.status(403).json({ status: "error", message: "License banned" });

    if (lic.expires_at < now) {
      await pool.query("UPDATE licenses SET status='expired' WHERE id=$1", [lic.id]);
      return res.status(403).json({ status: "error", message: "License expired" });
    }

    return res.json({ status: "success", expires_at: lic.expires_at });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
