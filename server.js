const express = require('express');
const mysql = require('mysql2');

const app = express();

const db = mysql.createConnection({
  host: '35.199.97.123',
  user: 'root',
  password: 'sedesdb123',
  database: 'dbSedes',
});

db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conexión a la base de datos establecida');
});

app.get('/campanas', (req, res) => {
  db.query('SELECT * FROM dbSedes.Campañas;', (err, results) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err);
      res.status(500).json({ error: 'Error al obtener usuarios' });
      return;
    }
    res.json(results);
  });
});

// Configura otros middleware y rutas según sea necesario

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor en funcionamiento en el puerto ${port}`);
});
