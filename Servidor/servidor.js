import express from 'express';
import mysql from 'mysql';
import cors from 'cors';
import { initializeApp } from "firebase/app";
import bcrypt from 'bcrypt';
import { getFirestore, doc, setDoc, updateDoc, deleteDoc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { Server } from 'socket.io';
import http from 'http';

// Clave secreta para JWT
const JWT_SECRET = 'tu_clave_secreta_super_segura'; // Cambia esto por una clave real

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

let latestSensorData = null;

// Función para obtener los datos de los sensores
// y guardarlos en Firebase cada minuto

const fetchSensorData = async () => {
  try {
    const response = await axios.get('http://dam2.colexio-karbo.com:6320/datosSensores');
    latestSensorData = response.data;
  } catch (error) {
    console.error('Error al obtener datos de los sensores:', error);
  }
};

setInterval(async () => {
  await fetchSensorData();
  if (latestSensorData) {
    const timestamp = new Date().toISOString();
    try {
      // Parsear los datos recibidos
      const parsedData = JSON.parse(latestSensorData.data);

      // Guardar en tiempoReal
      await setDoc(doc(firestore, "DatosSensores", "tiempoReal"), {
        nivelAgua: parsedData.nivelAgua,
        humedadSuelo: parsedData.humedadSuelo,
        humedadAire: parsedData.humedadAire,
        tempC: parsedData.tempC,
        posicionServo: parsedData.posicionServo,
        timestamp
      });

      // Guardar en un único documento para datos históricos
      const historicoRef = doc(firestore, "DatosSensores", "Globales");
      const historicoDoc = await getDoc(historicoRef);

      let historicoData = [];
      if (historicoDoc.exists()) {
        historicoData = historicoDoc.data().registros || [];
      }

      historicoData.push({
        nivelAgua: parsedData.nivelAgua,
        humedadSuelo: parsedData.humedadSuelo,
        humedadAire: parsedData.humedadAire,
        tempC: parsedData.tempC,
        posicionServo: parsedData.posicionServo,
        timestamp
      });

      await setDoc(historicoRef, { registros: historicoData });

      console.log('Datos de sensores guardados en Firebase');
    } catch (error) {
      console.error('Error al guardar datos en Firebase:', error);
    }
  }
}, 60000);

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
// Endpoints para consumir el servidor de Arduino
//
//
//
//        
//
// Endpoint para obtener los datos actuales de los sensores de firebase
// Endpoint para obtener los datos de los sensores en tiempoReal desde Firebase
app.get('/sensores/tiempoReal', async (req, res) => {
  try {
    const docRef = doc(firestore, "DatosSensores", "tiempoReal");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      res.json(docSnap.data());
    } else {
      res.status(404).json({ error: 'No se encontraron datos en tiempoReal' });
    }
  } catch (error) {
    console.error('Error al obtener datos de tiempoReal:', error);
    res.status(500).json({ error: 'Error al obtener datos de tiempoReal' });
  }
});

// endpoint para obtener datos históricos
// Endpoint modificado en servidor.js
// Modificar el endpoint histórico para incluir conversión
app.get('/sensores/historico', async (req, res) => {
  try {
    const historicoRef = doc(firestore, "DatosSensores", "Globales");
    const historicoDoc = await getDoc(historicoRef);

    if (!historicoDoc.exists()) {
      return res.status(404).json({ error: 'No se encontraron datos históricos' });
    }

    const historicoData = historicoDoc.data().registros || [];
    const veinticuatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const datos = historicoData
      .filter(data => new Date(data.timestamp) >= veinticuatroHorasAtras)
      .map(data => ({
        ...data,
        humedadSuelo: (data.humedadSuelo / 1023 * 100).toFixed(1),
        humedadAire: (data.humedadAire / 1023 * 100).toFixed(1),
        hora: new Date(data.timestamp).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }));

    res.json(datos);
  } catch (error) {
    console.error('Error al obtener histórico:', error);
    res.status(500).json({ error: 'Error al obtener datos históricos' });
  }
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
  const filtros = req.query;

  if (Object.keys(filtros).length === 0) {
    return res.status(400).json({ error: 'Parámetro de búsqueda requerido.' });
  }

  // Obtener los nombres de las columnas de la tabla
  db.query(`DESCRIBE ${tablaEscapada}`, (err, columns) => {
    if (err) {
      console.error('Error al obtener columnas:', err);
      return res.status(500).json({ error: 'Error al obtener estructura de la tabla.' });
    }

    // Construir condiciones para los filtros
    const conditions = Object.keys(filtros)
      .filter(key => columns.some(col => col.Field === key))
      .map(key => `${mysql.escapeId(key)} = ${mysql.escape(filtros[key])}`)
      .join(' AND ');

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

//  Endpoint para verificar el login del usuario.
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // 1. Buscar usuario por email
  const query = `SELECT * FROM Usuarios WHERE email = ?`;
  db.query(query, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    // 2. Verificar si el usuario existe
    if (results.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = results[0];

    // 3. Comparación directa de texto plano
    if (password !== user.contraseña_hash) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 4. Generar token JWT (sin hash)
    const token = jwt.sign(
      { usuario_id: user.usuario_id, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 5. Respuesta exitosa
    res.json({
      token,
      usuario_id: user.usuario_id,
      nombre: user.nombre,
      rol: user.rol
    });
  });
});

// 
//
//
// Endpoints para Firebase y todo lo referente al Cliente
//
//
//

// Endpoint para obtener los datos del usuario y sus jardines desde Firebase
app.get('/usuario/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    // Obtener datos del usuario
    const userDoc = await getDoc(doc(firestore, "users", userId));
    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const userData = userDoc.data();

    // Obtener jardines del usuario
    const gardensQuery = query(collection(firestore, `users/${userId}/gardens`));
    const gardensSnapshot = await getDocs(gardensQuery);
    const gardens = gardensSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Responder con los datos del usuario y sus jardines
    res.json({ user: userData, gardens });
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    res.status(500).json({ error: 'Error al obtener datos del usuario' });
  }
});

app.post('/comprar', async (req, res) => {
  const { userId, productos } = req.body;
  
  try {
    // Verificar si hay productos
    if (!productos || productos.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No hay productos en el carrito' 
      });
    }
    
    // Verificar stock y bloquear productos
    // Modificado para usar callback en lugar de promesas con db.query
    db.query(
      'SELECT producto_id, stock FROM Productos WHERE producto_id IN (?)',
      [productos.map(p => p.producto_id)], 
      (err, stockResults) => {
        if (err) {
          console.error('Error al verificar stock:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Error al verificar disponibilidad de productos' 
          });
        }
        
        // Verificar que hay stock disponible
        const sinStock = productos.filter(p => {
          const stockItem = stockResults.find(s => s.producto_id === p.producto_id);
          return !stockItem || stockItem.stock < 1;
        });
        
        if (sinStock.length > 0) {
          return res.status(400).json({ 
            success: false, 
            message: `Productos sin stock: ${sinStock.map(p => p.nombre).join(', ')}` 
          });
        }
        
        // Crear factura
        const montoTotal = productos.reduce((total, p) => total + parseFloat(p.precio), 0);
        db.query(
          'INSERT INTO Facturas SET ?', 
          { usuario_id: userId, fecha_emision: new Date(), monto_total: montoTotal, estado: 'pendiente' },
          (err, facturaResult) => {
            if (err) {
              console.error('Error al crear factura:', err);
              return res.status(500).json({ 
                success: false, 
                message: 'Error al procesar la factura' 
              });
            }
            
            // Preparar los valores para detalles de factura
            const detallesValues = productos.map(p => [
              facturaResult.insertId, 
              p.producto_id, 
              p.descripcion || p.nombre, 
              1, 
              parseFloat(p.precio)
            ]);
            
            // Insertar detalles de factura
            db.query(
              'INSERT INTO DetallesFactura (factura_id, producto_id, descripcion, cantidad, precio_unitario) VALUES ?',
              [detallesValues],
              (err) => {
                if (err) {
                  console.error('Error al insertar detalles:', err);
                  return res.status(500).json({ 
                    success: false, 
                    message: 'Error al registrar detalles de la compra' 
                  });
                }
                
                // Actualizar stock
                const productoIds = productos.map(p => p.producto_id);
                db.query(
                  'UPDATE Productos SET stock = stock - 1 WHERE producto_id IN (?)',
                  [productoIds],
                  (err) => {
                    if (err) {
                      console.error('Error al actualizar stock:', err);
                      return res.status(500).json({ 
                        success: false, 
                        message: 'Error al actualizar inventario' 
                      });
                    }
                    
                    // Todo correcto
                    res.json({ 
                      success: true,
                      facturaId: facturaResult.insertId,
                      message: 'Compra realizada con éxito'
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Error en compra:', error);
    res.status(500).json({ success: false, message: 'Error al procesar la compra' });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});