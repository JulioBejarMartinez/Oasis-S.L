import { SerialPort } from 'serialport'
import { ReadlineParser } from 'serialport'
import { Socket } from 'socket.io'
import { Server } from 'socket.io'

import express from 'express'
import http from 'http'
import cors from 'cors'
const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*', // URL de la app React
    methods: ['GET', 'POST']
  }
})



let datosSensoresActuales = {};

// Configuración del puerto serie (asegúrate de que el path y el baudRate sean correctos)
const port = new SerialPort({ path: '/dev/ttyACM0', baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' })); // Separa los datos por salto de línea

port.on('open', () => console.log('SerialPort abierto'));

parser.on('data', data => {
    console.log('Datos recibidos:', data);
    const valores = data.trim().split(','); // Separa el contenido en comas

    if (valores.length === 5) { 
        // Actualiza la variable global con los nuevos datos
        datosSensoresActuales = {data};
    }
});

// Endpoint para obtener los datos actuales de los sensores
app.get('/datosSensores', (req, res) => {
    if (Object.keys(datosSensoresActuales).length !== 0) {
        res.json(datosSensoresActuales);
    } else {
        res.status(404).json({ error: "No hay datos disponibles" });
    }
});

app.get('/activarAmbos', (req, res) => {
    port.write('ACTIVAR_AMBAS\n');
    res.send('Ambos activados');
});

app.get('/activarLed', (req, res) => {
    port.write('ACTIVAR_LED\n');
    res.send('LED activado');
});

app.post('/activarServo/:posicion', (req, res) => {
    let puntoServo= req.params.posicion
    port.write(puntoServo);
    res.send('Motor activado');
});

port.on('error', err => console.error('erro:', err));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/paginas/index.html');
});

//inicar servidor en el puerto 6320
server.listen(6320, () => {
    console.log('http://localhost:6320');
});
