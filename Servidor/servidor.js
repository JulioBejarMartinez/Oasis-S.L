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

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});