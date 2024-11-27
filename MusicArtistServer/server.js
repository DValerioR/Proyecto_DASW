const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
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

// Esquema de Álbumes
const albumSchema = new mongoose.Schema({
    _id: { type: String },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    genre: { type: String, required: true },
    image: { type: String, required: true }
});

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
    res.send('Bienvenido a MusicArtist API');
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

// Endpoints de canciones y álbumes
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

app.post('/songs', auth, async (req, res) => {
    try {
        if (!req.user.isArtist) {
            return res.status(403).json({ error: 'Solo los artistas pueden agregar canciones' });
        }
        const newSong = new Song(req.body);
        await newSong.save();
        res.status(201).json(newSong);
    } catch (error) {
        res.status(400).json({ message: 'Error al agregar canción', error });
    }
});

// Sistema de recomendaciones
app.get('/recommendations', auth, async (req, res) => {
    try {
        const userPlaylists = req.user.playlists;
        const songIds = userPlaylists.flatMap(playlist => playlist.songs);
        const userSongs = await Song.find({ _id: { $in: songIds } }).populate('album');
        
        const genreCounts = {};
        userSongs.forEach(song => {
            if (song.album && song.album.genre) {
                genreCounts[song.album.genre] = (genreCounts[song.album.genre] || 0) + 1;
            }
        });

        const topGenres = Object.entries(genreCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([genre]) => genre);

        const recommendations = await Song.find({
            '_id': { $nin: songIds }
        })
        .populate({
            path: 'album',
            match: { genre: { $in: topGenres } }
        })
        .limit(10);

        const filteredRecommendations = recommendations.filter(song => song.album);
        res.json(filteredRecommendations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sistema de likes
app.post('/songs/:songId/like', auth, async (req, res) => {
    try {
        const song = await Song.findById(req.params.songId);
        if (!song) {
            return res.status(404).json({ error: 'Canción no encontrada' });
        }

        const userIndex = song.likes.indexOf(req.user._id);
        if (userIndex === -1) {
            song.likes.push(req.user._id);
        } else {
            song.likes.splice(userIndex, 1);
        }

        await song.save();
        res.json({ 
            likes: song.likes.length, 
            isLiked: userIndex === -1 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Historial de reproducción
app.post('/songs/:songId/play', auth, async (req, res) => {
    try {
        const song = await Song.findById(req.params.songId);
        if (!song) {
            return res.status(404).json({ error: 'Canción no encontrada' });
        }

        song.plays = (song.plays || 0) + 1;
        await song.save();

        const user = await User.findById(req.user._id);
        user.playHistory = user.playHistory || [];
        user.playHistory.unshift({
            song: song._id,
            timestamp: new Date()
        });

        if (user.playHistory.length > 50) {
            user.playHistory = user.playHistory.slice(0, 50);
        }

        await user.save();
        res.json({ plays: song.plays });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Compartir playlist
app.post('/playlist/:playlistId/share', auth, async (req, res) => {
    try {
        const { userId } = req.body;
        const sourceUser = await User.findById(req.user._id);
        const targetUser = await User.findById(userId);
        
        if (!targetUser) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const playlist = sourceUser.playlists.id(req.params.playlistId);
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist no encontrada' });
        }

        targetUser.playlists.push({
            name: `${playlist.name} (compartida por ${sourceUser.username})`,
            songs: playlist.songs
        });

        await targetUser.save();
        res.json({ message: 'Playlist compartida exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Arrancar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
