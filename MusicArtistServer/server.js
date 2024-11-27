const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path'); // Necesario para manejar rutas absolutas

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Servir archivos estáticos desde la carpeta 'public'

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

// Esquema de Artistas
const artistSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // ID único (iniciales del artista)
    name: { type: String, required: true }, // Nombre del artista
    email: { type: String, required: true, unique: true }, // Correo electrónico
    password: { type: String, required: true }, // Contraseña
    image: { type: String, required: true }, // URL de la imagen del artista
    genres: [{ type: String, required: true }], // Géneros asociados
    albums: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }] // Relación con los álbumes
});

const Artist = mongoose.model('Artist', artistSchema, 'Artists');

// Esquema de Álbumes
const albumSchema = new mongoose.Schema({
    _id: { type: String }, // ID personalizado
    title: { type: String, required: true }, // Título del álbum
    artist: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', required: true }, // Relación con el artista
    genre: { type: String, required: true }, // Género del álbum
    image: { type: String, required: true } // Imagen del álbum
});

// Middleware para generar el _id del álbum antes de guardar
albumSchema.pre('save', function (next) {
    const artistInitials = this.artist.name
        .split(' ')
        .map(word => word[0].toUpperCase())
        .join('');

    const albumTitleCamelCase = this.title
        .split(' ')
        .map((word, index) =>
            index === 0
                ? word.toLowerCase()
                : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join('');

    this._id = `${artistInitials}-${albumTitleCamelCase}`;
    next();
});

const Album = mongoose.model('Album', albumSchema, 'Albums');

// Esquema de Canciones
const songSchema = new mongoose.Schema({
    _id: { type: String }, // ID personalizado
    title: { type: String, required: true }, // Título de la canción
    album: { type: String, ref: 'Album', required: true }, // Cambiar ObjectId a String
    duration: { type: String }, // Duración de la canción
    music: { type: String, required: true } // URL o ruta del archivo MP4
});


// Middleware para generar el _id de las canciones
songSchema.pre('save', async function (next) {
    try {
        const album = await Album.findById(this.album);

        if (!album) throw new Error('Álbum no encontrado para la canción');

        const artistInitials = album.artist
            .split(' ')
            .map(word => word[0].toUpperCase())
            .join('');

        const albumTitleCamelCase = album.title
            .split(' ')
            .map((word, index) =>
                index === 0
                    ? word.toLowerCase()
                    : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join('');

        const songTitleCamelCase = this.title
            .split(' ')
            .map((word, index) =>
                index === 0
                    ? word.toLowerCase()
                    : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join('');

        this._id = `${artistInitials}-${albumTitleCamelCase}-${songTitleCamelCase}`;
        next();
    } catch (error) {
        next(error);
    }
});

const Song = mongoose.model('Song', songSchema, 'Songs');

// Endpoints base
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Servir index.html
});

// Endpoints para artistas
app.get('/artists', async (req, res) => {
    const { genre } = req.query;
    try {
        const query = genre ? { genres: genre } : {};
        const artists = await Artist.find(query).populate('albums');
        res.json(artists);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener artistas', error });
    }
});



app.get('/artists/:id', async (req, res) => {
    try {
        const artist = await Artist.findById(req.params.id).populate('albums');
        res.json(artist);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el artista', error });
    }
});

// Endpoints para álbumes
app.get('/albums', async (req, res) => {
    const { artistId } = req.query;
    try {
        const query = artistId ? { artist: artistId } : {};
        const albums = await Album.find(query);
        res.json(albums);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener álbumes', error });
    }
});

// Endpoints para canciones
app.get('/songs', async (req, res) => {
    const { genre } = req.query;
    try {
        let query = {};
        if (genre) {
            console.log(`Consultando canciones del género: ${genre}`);
            const albums = await Album.find({ genre }, '_id'); // Encuentra álbumes con el género
            const albumIds = albums.map(album => album._id); // Obtén los IDs de los álbumes
            query = { album: { $in: albumIds } }; // Filtra canciones con estos álbumes
            console.log(`Álbumes encontrados: ${JSON.stringify(albumIds)}`);
        }
        const songs = await Song.find(query).populate('album'); // Obtén las canciones
        console.log(`Canciones encontradas: ${JSON.stringify(songs)}`);
        res.json(songs);
    } catch (error) {
        console.error("Error al obtener canciones:", error);
        res.status(500).json({ message: 'Error al obtener canciones', error });
    }
});


// Endpoints para generos
app.get('/genres', async (req, res) => {
    try {
        const genres = await Album.distinct('genre'); // Obtener géneros únicos
        res.json(genres);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener géneros', error });
    }
});


// Arrancar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
