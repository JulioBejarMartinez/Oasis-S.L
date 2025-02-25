import express from 'express';
import cors from 'cors';
import mysql from 'mysql';
import { initializeApp } from "firebase/app";
import { deleteDoc, getFirestore, collectionGroup, getDocs, addDoc, collection, query, where, doc, updateDoc } from "firebase/firestore";
import { Server } from 'socket.io';
import http from 'http';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Asegúrate de que esto coincida con el origen de tu cliente
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

app.use(express.json());
app.use(cors());
const puerto = 4000;

const db=mysql.createConnection({
    host: 'dam2.colexio-karbo.com',
    port: 3333,
    user: "dam2",
    password: "Ka3b0134679",
    database: "kahoot_jbejar"
})

const firebaseConfig = {
    apiKey: "AIzaSyDBZcL-8thgXMjpwZG5eLUvyKerLP5GiMs",
    authDomain: "prueba1-7c2a2.firebaseapp.com",
    projectId: "prueba1-7c2a2",
    storageBucket: "prueba1-7c2a2.firebasestorage.app",
    messagingSenderId: "346603900815",
    appId: "1:346603900815:web:ce80edc53c4aeb63e485fa"
};

const firebaseApp = initializeApp(firebaseConfig);
const dbFirestore = getFirestore(firebaseApp);

const deleteTimers = {};

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('joinRoom', async ({ pin, jugador }) => {
        socket.join(pin);

        if(deleteTimers[pin]) {
            clearTimeout(deleteTimers[pin]);
            delete deleteTimers[pin];
        }

        // Actualizar la base de datos con el nuevo jugador si no está ya en la sala
        const q = query(collection(dbFirestore, 'partidas'), where("pin_de_la_sala", "==", pin));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const partidaDoc = querySnapshot.docs[0];
            const partidaData = partidaDoc.data();
            const jugadorExistente = partidaData.jugadores.find(j => j.id === jugador.id);
            if (!jugadorExistente) {
                const jugadoresActualizados = [...partidaData.jugadores, { ...jugador, socketId: socket.id }];
                await updateDoc(doc(dbFirestore, 'partidas', partidaDoc.id), { jugadores: jugadoresActualizados });

                // Emitir evento a todos los clientes en la sala
                io.to(pin).emit('newPlayer', jugador);
                io.to(pin).emit('jugadoresActualizados', jugadoresActualizados);
            }
        }
    });

    socket.on('siguientePregunta', ({ pin, nuevaPregunta }) => {
        io.to(pin).emit('actualizarPregunta', nuevaPregunta);
    });

    socket.on('leaveRoom', async ({ pin, jugador }) => {
        socket.leave(pin);

        // Actualizar la base de datos para eliminar al jugador
        const q = query(collection(dbFirestore, 'partidas'), where("pin_de_la_sala", "==", pin));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const partidaDoc = querySnapshot.docs[0];
            const partidaData = partidaDoc.data();
            const jugadoresActualizados = partidaData.jugadores.filter(j => j.id !== jugador.id);

            if(jugadoresActualizados.length === 0) {
                // Iniciar el temporizador de eliminación si no quedan jugadores
                deleteTimers[pin] = setTimeout(async () => {
                    await deleteDoc(doc(dbFirestore, 'partidas', partidaDoc.id));
                    delete deleteTimers[pin];
                }, 60000); // 60 segundos
            } else{
                await updateDoc(doc(dbFirestore, 'partidas', partidaDoc.id), { jugadores: jugadoresActualizados });
            }
            // Emitir evento a todos los clientes en la sala
            io.to(pin).emit('playerLeft', jugador);
        }
    });

    socket.on('actualizarPuntuacion', async ({ pin, jugadorId, incremento }) => {
        try {
            const q = query(collection(dbFirestore, 'partidas'), where("pin_de_la_sala", "==", pin));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const partidaDoc = querySnapshot.docs[0];
                const partidaData = partidaDoc.data();
                const jugador = partidaData.jugadores.find(j => j.id === jugadorId);
                
                if (jugador) {
                    // Emitir actualización a todos los clientes
                    io.to(pin).emit('puntuacionActualizada', {
                        jugadorId,
                        puntos: jugador.puntos + incremento
                    });
                }
            }
        } catch (error) {
            console.error('Error actualizando puntuación:', error);
        }
    });


    socket.on('disconnect', async () => {
        console.log('user disconnected');

        // Obtener las salas a las que el socket estaba unido
        const rooms = Array.from(socket.rooms).filter(room => room !== socket.id);

        for (const pin of rooms) {
            // Obtener la partida correspondiente al pin
            const q = query(collection(dbFirestore, 'partidas'), where("pin_de_la_sala", "==", pin));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const partidaDoc = querySnapshot.docs[0];
                const partidaData = partidaDoc.data();

                // Encontrar el jugador desconectado
                const jugadorDesconectado = partidaData.jugadores.find(j => j.socketId === socket.id);
                if (jugadorDesconectado) {
                    // Actualizar la base de datos para eliminar al jugador
                    const jugadoresActualizados = partidaData.jugadores.filter(j => j.socketId !== socket.id);
                    if(jugadoresActualizados.length === 0) {
                        // Iniciar el temporizador de eliminación si no quedan jugadores
                        deleteTimers[pin] = setTimeout(async () => {
                        await deleteDoc(doc(dbFirestore, 'partidas', partidaDoc.id));
                        delete deleteTimers[pin];
                        }, 60000); // 60 segundos
                    } else{
                        await updateDoc(doc(dbFirestore, 'partidas', partidaDoc.id), { jugadores: jugadoresActualizados });
                    }

                    // Emitir evento a todos los clientes en la sala
                    io.to(pin).emit('playerLeft', jugadorDesconectado);
                }
            }
        }
    });

    socket.on('startGame', async ({ pin }) => {
        io.to(pin).emit('partidaIniciada');
    });

});

app.get('/', (req, res) => {
    res.json('Oh Yeah!')
});

app.put('/partidas', async (req, res) => {
    const collectionName = 'partidas';
    const { nombre_de_la_sala, pin_de_la_sala, cuestionario_id, creador_id, creador_nombre } = req.body;
    const docData = { 
        nombre_de_la_sala, 
        pin_de_la_sala, 
        cuestionario_id,
        jugadores: [{ id: creador_id, nombre: creador_nombre }] // Agregar el creador al array de jugadores
    };
    try {
        await addDoc(collection(dbFirestore, collectionName), docData);
        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Error adding document:', error);
        res.status(500).json({ error: 'Error adding document' });
    }
});

app.get('/partidas/:pin', async (req, res) => {
    const collectionName = 'partidas';
    const pin = req.params.pin;
    const partidas = [];
    try {
        const q = query(collection(dbFirestore, collectionName), where("pin_de_la_sala", "==", pin));
        const querySnapshot = await getDocs(q);
        for (const doc of querySnapshot.docs) {
            const partida = { id: doc.id, ...doc.data() };
            const cuestionarioId = partida.cuestionario_id;
            const cuestionarioQuery = `SELECT titulo FROM Cuestionarios WHERE id = ${cuestionarioId}`;
            db.query(cuestionarioQuery, (err, data) => {
                if (err) {
                    console.error('Error getting cuestionario:', err);
                    res.status(500).json({ error: 'Error getting cuestionario' });
                    return;
                }
                if (data.length > 0) {
                    partida.cuestionario_nombre = data[0].titulo;
                } else {
                    partida.cuestionario_nombre = 'Cuestionario no encontrado';
                }

                // Obtener preguntas del cuestionario
                const preguntasQuery = `SELECT * FROM Preguntas WHERE cuestionario_id = ${cuestionarioId}`;
                db.query(preguntasQuery, (err, preguntas) => {
                    if (err) {
                        console.error('Error getting preguntas:', err);
                        res.status(500).json({ error: 'Error getting preguntas' });
                        return;
                    }
                    const preguntasIds = preguntas.map(p => p.id);
                    if (preguntasIds.length === 0) {
                        partida.preguntas = [];
                        partidas.push(partida);
                        if (partidas.length === querySnapshot.docs.length) {
                            res.json(partidas);
                        }
                    } else {
                        const opcionesQuery = `SELECT * FROM Opciones WHERE pregunta_id IN (${preguntasIds.join(',')})`;
                        db.query(opcionesQuery, (err, opciones) => {
                            if (err) {
                                console.error('Error getting opciones:', err);
                                res.status(500).json({ error: 'Error getting opciones' });
                                return;
                            }
                            const preguntasConOpciones = preguntas.map(pregunta => ({
                                ...pregunta,
                                opciones: opciones.filter(opcion => opcion.pregunta_id === pregunta.id)
                            }));
                            partida.preguntas = preguntasConOpciones;
                            partidas.push(partida);
                            if (partidas.length === querySnapshot.docs.length) {
                                res.json(partidas);
                            }
                        });
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error getting documents:', error);
        res.status(500).json({ error: 'Error getting documents' });
    }
});

app.post('/partidas/:pin/jugadores', async (req, res) => {
    const { pin } = req.params;
    const { jugador } = req.body;
    console.log('Añadiendo jugador:', jugador);
    try {
        const q = query(collection(dbFirestore, 'partidas'), where("pin_de_la_sala", "==", pin));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const partidaDoc = querySnapshot.docs[0];
            const partidaData = partidaDoc.data();
            const jugadoresActualizados = [...partidaData.jugadores, jugador];
            await updateDoc(doc(dbFirestore, 'partidas', partidaDoc.id), { jugadores: jugadoresActualizados });
            res.json({ status: 'ok' });
        } else {
            res.status(404).json({ error: 'Partida no encontrada' });
        }
    } catch (error) {
        console.error('Error actualizando jugadores:', error);
        res.status(500).json({ error: 'Error actualizando jugadores' });
    }
});

// Modifica este endpoint para manejar incrementos de puntos
app.put('/partidas/:pin/jugadores/:jugadorId/puntos', async (req, res) => {
    const { pin, jugadorId } = req.params;
    const { incremento } = req.body; // Cambiar de puntos a incremento
    
    try {
        const q = query(collection(dbFirestore, 'partidas'), where("pin_de_la_sala", "==", pin));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const partidaDoc = querySnapshot.docs[0];
            const partidaData = partidaDoc.data();
            const jugadorIndex = partidaData.jugadores.findIndex(j => j.id === jugadorId);
            
            if (jugadorIndex !== -1) {
                const jugadoresActualizados = [...partidaData.jugadores];
                // Añadir campo puntos si no existe
                if(!jugadoresActualizados[jugadorIndex].puntos) {
                    jugadoresActualizados[jugadorIndex].puntos = 0;
                }
                // Incrementar puntos
                jugadoresActualizados[jugadorIndex].puntos += incremento;
                
                await updateDoc(doc(dbFirestore, 'partidas', partidaDoc.id), { 
                    jugadores: jugadoresActualizados 
                });
                
                // Emitir actualización a todos los clientes
                io.to(pin).emit('puntuacionActualizada', {
                    jugadorId,
                    puntos: jugadoresActualizados[jugadorIndex].puntos
                });
                
                res.json({ status: 'ok' });
            } else {
                res.status(404).json({ error: 'Jugador no encontrado' });
            }
        } else {
            res.status(404).json({ error: 'Partida no encontrada' });
        }
    } catch (error) {
        console.error('Error actualizando puntos:', error);
        res.status(500).json({ error: 'Error actualizando puntos' });
    }
});


app.get('/cuestionarios', (req, res) => {
    const sql = "SELECT * FROM Cuestionarios";
    db.query(sql,(err,data)=>{
        if(err) return res.json(err);
        return res.json(data);
    })
})

app.get('/usuarios', (req, res) => {
    const sql = "SELECT * FROM `Usuarios` order by nombre";
    db.query(sql,(err,data)=>{
        if(err) return res.json(err);
        return res.json(data);
    })
})

app.put('/cuestionarios', (req, res) => {
    const sql = "INSERT INTO `Cuestionarios` (`titulo`, `creador_id`) VALUES (?, ?)";
    
    const valores=[
        req.body.titulo,
        req.body.creador_id
    ]
    
    db.query(sql,valores,(err,data)=>{
        if(err) return res.json(err);
        return res.json({"status":"ok"});
    })
})

app.put('/cuestionarios/:id', (req, res) => {
    const sql = "UPDATE `Cuestionarios` SET titulo=?, creador_id=? WHERE id=?";
    
    const valores=[
        req.body.titulo,
        req.body.creador_id,
        req.params.id
    ]
    
    db.query(sql,valores,(err,data)=>{
        if(err) return res.json(err);
        return res.json({"status":"ok"});
    })
})

app.delete('/cuestionarios/:id', (req, res) => {
    const sql = "DELETE FROM `Cuestionarios` where id=?";
    
    const valores=[
        req.params.id
    ]
    
    db.query(sql,valores,(err,data)=>{
        if(err) return res.json(err);
        return res.json({"status":"ok"});
    })
})

app.get('/cuestionarios/:id', (req, res) => {
    const sql = "SELECT * FROM `Cuestionarios` where id=?";
    const valores=[
        req.params.id
    ]
    db.query(sql,valores,(err,data)=>{
        if(err) return res.json(err);
        return res.json(data);
    })
})

app.get('/preguntas/:id', (req, res) => {
    const sql = "SELECT * FROM Preguntas WHERE cuestionario_id=?";

    const valores=[
        req.params.id
    ]

    db.query(sql,valores,(err,data)=>{
        if(err) return res.json(err);
        return res.json(data);
    })
})

app.post('/preguntas', (req, res) => {
    const sql = "INSERT INTO Preguntas (texto, tiempo_respuesta, cuestionario_id) VALUES (?, ?, ?)";
    const valores = [
        req.body.texto,
        req.body.tiempo_respuesta,
        req.body.cuestionario_id
    ];
    db.query(sql, valores, (err, data) => {
        if (err) return res.json(err);
        return res.json({ id: data.insertId, ...req.body });
    });
});

app.put('/preguntas/:id', (req, res) => {
    const sql = "UPDATE Preguntas SET texto=?, tiempo_respuesta=? WHERE id=?";
    const valores = [
        req.body.texto,
        req.body.tiempo_respuesta,
        req.params.id
    ];
    db.query(sql, valores, (err, data) => {
        if (err) return res.json(err);
        return res.json({ "status": "ok" });
    });
});

app.delete('/preguntas/:id', (req, res) => {
    const sql = "DELETE FROM Preguntas WHERE id=?";
    const valores = [
        req.params.id
    ];
    db.query(sql, valores, (err, data) => {
        if (err) return res.json(err);
        return res.json({ "status": "ok" });
    });
});

app.get('/preguntas/:cuestionario_id', (req, res) => {
    const sqlPreguntas = "SELECT * FROM Preguntas WHERE cuestionario_id=?";
    const valoresPreguntas = [req.params.cuestionario_id];

    db.query(sqlPreguntas, valoresPreguntas, (err, preguntas) => {
        if (err) return res.json(err);

        const preguntasIds = preguntas.map(p => p.id);
        if (preguntasIds.length === 0) {
            return res.json(preguntas);
        }

        const sqlRespuestas = "SELECT * FROM Respuestas WHERE pregunta_id IN (?)";
        db.query(sqlRespuestas, [preguntasIds], (err, respuestas) => {
            if (err) return res.json(err);

            const preguntasConRespuestas = preguntas.map(p => ({
                ...p,
                respuestas: respuestas.filter(r => r.pregunta_id === p.id)
            }));

            return res.json(preguntasConRespuestas);
        });
    });
});

app.get('/opciones/:id', (req, res) => {
    const sql = "SELECT * FROM Opciones WHERE pregunta_id=?";

    const valores=[
        req.params.id
    ]

    db.query(sql,valores,(err,data)=>{
        if(err) return res.json(err);
        return res.json(data);
    })
})

app.post('/opciones', (req, res) => {
    const sql = "INSERT INTO Opciones (texto, es_correcta, pregunta_id) VALUES (?, ?, ?)";
    const valores = [
        req.body.texto,
        req.body.es_correcta,
        req.body.pregunta_id
    ];
    db.query(sql, valores, (err, data) => {
        if (err) return res.json(err);
        return res.json({ id: data.insertId, ...req.body });
    });
});

app.put('/opciones/:id', (req, res) => {
    const sql = "UPDATE Opciones SET texto=?, es_correcta=? WHERE id=?";
    const valores = [
        req.body.texto,
        req.body.es_correcta,
        req.params.id
    ];
    db.query(sql, valores, (err, data) => {
        if (err) return res.json(err);
        return res.json({ "status": "ok" });
    });
});

app.delete('/opciones/:id', (req, res) => {
    const sql = "DELETE FROM Opciones WHERE id=?";
    const valores = [
        req.params.id
    ];
    db.query(sql, valores, (err, data) => {
        if (err) return res.json(err);
        return res.json({ "status": "ok" });
    });
});


server.listen(puerto, () => {
  console.log('Bienvenido amigooooooo')
})