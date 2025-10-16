import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const app = express();

const pool = new Pool({
  connectionString: "postgresql://postgres:hxNwZPxwXAJgcmoTstLzFbvDmqklsfyr@postgres.railway.internal:5432/railway"
});

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.send(`✅ Database connected! Time: ${result.rows[0].now}`);
  } catch (err) {
    res.status(500).send("❌ Error connecting to database: " + err.message);
  }
});

app.listen(3000, () => console.log("🚀 Server running on port 3000"));
