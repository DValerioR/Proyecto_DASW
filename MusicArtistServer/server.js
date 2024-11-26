const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Conectar a MongoDB
const mongoURI = 'mongodb+srv://admin:MA021224@myapp.aq5jn.mongodb.net/MusicArtistDB';

mongoose.connection.on('connecting', () => {
    console.log('Conectando a MongoDB...');
    console.log(mongoose.connection.readyState); // 2
});

mongoose.connection.on('connected', () => {
    console.log('Conectado a MongoDB');
    console.log(mongoose.connection.readyState); // 1
});

mongoose.connection.on('error', (err) => {
    console.error('Error al conectar a MongoDB:', err);
});

// Conectar a MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Conexión a MongoDB establecida'))
    .catch(err => console.error('Error inicial al conectar a MongoDB:', err));

const songSchema = new mongoose.Schema({
        title: { type: String, required: true },
        artist: { type: String, required: true },
        album: { type: String },
        genre: { type: String },
        image: { type: String }
    });
    
    // Crear el modelo
    const Song = mongoose.model('Song', songSchema);
    
    
// Endpoints base
    app.get('/', (req, res) => {
        res.send('Bienvenido a MusicArtist API');
    });
// Endpoint para obtener canciones
app.get('/songs', async (req, res) => {
    try {
        const songs = await Song.find(); // Obtener todas las canciones de la base de datos
        res.json(songs);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener canciones', error });
    }
});
// Endpoint para agregar una cancion
app.post('/songs', async (req, res) => {
    try {
        const newSong = new Song(req.body); // Crear una nueva canción con los datos del cuerpo
        await newSong.save(); // Guardar en la base de datos
        res.status(201).json(newSong);
    } catch (error) {
        res.status(400).json({ message: 'Error al agregar canción', error });
    }
});

// Arrancar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
