const express = require('express');
const mysql = require('mysql');

const app = express();
const port = 3000;

app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'olakeaseqw123',
  database: 'sedesdb'
});

db.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err);
  } else {
    console.log('Conexión exitosa a la base de datos');
  }
});

app.get('/data', (req, res) => {
  const query = 'SELECT * FROM sedesdb';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener datos de la base de datos:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    } else {
      res.status(200).json(results);
    }
  });
});

