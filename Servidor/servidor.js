import express from 'express';
import mysql from 'mysql';

const app = express();
const port = 3000;

// Middleware para parsear JSON
app.use(express.json());

const db = mysql.createConnection({
    host: 'dam2.colexio-karbo.com',
    port: 3333,
    user: "dam2",
    password: "Ka3b0134679",
    database: "jardin_jbejarmartinez"
})

// Conexión a la BBDD (Comprobacion)

db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la BBDD:', err);
    return;
  }
  console.log('¡Conexión a la BBDD exitosa!');
});

// Ruta principal
app.get('/', (req, res) => {
  res.send('¡Hola, mundo!');
});

// Endpoint reutilizable para leer todos los registros de cualquier tabla
// Toma el nombre de la tabla como parametros.
app.get('/tabla/:nombre', (req, res) => {
  // Obtenemos el nombre de la tabla desde el parámetro de la URL
  const nombreTabla = req.params.nombre;

  // Escapamos el nombre del identificador para evitar inyecciones SQL
  const tablaEscapada = mysql.escapeId(nombreTabla);

  // Construimos la consulta
  const query = `SELECT * FROM ${tablaEscapada}`;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al ejecutar la consulta:', err);
      return res.status(500).json({ error: 'Error al leer los registros de la tabla.' });
    }
    res.json(results);
  });
});

// Endpoint reutilizable para leer un registro de cualquier tabla
// Si quieres construir la consulta para postman, en este caso filtrar usuarios por rol de admin y de fehca seria asi:
// http://localhost:3000/tabla/usuarios/filtrar?rol=admin&fecha=2021-05-01
// Endpoint para leer registros de una tabla con filtros dinámicos
/*app.get('/tabla/:nombre/filtrar', (req, res) => {
  const nombreTabla = req.params.nombre;
  const tablaEscapada = mysql.escapeId(nombreTabla);
  const filtros = req.query;

  let query = `SELECT * FROM ${tablaEscapada} WHERE 1=1`;

  for (const [campo, valor] of Object.entries(filtros)) {
    query += ` AND ${mysql.escapeId(campo)} = ${mysql.escape(valor)}`;
  }

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al ejecutar la consulta:', err);
      return res.status(500).json({ error: 'Error al leer los registros de la tabla con filtros.' });
    }
    res.json(results);
  });
});*/

app.get('/tabla/:nombre/filtrar', (req, res) => {
  const nombreTabla = req.params.nombre;
  const tablaEscapada = mysql.escapeId(nombreTabla);
  const searchTerm = req.query.search;

  if (!searchTerm) {
    return res.status(400).json({ error: 'Parámetro de búsqueda requerido.' });
  }

  // Obtener los nombres de las columnas de la tabla
  db.query(`DESCRIBE ${tablaEscapada}`, (err, columns) => {
    if (err) {
      console.error('Error al obtener columnas:', err);
      return res.status(500).json({ error: 'Error al obtener estructura de la tabla.' });
    }

    // Construir condiciones LIKE para todas las columnas de tipo texto
    const conditions = columns
      .filter(col => col.Type.includes('char') || col.Type.includes('text'))
      .map(col => `${mysql.escapeId(col.Field)} LIKE ${mysql.escape(`%${searchTerm}%`)}`)
      .join(' OR ');

    if (!conditions) {
      return res.json([]);
    }

    const query = `SELECT * FROM ${tablaEscapada} WHERE ${conditions}`;

    db.query(query, (err, results) => {
      if (err) {
        console.error('Error al ejecutar la consulta:', err);
        return res.status(500).json({ error: 'Error al buscar registros.' });
      }
      res.json(results);
    });
  });
});

// Endpoint para insertar registros en cualquier tabla
// Toma el nombre de la tabla como parametros.
// Todos los campos y valores a insertar deben enviarse en el cuerpo de la petición.
// Ejemplo de cuerpo de petición:
// {
//   "nombre": "Juan",
//   "apellido": "Pérez",
//   "edad": 25
// }
app.post('/tabla/:nombre', (req, res) => {
  const nombreTabla = req.params.nombre;
  const tablaEscapada = mysql.escapeId(nombreTabla);
  const datos = req.body;

  const campos = Object.keys(datos).map(campo => mysql.escapeId(campo)).join(', ');
  const valores = Object.values(datos).map(valor => mysql.escape(valor)).join(', ');

  const query = `INSERT INTO ${tablaEscapada} (${campos}) VALUES (${valores})`;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al ejecutar la inserción:', err);
      return res.status(500).json({ error: 'Error al insertar los registros en la tabla.' });
    }
    res.json({ message: 'Registro insertado exitosamente', id: results.insertId });
  });
});

// Endpoint para actualizar registros en cualquier tabla
// Toma el nombre de la tabla como parametros.
// El ID del registro a actualizar debe enviarse en la URL.
// Todos los campos y valores a actualizar deben enviarse en el cuerpo de la petición.
// Endpoint para actualizar registros en cualquier tabla
app.put('/tabla/:nombre/:id', (req, res) => {
  const nombreTabla = req.params.nombre;
  const id = req.params.id;
  const idColumna = req.query.idColumna || 'id'; // Nombre de la columna de identificación, por defecto 'id'
  const tablaEscapada = mysql.escapeId(nombreTabla);
  const datos = req.body;

  const updates = Object.keys(datos).map(campo => `${mysql.escapeId(campo)} = ${mysql.escape(datos[campo])}`).join(', ');

  const query = `UPDATE ${tablaEscapada} SET ${updates} WHERE ${mysql.escapeId(idColumna)} = ${mysql.escape(id)}`;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al ejecutar la actualización:', err);
      return res.status(500).json({ error: 'Error al actualizar los registros en la tabla.' });
    }
    res.json({ message: 'Registro actualizado exitosamente' });
  });
});

// Endpoint para borrar registros en cualquier tabla
// Toma el nombre de la tabla como parametros.
// El ID del registro a borrar debe enviarse en la URL.
// Endpoint para borrar registros en cualquier tabla
app.delete('/tabla/:nombre/:id', (req, res) => {
  const nombreTabla = req.params.nombre;
  const id = req.params.id;
  const idColumna = req.query.idColumna || 'id'; // Nombre de la columna de identificación, por defecto 'id'
  const tablaEscapada = mysql.escapeId(nombreTabla);

  const query = `DELETE FROM ${tablaEscapada} WHERE ${mysql.escapeId(idColumna)} = ${mysql.escape(id)}`;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al ejecutar el borrado:', err);
      return res.status(500).json({ error: 'Error al borrar el registro de la tabla.' });
    }
    res.json({ message: 'Registro borrado exitosamente' });
  });
});

// Endpoint para obtener estructura de la tabla
// Toma el nombre de la tabla como parametros.

app.get('/tabla/:nombre/estructura', (req, res) => {
  const nombreTabla = req.params.nombre;
  const query = `DESCRIBE ${mysql.escapeId(nombreTabla)}`;
  
  db.query(query, (err, results) => {
      if (err) return res.status(500).json({ error: "Error al obtener estructura" });
      res.json(results);
  });
});


// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});