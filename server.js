const express = require('express');
const mysql = require('mysql2');

const app = express();

const bodyParser = require('body-parser');





app.use(bodyParser.json());

const db = mysql.createConnection({
  host: '35.199.97.123',
  user: 'root',
  password: 'bdsedes123',
  database: 'dbSedes',
});

db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conexión a la base de datos establecida');
});

app.get('/allaccounts', (req, res) => {
  db.query('SELECT idPerson, Nombres, Apellidos, FechaNacimiento, Correo, Password, Carnet, Telefono, FechaCreacion, Status, Longitud, Latitud, R.NombreRol FROM Person P INNER JOIN Roles R on R.IdRol = P.IdRol;', (err, results) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err);
      res.status(500).json({ error: 'Error al obtener usuarios' });
      return;
    }
    res.json(results);
  });
});

app.get('/user', (req, res) => {
  const { correo, password } = req.query; // Obtiene el correo y la contraseña de los parámetros de consulta

  if (!correo || !password) {
    return res.status(400).json({ error: 'Debes proporcionar un correo y una contraseña.' });
  }

  // Consulta la base de datos para encontrar un usuario con el correo y la contraseña proporcionados
  db.query('SELECT idPerson, Nombres, Apellidos, FechaNacimiento, Correo, Password, Carnet, Telefono, FechaCreacion, Status, Longitud, Latitud, R.NombreRol FROM Person P INNER JOIN Roles R on R.IdRol = P.IdRol WHERE Correo = ? AND Password = ?', [correo, password], (err, results) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err);
      return res.status(500).json({ error: 'Error al obtener el usuario' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Si se encontró un usuario, lo devuelve como respuesta
    const usuario = results[0];
    res.json(usuario);
  });
});

app.post('/register', (req, res) => {
  // Extrae los datos del cuerpo de la solicitud
  const { Nombres, Apellidos, FechaNacimiento, Correo, Password, Carnet, Telefono, FechaCreacion, Status, Longitud, Latitud, IdRol } = req.body;

  // Inserta los datos en la base de datos
  const query = 'INSERT INTO Person (Nombres, Apellidos, FechaNacimiento, Correo, Password, Carnet, Telefono, FechaCreacion, Status, Longitud, Latitud, IdRol) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [Nombres, Apellidos, FechaNacimiento, Correo, Password, Carnet, Telefono, FechaCreacion, Status, Longitud, Latitud, IdRol];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error al registrar usuario:', err);
      res.status(500).json({ error: 'Error al registrar usuario' });
      return;
    }
    res.json({ message: 'Usuario registrado exitosamente', userId: result.insertId });
  });
});

app.get('/campanas', (req, res) => {

  db.query('SELECT * FROM dbSedes.Campañas WHERE status=1;', (err, results) => {

    if (err) {

      console.error('Error al consultar la base de datos:', err);

      res.status(500).json({ error: 'Error al obtener usuarios' });

      return;

    }

    res.json(results);

  });

});



app.post('/campanas', (req, res) => {
  const { NombreCampaña, Descripcion, Categoria, userId } = req.body;
  const FechaInicio = new Date(req.body.FechaInicio).toISOString().slice(0, 19).replace('T', ' ');
  const FechaFinal = new Date(req.body.FechaFinal).toISOString().slice(0, 19).replace('T', ' ');
  const query = 'INSERT INTO dbSedes.Campañas (NombreCampaña, Descripcion, Categoria, FechaInicio, FechaFinal, userId) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [NombreCampaña, Descripcion, Categoria, FechaInicio, FechaFinal, userId], (err, results) => {
    if (err) {
      console.error('Error al insertar en la base de datos:', err);
      res.status(500).json({ error: 'Error al registrar la campaña' });
      return;
    }
    res.json({ message: 'Campaña registrada exitosamente!', data: req.body });
  });
});



app.put('/campanas/:id', (req, res) => {
  const { idCampañas, NombreCampaña, Descripcion, Categoria, userId } = req.body;
  const FechaInicio = new Date(req.body.FechaInicio).toISOString().slice(0, 19).replace('T', ' ');
  const FechaFinal = new Date(req.body.FechaFinal).toISOString().slice(0, 19).replace('T', ' ');
  const query = 'UPDATE dbSedes.Campañas SET NombreCampaña=?, Descripcion=?, Categoria=?, FechaInicio=?, FechaFinal=?, FechaActualizacion=CURRENT_TIMESTAMP(), userId=? WHERE idCampañas=?';
  db.query(query, [NombreCampaña, Descripcion, Categoria, FechaInicio, FechaFinal, userId, idCampañas], (err, results) => {
    if (err) {
      console.error('Error al Actualizar en la base de datos:', err);
      res.status(500).json({ error: 'Error al Actualizar la campaña' });
      return;
    }
    res.json({ message: 'Campaña Actualizada exitosamente!', data: req.body });
  });
});



app.put('/campanas/delete/:id', (req, res) => {
  const { idCampañas, userId } = req.body;
  const query = 'UPDATE dbSedes.Campañas SET status=0, FechaActualizacion=CURRENT_TIMESTAMP(), userId=? WHERE idCampañas=?';
  db.query(query, [userId, idCampañas], (err, results) => {
    if (err) {
      console.error('Error al Eliminar en la base de datos:', err);
      res.status(500).json({ error: 'Error al Eliminar la campaña' });
      return;
    }
    res.json({ message: 'Campaña Actualizada exitosamente!', data: req.body });
  });
});
// Resto de tu código...



// Configura otros middleware y rutas según sea necesario

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor en funcionamiento en el puerto ${port}`);
});
