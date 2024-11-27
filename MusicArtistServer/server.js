const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

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

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        if (file.fieldname === 'music') {
            cb(null, 'public/uploads/music');
        } else if (file.fieldname === 'image') {
            cb(null, 'public/uploads/images');
        }
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB límite
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'music') {
            if (!file.originalname.match(/\.(mp3|mp4|wav)$/)) {
                return cb(new Error('Por favor sube un archivo de audio válido'));
            }
        } else if (file.fieldname === 'image') {
            if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
                return cb(new Error('Por favor sube una imagen válida'));
            }
        }
        cb(null, true);
    }
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
    createdAt: {
        type: Date,
        default: Date.now
    }
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

// Esquema de Álbumes (mantiene tu esquema original)
const albumSchema = new mongoose.Schema({
    _id: { type: String },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    genre: { type: String, required: true },
    image: { type: String, required: true }
});

// Tu middleware existente para el _id del álbum
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

const Album = mongoose.model('Album', albumSchema);

// Esquema de Canciones (mantiene tu esquema original)
const songSchema = new mongoose.Schema({
    _id: { type: String },
    title: { type: String, required: true },
    album: { type: String, ref: 'Album', required: true },
    duration: { type: String },
    music: { type: String, required: true }
});

// Tu middleware existente para el _id de la canción
songSchema.pre('save', async function (next) {
    try {
        const album = await Album.findById(this.album);

        if (!album) {
            throw new Error('Álbum no encontrado para la canción');
        }

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
        const decoded = jwt.verify(token, 'musicartistsecret'); // En producción, usar variable de entorno
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
    res.send('Bienvenido a MusicArtist API');
});

// Endpoints de usuarios
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

// Tus endpoints existentes de canciones y álbumes
app.get('/songs', async (req, res) => {
    try {
        const songs = await Song.find().populate('album');
        res.json(songs);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener canciones', error });
    }
});

app.get('/albums', async (req, res) => {
    try {
        const albums = await Album.find();
        res.json(albums);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener álbumes', error });
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
        res.status(400).json({ message: 'Error al agregar álbum', error });
    }
});

// Nuevo endpoint para subir canciones con archivos
app.post('/songs/upload', auth, upload.fields([
    { name: 'music', maxCount: 1 },
    { name: 'image', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.user.isArtist) {
            return res.status(403).json({ error: 'Solo los artistas pueden subir canciones' });
        }

        const { title, album, duration } = req.body;
        const newSong = new Song({
            title,
            album,
            duration,
            music: `/uploads/music/${req.files.music[0].filename}`
        });

        await newSong.save();
        res.status(201).json(newSong);
    } catch (error) {
        res.status(400).json({ message: 'Error al agregar canción', error });
    }
});

// Endpoint para crear playlist
app.post('/playlist', auth, async (req, res) => {
    try {
        const { name, songs } = req.body;
        const user = await User.findById(req.user._id);
        user.playlists.push({ name, songs });
        await user.save();
        res.status(201).json(user.playlists[user.playlists.length - 1]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Endpoint para agregar canción a playlist
app.post('/playlist/:playlistId/song', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const playlist = user.playlists.id(req.params.playlistId);
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist no encontrada' });
        }
        
        playlist.songs.push(req.body.songId);
        await user.save();
        res.json(playlist);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Arrancar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
