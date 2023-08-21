const express = require('express');
const mysql = require('mysql');

const app = express();
const port = 3000;
const bodyParser = require('body-parser');
//app.use(express.json());

app.use(bodyParser.json({ limit: '50mb' }));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1717',
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
  const query = 'SELECT * FROM ubications';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener datos de la base de datos:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    } else {
      res.status(200).json(results);
    }
  });
});

app.post('/data/add', async (req, res) => {
  const data = req.body.data;
  const query = 'INSERT INTO ubications (name, latitude, longitude) VALUES (?, ?, ?)';
  const query1 = 'DELETE FROM ubications';
  db.query(query1, (err, res)=>{});
  const promises = data.map(element => {
    return new Promise((resolve, reject) => {
      db.query(query, [element[0], element[1], element[2]], (err, results) => {
        if (err) {
        reject(err);
        } else {
        resolve(results);
        }
      });
    });
  });
  
  try {
  await Promise.all(promises);
  res.status(200).json({ message: 'Data added successfully' });
  } catch (err) {
    console.error('Error al insertar datos en la base de datos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.listen(port, () => {
console.log(`http://localhost:${port}`);
})
