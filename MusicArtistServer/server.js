const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path'); // Necesario para manejar rutas absolutas
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Conectar a MongoDB
const mongoURI = 'mongodb+srv://admin:MA021224@myapp.aq5jn.mongodb.net/MusicArtistDB';

mongoose.connection.on('connecting', () => {
    console.log('Conectando a MongoDB...');
    console.log(mongoose.connection.readyState);
});

mongoose.connection.on('connected', () => {
    console.log('Conectado a MongoDB');
    console.log(mongoose.connection.readyState);
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
// Esquema de Usuario
const userSchema = new mongoose.Schema({
    _id: { type: String },
    username: { 
        type: String, 
        required: true,
        unique: true,
        trim: true
    },
    email: { 
        type: String, 
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: { 
        type: String, 
        required: true 
    },
    isArtist: {
        type: Boolean,
        default: false
    },
    profilePicture: {
        type: String,
        default: '/images/default-avatar.jpg'
    },
    playlists: [{
        name: String,
        songs: [{ type: String, ref: 'Song' }]
    }],
    playHistory: [{
        song: { type: String, ref: 'Song' },
        timestamp: Date
    }]
});

// Middleware para generar el _id del usuario
userSchema.pre('save', function(next) {
    if (this.isNew) {
        const username = this.username.toLowerCase().replace(/[^a-z0-9]/g, '');
        const timestamp = Date.now().toString(36);
        this._id = `user-${username}-${timestamp}`;
    }
    next();
});

// Hash contraseña antes de guardar
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

const User = mongoose.model('User', userSchema);


albumSchema.pre('save', function (next) {
    const artistInitials = this.artist
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
    _id: { type: String },
    title: { type: String, required: true },
    album: { type: String, ref: 'Album', required: true },
    duration: { type: String },
    music: { type: String, required: true },
    plays: { type: Number, default: 0 },
    likes: [{ type: String, ref: 'User' }]
});

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

const Song = mongoose.model('Song', songSchema);

// Middleware de autenticación
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, 'musicartistsecret');
        const user = await User.findById(decoded.id);

        if (!user) {
            throw new Error();
        }

        req.token = token;
        req.user = user;
        next();
    } catch (e) {
        res.status(401).send({ error: 'Por favor autentícate' });
    }
};

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
        // Endpoints de autenticación
app.post('/register', async (req, res) => {
    try {
        const { username, email, password, isArtist } = req.body;
        const user = new User({ username, email, password, isArtist });
        await user.save();
        const token = jwt.sign({ id: user._id }, 'musicartistsecret', { expiresIn: '24h' });
        res.status(201).json({ user, token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Credenciales inválidas');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Credenciales inválidas');
        }
        const token = jwt.sign({ id: user._id }, 'musicartistsecret', { expiresIn: '24h' });
        res.json({ user, token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/albums', async (req, res) => {
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
app.post('/albums', auth, async (req, res) => {
    try {
        if (!req.user.isArtist) {
            return res.status(403).json({ error: 'Solo los artistas pueden crear álbumes' });
        }
        const newAlbum = new Album(req.body);
        await newAlbum.save();
        res.status(201).json(newAlbum);
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
app.post('/songs', auth, async (req, res) => {
    try {
        if (!req.user.isArtist) {
            return res.status(403).json({ error: 'Solo los artistas pueden agregar canciones' });
        }
        const newSong = new Song(req.body);
        await newSong.save();
        res.status(201).json(newSong);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener géneros', error });
    }
});


// Arrancar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
