const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'restaurant_db',
};

let pool;

async function initDb() {
  pool = await mysql.createPool(dbConfig);

  // Create tables table if not exists
  await pool.query(\`
    CREATE TABLE IF NOT EXISTS tables (
      id INT PRIMARY KEY,
      status ENUM('Available', 'Terisi') NOT NULL,
      timeStart VARCHAR(20),
      duration VARCHAR(20),
      type ENUM('Personal', 'Paket') NOT NULL,
      paket VARCHAR(20)
    )
  \`);

  // Insert initial data if table is empty
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM tables');
  if (rows[0].count === 0) {
    const initialData = [];
    for (let i = 1; i <= 20; i++) {
      initialData.push([
        i,
        i % 2 === 0 ? 'Available' : 'Terisi',
        '13:48:24',
        '00:54:29',
        i % 3 === 0 ? 'Personal' : 'Paket',
        null,
      ]);
    }
    await pool.query(
      'INSERT INTO tables (id, status, timeStart, duration, type, paket) VALUES ?',
      [initialData]
    );
  }
}

app.get('/api/tables', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tables ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tables/:id', async (req, res) => {
  const { id } = req.params;
  const { status, timeStart, duration, type, paket } = req.body;
  try {
    await pool.query(
      'UPDATE tables SET status = ?, timeStart = ?, duration = ?, type = ?, paket = ? WHERE id = ?',
      [status, timeStart, duration, type, paket, id]
    );
    res.json({ message: 'Table updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(\`Server running on port \${PORT}\`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });
