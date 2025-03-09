import express from 'express';
import mysql from 'mysql';
import cors from 'cors';
import { initializeApp } from "firebase/app";
import bcrypt from 'bcrypt';
import { getFirestore, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";


const app = express();
const port = 3000;

// Middleware para parsear JSON
app.use(express.json());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const db = mysql.createConnection({
    host: 'dam2.colexio-karbo.com',
    port: 3333,
    user: "dam2",
    password: "Ka3b0134679",
    database: "jardin_jbejarmartinez"
})

const firebaseConfig = {
  apiKey: "AIzaSyBNLWPclcVeFvhjpHBhPubqzktGj5RUB_8",
  authDomain: "oasi-75be2.firebaseapp.com",
  projectId: "oasi-75be2",
  storageBucket: "oasi-75be2.firebasestorage.app",
  messagingSenderId: "159674993109",
  appId: "1:159674993109:web:93a7cbb5a7f874e59f555c"
};


const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);
// Conexión a la BBDD (Comprobacion)

db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la BBDD:', err);
    return;
  }
  console.log('¡Conexión a la BBDD exitosa!');
});


// ==================== FUNCIONES DE SINCRONIZACIÓN ====================

const syncFirebase = {
  Usuarios: {
    insert: async (id, data) => {
      await setDoc(doc(firestore, "users", id.toString()), {
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
        fecha_registro: new Date().toISOString()
      });
    },
    update: async (id, data) => {
      const userRef = doc(firestore, "users", id.toString());
      await updateDoc(userRef, data);
    },
    delete: async (id) => {
      await deleteDoc(doc(firestore, "users", id.toString()));
    }
  },
  
  Jardines: {
    insert: async (id, data) => {
      const gardenRef = doc(firestore, `users/${data.usuario_id}/gardens`, id.toString());
      await setDoc(gardenRef, {
        ubicacion: data.ubicacion,
        configuracion_id: data.configuracion_id,
        estado_riego: 'noregado'
      });
    },
    update: async (id, data) => {
      const gardenRef = doc(firestore, `users/${data.usuario_id}/gardens`, id.toString());
      await updateDoc(gardenRef, data);
    },
    delete: async (id, usuario_id) => {
      await deleteDoc(doc(firestore, `users/${usuario_id}/gardens`, id.toString()));
    }
  },

  Productos: {
    insert: async (id, data) => {
      if(data.tipo_producto === 'planta') {
        const plantaRef = doc(firestore, "products/plants", id.toString());
        await setDoc(plantaRef, {
          nombre: data.nombre,
          descripcion: data.descripcion,
          precio: data.precio
        });
      } else {
        const articuloRef = doc(firestore, "products/tools", id.toString());
        await setDoc(articuloRef, {
          nombre: data.nombre,
          descripcion: data.descripcion,
          precio: data.precio
        });
      }
    },
    delete: async (id, tipo) => {
      const collection = tipo === 'planta' ? 'plants' : 'tools';
      await deleteDoc(doc(firestore, `products/${collection}`, id.toString()));
    }
  }
};

// Ruta principal
app.get('/', (req, res) => {
  res.send('¡Hola, mundo!');
});

//
//
//
//
// Endpoints para MYSQL (Aplicacion de administrador)
//
//
//
//        
//
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
app.post('/tabla/:nombre', async (req, res) => {
  const nombreTabla = req.params.nombre;
  const tablaEscapada = mysql.escapeId(nombreTabla);
  const datos = req.body;

  const campos = Object.keys(datos).map(campo => mysql.escapeId(campo)).join(', ');
  const valores = Object.values(datos).map(valor => mysql.escape(valor)).join(', ');

  const query = `INSERT INTO ${tablaEscapada} (${campos}) VALUES (${valores})`;

  db.query(query, async (err, results) => {
    if (err) {
      console.error('Error al ejecutar la inserción:', err);
      return res.status(500).json({ error: 'Error al insertar el registro' });
    }
    
    try {
      if(syncFirebase[nombreTabla]?.insert) {
        await syncFirebase[nombreTabla].insert(results.insertId, datos);
      }
      res.json({ 
        message: 'Registro insertado exitosamente', 
        id: results.insertId,
        firebase: `Registro sincronizado en Firebase`
      });
    } catch (firebaseError) {
      console.error('Error Firebase:', firebaseError);
      res.status(500).json({ 
        error: 'Registro creado en MySQL pero falló en Firebase',
        mysqlId: results.insertId
      });
    }
  });
});
// Endpoint para actualizar registros en cualquier tabla
// Toma el nombre de la tabla como parametros.
// El ID del registro a actualizar debe enviarse en la URL.
// Todos los campos y valores a actualizar deben enviarse en el cuerpo de la petición.
// Endpoint para actualizar registros en cualquier tabla
app.put('/tabla/:nombre/:id', async (req, res) => {
  const nombreTabla = req.params.nombre;
  const id = req.params.id;
  const idColumna = req.query.idColumna || 'id';
  const tablaEscapada = mysql.escapeId(nombreTabla);
  const datos = req.body;

  const updates = Object.keys(datos).map(campo => 
    `${mysql.escapeId(campo)} = ${mysql.escape(datos[campo])}`
  ).join(', ');

  const query = `UPDATE ${tablaEscapada} SET ${updates} WHERE ${mysql.escapeId(idColumna)} = ${mysql.escape(id)}`;

  db.query(query, async (err, results) => {
    if (err) {
      console.error('Error al actualizar:', err);
      return res.status(500).json({ error: 'Error al actualizar el registro' });
    }
    
    try {
      if(syncFirebase[nombreTabla]?.update) {
        await syncFirebase[nombreTabla].update(id, datos);
      }
      res.json({ 
        message: 'Registro actualizado exitosamente',
        firebase: `Actualización sincronizada en Firebase`
      });
    } catch (firebaseError) {
      console.error('Error Firebase:', firebaseError);
      res.status(500).json({ 
        error: 'Registro actualizado en MySQL pero falló en Firebase'
      });
    }
  });
});
// Endpoint para borrar registros en cualquier tabla
// Toma el nombre de la tabla como parametros.
// El ID del registro a borrar debe enviarse en la URL.
// Endpoint para borrar registros en cualquier tabla
app.delete('/tabla/:nombre/:id', async (req, res) => {
  const nombreTabla = req.params.nombre;
  const id = req.params.id;
  const idColumna = req.query.idColumna || 'id';
  const tablaEscapada = mysql.escapeId(nombreTabla);

  // Obtener datos necesarios para Firebase antes de borrar
  const getQuery = `SELECT * FROM ${tablaEscapada} WHERE ${mysql.escapeId(idColumna)} = ${mysql.escape(id)}`;
  
  db.query(getQuery, async (err, results) => {
    if (err || results.length === 0) {
      console.error('Error al obtener registro:', err);
      return res.status(500).json({ error: 'Error al obtener registro para sincronización' });
    }

    const registro = results[0];
    const deleteQuery = `DELETE FROM ${tablaEscapada} WHERE ${mysql.escapeId(idColumna)} = ${mysql.escape(id)}`;

    db.query(deleteQuery, async (err, deleteResults) => {
      if (err) {
        console.error('Error al borrar:', err);
        return res.status(500).json({ error: 'Error al borrar el registro' });
      }
      
      try {
        if(syncFirebase[nombreTabla]?.delete) {
          // Manejar relaciones especiales
          if(nombreTabla === 'Jardines') {
            await syncFirebase[nombreTabla].delete(id, registro.usuario_id);
          } else if(nombreTabla === 'Productos') {
            await syncFirebase[nombreTabla].delete(id, registro.tipo_producto);
          } else {
            await syncFirebase[nombreTabla].delete(id);
          }
        }
        res.json({ 
          message: 'Registro borrado exitosamente',
          firebase: `Borrado sincronizado en Firebase`
        });
      } catch (firebaseError) {
        console.error('Error Firebase:', firebaseError);
        res.status(500).json({ 
          error: 'Registro borrado en MySQL pero falló en Firebase'
        });
      }
    });
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