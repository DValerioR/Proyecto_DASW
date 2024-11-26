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

// Esquema de Álbumes
const albumSchema = new mongoose.Schema({
    _id: { type: String }, // ID personalizado
    title: { type: String, required: true }, // Título del álbum
    artist: { type: String, required: true }, // Artista principal
    genre: { type: String, required: true }, // Género del álbum
    image: { type: String, required: true } // Imagen del álbum
});

// Middleware para generar el _id del álbum antes de guardar
albumSchema.pre('save', function (next) {
    // Generar iniciales del artista
    const artistInitials = this.artist
        .split(' ')
        .map(word => word[0].toUpperCase())
        .join('');

    // Título del álbum en camelCase
    const albumTitleCamelCase = this.title
        .split(' ')
        .map((word, index) =>
            index === 0
                ? word.toLowerCase()
                : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join('');

    // Asignar el _id personalizado
    this._id = `${artistInitials}-${albumTitleCamelCase}`;
    next();
});

const Album = mongoose.model('Album', albumSchema);

// Esquema de Canciones
const songSchema = new mongoose.Schema({
    _id: { type: String }, // ID personalizado
    title: { type: String, required: true }, // Título de la canción
    album: { type: mongoose.Schema.Types.ObjectId, ref: 'Album', required: true }, // Referencia al álbum
    duration: { type: String }, // Duración de la canción (ej. "3:45")
});

// Middleware para generar el _id de la canción antes de guardar
songSchema.pre('save', async function (next) {
    try {
        // Obtener el álbum referenciado
        const album = await Album.findById(this.album);

        if (!album) {
            throw new Error('Álbum no encontrado para la canción');
        }

        // Generar iniciales del artista
        const artistInitials = album.artist
            .split(' ')
            .map(word => word[0].toUpperCase())
            .join('');

        // Título del álbum en camelCase
        const albumTitleCamelCase = album.title
            .split(' ')
            .map((word, index) =>
                index === 0
                    ? word.toLowerCase()
                    : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join('');

        // Título de la canción en camelCase
        const songTitleCamelCase = this.title
            .split(' ')
            .map((word, index) =>
                index === 0
                    ? word.toLowerCase()
                    : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join('');

        // Asignar el _id personalizado
        this._id = `${artistInitials}-${albumTitleCamelCase}-${songTitleCamelCase}`;
        next();
    } catch (error) {
        next(error);
    }
});

const Song = mongoose.model('Song', songSchema);

// Endpoints base
app.get('/', (req, res) => {
    res.send('Bienvenido a MusicArtist API');
});

// Endpoint para obtener canciones
app.get('/songs', async (req, res) => {
    try {
        const songs = await Song.find().populate('album'); // Incluir datos del álbum
        res.json(songs);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener canciones', error });
    }
});

// Endpoint para obtener álbumes
app.get('/albums', async (req, res) => {
    try {
        const albums = await Album.find();
        res.json(albums);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener álbumes', error });
    }
});

// Endpoint para agregar un álbum
app.post('/albums', async (req, res) => {
    try {
        const newAlbum = new Album(req.body);
        await newAlbum.save();
        res.status(201).json(newAlbum);
    } catch (error) {
        res.status(400).json({ message: 'Error al agregar álbum', error });
    }
});

// Endpoint para agregar una canción
app.post('/songs', async (req, res) => {
    try {
        const newSong = new Song(req.body);
        await newSong.save();
        res.status(201).json(newSong);
    } catch (error) {
        res.status(400).json({ message: 'Error al agregar canción', error });
    }
});

// Arrancar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
