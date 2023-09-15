const express = require('express');
const mysql = require('mysql2');

const app = express();

const bodyParser = require('body-parser');

const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado');

  socket.on('chat message', (msg) => {
    console.log('Mensaje recibido:', msg);
    //io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('Un usuario se ha desconectado');
  });
});



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

////////////
app.post('/sendmessage', (req, res) => {
  const { idPerson, mensaje, idChat } = req.body;

  const query = 'INSERT INTO dbSedes.Mensajes(idPerson, mensaje, idChat) VALUES(?, ?, ?);';
  db.query(query, [idPerson, mensaje, idChat], (err, result) => {
    if (err) {
      console.error('Error al insertar el mensaje:', err);
      return res.status(500).json({ error: 'Error al enviar el mensaje' });
    }

    // Emitir el mensaje a otros clientes a través de socket.io
    io.emit('chat message', mensaje);

    res.json({ message: 'Mensaje enviado exitosamente' });
  });
});

app.get('/getmessage/:id', (req, res) => {
  const id = req.params.id;

  const query = 'SELECT * FROM Mensajes WHERE idChat = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err);
      res.status(500).json({ error: 'Error al obtener usuarios' });
      return;
    }
    res.json(results);
  });;
});

app.get('/getchats/:id', (req, res) => {
  const id = req.params.id;

  const query = 'WITH LastMessageDates AS ( \
    SELECT  \
        idChat,  \
        MAX(fechaRegistro) as LastDate \
    FROM dbSedes.Mensajes \
    GROUP BY idChat \
)\
SELECT C.* \
FROM dbSedes.Chats C \
LEFT JOIN LastMessageDates LMD ON C.idChats = LMD.idChat \
WHERE C.idPerson =? OR C.idPersonDestino=? \
ORDER BY LMD.LastDate DESC;';
  db.query(query, [id, id], (err, results) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err);
      res.status(500).json({ error: 'Error al obtener usuarios' });
      return;
    }
    res.json(results);
  });;
});

app.get('/getnamespersondestino/:id', (req, res) => {
  const id = req.params.id;

  const query = "WITH LastMessages AS ( \
    SELECT  \
        idChat, \
        MAX(fechaRegistro) as LastDate \
    FROM dbSedes.Mensajes \
    GROUP BY idChat \
) \
SELECT P.Nombres, COALESCE(M.mensaje, '') as mensaje \
FROM dbSedes.Person P \
LEFT JOIN dbSedes.Chats C ON C.idPersonDestino = P.idPerson \
LEFT JOIN dbSedes.Mensajes M ON M.idChat = C.idChats \
LEFT JOIN LastMessages LM ON LM.idChat = M.idChat \
WHERE C.idPerson = ? OR C.idPersonDestino=? AND LM.LastDate = M.fechaRegistro \
ORDER BY M.fechaRegistro DESC;";
  db.query(query, [id, id], (err, results) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err);
      res.status(500).json({ error: 'Error al obtener usuarios' });
      return;
    }
    res.json(results);
  });;
});


/////////




app.get('/allaccounts', (req, res) => {
  db.query('  SELECT idPerson, Nombres, Apellidos, FechaNacimiento, Correo, Password, Carnet, Telefono, FechaCreacion, Status, Longitud, Latitud, R.NombreRol FROM Person P INNER JOIN Roles R on R.IdRol = P.IdRol WHERE P.IdRol = 1 OR P.IdRol = 2 OR P.IdRol = 3;', (err, results) => {
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

app.get('/cardholderbyuser/:id', (req, res) => {
  const { id } = req.params;

  db.query('SELECT P.idPerson, P.Nombres, P.Apellidos, P.FechaNacimiento, P.Correo, P.Password, P.Carnet, P.Telefono, P.FechaCreacion, P.Status, P.Longitud, P.Latitud, R.NombreRol \
  FROM Person P \
  INNER JOIN Roles R on R.IdRol = P.IdRol \
  WHERE P.idPerson = (select idJefeCampaña from Cardholder WHERE idPerson = ?);',
    [id], (err, results) => {
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


app.put('/update/:id', (req, res) => {
  const { id, Nombres, Apellidos, Carnet, Telefono, IdRol, Latitud, Longitud, Correo } = req.body;
  const FechaNacimiento = new Date(req.body.FechaNacimiento).toISOString().slice(0, 19).replace('T', ' ');
  const query = 'UPDATE dbSedes.Person SET Nombres=?, Apellidos=?, FechaNacimiento=?, Carnet=?, Telefono=?, IdRol=?, Latitud=?, Longitud=?,Correo=? WHERE idPerson=?';
  db.query(query, [Nombres, Apellidos, FechaNacimiento, Carnet, Telefono, IdRol, Latitud, Longitud, Correo, id], (err, results) => {
    if (err) {
      console.error('Error al Actualizar en la base de datos:', err);
      res.status(500).json({ error: 'Error al Actualizar la persona' });
      return;
    }
    res.json({ message: 'Persona Actualizada exitosamente!', data: req.body });
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
    res.json({ message: 'Campaña Eliminada exitosamente!', data: req.body });
  });
});

//pasar
app.get('/nextidcampanas', (req, res) => {
  db.query('select MAX(idPerson) AS AUTO_INCREMENT FROM dbSedes.Campañas', (err, results) => {
    if (err) {

      console.error('Error al consultar la base de datos:', err);

      res.status(500).json({ error: 'Error al obtener id' });

      return;

    }

    res.json(results);

  });

});



//pasar

app.get('/nextidperson', (req, res) => {

  db.query('select MAX(idPerson) AS AUTO_INCREMENT FROM dbSedes.Person', (err, results) => {

    if (err) {

      console.error('Error al consultar la base de datos:', err);

      res.status(500).json({ error: 'Error al obtener id' });

      return;

    }

    res.json(results);

  });

});

//pasar

app.post('/registerjefecarnetizador', (req, res) => {
  const { idPerson, idJefeCampaña } = req.body;
  const query = 'INSERT INTO Cardholder (idPerson, idJefeCampaña) VALUES (?, ?);';
  const values = [idPerson, idJefeCampaña];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error al registrar CardHolder:', err);
      res.status(500).json({ error: 'Error al registrar CardHolder' });
      return;
    }
    res.json({ message: 'CardHolder registrado exitosamente', userId: result.insertId });
  });
});

app.put('/updatejefecarnetizador', (req, res) => {
  const { idPerson, idJefeCampaña } = req.body;
  const query = 'UPDATE Cardholder SET idJefeCampaña=? WHERE idPerson=?;';
  const values = [idJefeCampaña, idPerson];
  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error al actualizar CardHolder:', err);
      res.status(500).json({ error: 'Error al actualizar CardHolder' });
      return;
    }
    res.json({ message: 'CardHolder actualizado exitosamente', userId: result.insertId });
  });
});

app.get('/getpersonbyid/:id', (req, res) => {
  const { id } = req.params;

  db.query('SELECT P.idPerson, P.Nombres, P.Apellidos, P.FechaNacimiento, P.Correo, P.Password, P.Carnet, P.Telefono, P.FechaCreacion, P.Status, P.Longitud, P.Latitud, R.NombreRol \
  FROM Person P \
  INNER JOIN Roles R on R.IdRol = P.IdRol \ WHERE idPerson = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err);
      return res.status(500).json({ error: 'Error al obtener la persona' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Persona no encontrada' });
    }

    // Si se encontró una persona, la devuelve como respuesta
    const persona = results[0];
    res.json(persona);
  });
});

app.put('/updatepersona/:id', (req, res) => {
  const { id, Nombres, Apellidos, Carnet, Password, Telefono, IdRol, Latitud, Longitud, Correo } = req.body;
  const FechaNacimiento = new Date(req.body.FechaNacimiento).toISOString().slice(0, 19).replace('T', ' ');
  const query = 'UPDATE dbSedes.Person SET Nombres = ?, \
      Apellidos = ?, \
      FechaNacimiento = ?, \
      Correo = ?, \
      Password = ?\
      Carnet = ?, \
      Telefono = ?, \
      IdRol = ?, \
      Latitud = ?, \
      Longitud = ? \
      WHERE idPerson = ?';
  db.query(query, [Nombres, Apellidos, FechaNacimiento, Correo, Password, Carnet, Telefono, IdRol, Latitud, Longitud, id], (err, results) => {
    if (err) {
      console.error('Error al Actualizar en la base de datos:', err);
      res.status(500).json({ error: 'Error al Actualizar la persona' });
      return;
    }
    res.json({ message: 'Persona Actualizada exitosamente!', data: req.body });
  });
});

app.get('/userbyrol', (req, res) => {
  const { correo, password } = req.query; // Obtiene el correo y la contraseña de los parámetros de consulta

  if (!correo || !password) {
    return res.status(400).json({ error: 'Debes proporcionar un correo y una contraseña.' });
  }

  // Consulta la base de datos para encontrar un usuario con el correo y la contraseña proporcionados
  db.query('SELECT P.idPerson, P.Nombres, P.Apellidos, P.FechaNacimiento, P.Correo, P.Password, P.Carnet, \
  P.Telefono, P.FechaCreacion, P.Status, P.Longitud, P.Latitud, R.NombreRol \
  FROM Person P \
  INNER JOIN Roles R on R.IdRol = P.IdRol \
  WHERE P.Correo = ? AND P.Password = ?',
    [correo, password], (err, results) => {
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
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log('Servidor escuchando en http://localhost:3000');
});

