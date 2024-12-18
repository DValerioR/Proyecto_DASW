const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;



const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer para guardar canciones e imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = file.fieldname === 'audioFile' ? 'public/uploads/songs' : 'public/uploads/images';
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

// Endpoint para subir canciones
app.post('/upload', auth, upload.fields([{ name: 'audioFile', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), async (req, res) => {
    try {
        if (!req.user.isArtist) {
            return res.status(403).json({ error: 'Solo los artistas pueden subir canciones' });
        }

        const { title, genre } = req.body;
        if (!title || !genre || !req.files.audioFile || !req.files.coverImage) {
            return res.status(400).json({ error: 'Título, género, archivo de audio e imagen de portada son requeridos' });
        }

        const audioFilePath = `/uploads/songs/${req.files.audioFile[0].filename}`;
        const coverImagePath = `/uploads/images/${req.files.coverImage[0].filename}`;

        const song = new Song({
            title,
            genre,
            music: audioFilePath,
            coverImage: coverImagePath
        });

        await song.save();
        res.status(201).json({ message: 'Canción subida exitosamente', song });
    } catch (error) {
        console.error('Error al subir canción:', error);
        res.status(500).json({ error: 'Error al subir canción' });
    }
});

// Endpoint para obtener canciones por género o todas
app.get('/songs', async (req, res) => {
    const { genre } = req.query;
    try {
        const query = genre ? { genre } : {};
        const songs = await Song.find(query);
        res.json(songs);
    } catch (error) {
        console.error('Error al obtener canciones:', error);
        res.status(500).json({ error: 'Error al obtener canciones' });
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Conectar a MongoDB
const mongoURI = 'mongodb+srv://admin:MA021224@myapp.aq5jn.mongodb.net/MusicArtistDB';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Conexión a MongoDB establecida'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));

// Modelos y esquemas
const schemas = {
    artist: new mongoose.Schema({
        _id: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        image: { type: String, required: true },
        genres: [{ type: String, required: true }],
        albums: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }]
    }),
    
    album: new mongoose.Schema({
        _id: { type: String },
        title: { type: String, required: true },
        artist: { type: String, required: true },
        genre: { type: String, required: true },
        image: { type: String, required: true },
        songs: [{ type: String, ref: 'Song' }]
    }),
    user: new mongoose.Schema({
        _id: { type: String },
        username: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        password: { type: String, required: true },
        isArtist: { type: Boolean, default: false },
        profilePicture: { type: String, default: '/images/default-avatar.jpg' },
        playlists: [{ name: String, songs: [{ type: String, ref: 'Song' }] }],
        playHistory: [{ song: { type: String, ref: 'Song' }, timestamp: Date }]
    }),
    song: new mongoose.Schema({
        _id: { type: String },
        title: { type: String, required: true },
        album: { type: String, ref: 'Album', required: true },
        duration: { type: String },
        music: { type: String, required: true },
        plays: { type: Number, default: 0 },
        likes: [{ type: String, ref: 'User' }]
    })
};

// Middlewares de pre-guardado reutilizables
schemas.album.pre('save', function (next) {
    this._id = generateID(this.artist, this.title);
    next();
});

schemas.song.pre('save', async function (next) {
    try {
        const album = await Album.findById(this.album);
        if (!album) throw new Error('Álbum no encontrado para la canción');
        this._id = generateID(album.artist, album.title, this.title);
        next();
    } catch (error) {
        next(error);
    }
});


schemas.user.pre('save', async function (next) {
    if (this.isNew) {
        this._id = `user-${this.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString(36)}`;
    }
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Modelos
const Artist = mongoose.model('Artist', schemas.artist, 'Artists');
const Album = mongoose.model('Album', schemas.album, 'Albums');
const User = mongoose.model('User', schemas.user);
const Song = mongoose.model('Song', schemas.song, 'Songs');

// Funciones auxiliares
function generateID(...args) {
    return args
        .map(arg =>
            arg.split(' ')
                .map(word => word[0].toUpperCase())
                .join('')
        )
        .join('-');
}

// Middleware de autenticación
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, 'musicartistsecret');
        const user = await User.findById(decoded.id);
        if (!user) throw new Error();
        req.token = token;
        req.user = user;
        next();
    } catch (e) {
        res.status(401).send({ error: 'Por favor autentícate' });
    }
};

// Endpoints
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));

// Endpoint para obtener géneros
app.get('/genres', async (req, res) => {
    try {
        const genres = await Album.distinct('genre'); // Obtener géneros únicos de los álbumes
        if (!genres || genres.length === 0) {
            return res.status(404).json({ message: 'No se encontraron géneros.' });
        }
        res.json(genres);
    } catch (error) {
        console.error('Error al obtener géneros:', error);
        res.status(500).json({ message: 'Error al obtener géneros', error });
    }
});

// Endpoint para canciones
app.get('/songs', async (req, res) => {
    const { genre } = req.query;
    try {
        let query = {};

        if (genre) {
            // Buscar los álbumes que coincidan con el género
            const albums = await Album.find({ genre }, '_id'); // Obtener solo los IDs de los álbumes
            if (albums.length === 0) {
                return res.json([]); // No hay álbumes para este género
            }

            const albumIds = albums.map(album => album._id); // Extraer los IDs de los álbumes
            query = { album: { $in: albumIds } }; // Filtrar canciones que pertenezcan a estos álbumes
        }

        // Buscar canciones con el query generado
        const songs = await Song.find(query).populate('album', 'title artist image');
        res.json(songs);
    } catch (error) {
        console.error('Error al obtener canciones:', error);
        res.status(500).json({ message: 'Error al obtener canciones', error: error.message });
    }
});
// Endpoints para playlists
app.post('/playlist', auth, async (req, res) => {
    try {
        const user = req.user;
        const { name, songs } = req.body;
        
        // Validar los datos requeridos
        if (!name || !songs) {
            return res.status(400).json({ error: 'Nombre y canciones son requeridos' });
        }

        // Parsear las canciones si vienen como string
        const songsList = typeof songs === 'string' ? JSON.parse(songs) : songs;

        // Verificar que las canciones existen
        const existingSongs = await Song.find({ _id: { $in: songsList } });
        if (existingSongs.length !== songsList.length) {
            return res.status(400).json({ error: 'Algunas canciones no existen' });
        }

        // Agregar la nueva playlist al usuario
        user.playlists.push({
            name,
            songs: songsList
        });

        await user.save();
        
        res.status(201).json({
            message: 'Playlist creada exitosamente',
            playlist: user.playlists[user.playlists.length - 1]
        });
    } catch (error) {
        console.error('Error al crear playlist:', error);
        res.status(500).json({ error: 'Error al crear la playlist' });
    }
});


// Endpoint para obtener todas las playlists del usuario
app.get('/playlists', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        // Si no hay usuario
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Devolver las playlists
        res.json(user.playlists);

    } catch (error) {
        console.error('Error al obtener playlists:', error);
        res.status(500).json({ error: 'Error al obtener las playlists' });
    }
});
app.post('/playlist/:playlistId/songs', auth, async (req, res) => {
    try {
        const { songId } = req.body;
        const user = await User.findById(req.user._id);
        const playlist = user.playlists.id(req.params.playlistId);

        if (!playlist) {
            return res.status(404).json({ error: 'Playlist no encontrada' });
        }

        playlist.songs.push(songId);
        await user.save();
        
        res.json({ message: 'Canción agregada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar la canción' });
    }
});

// Obtener detalles de las canciones de una playlist
app.get('/playlist/:playlistId/songs', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const playlist = user.playlists.id(req.params.playlistId);
        
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist no encontrada' });
        }

        // Obtener detalles completos de cada canción
        const songDetails = await Song.find({
            '_id': { $in: playlist.songs }
        }).populate('album');

        res.json(songDetails);
    } catch (error) {
        console.error('Error al obtener canciones:', error);
        res.status(500).json({ error: 'Error al obtener las canciones de la playlist' });
    }
});

// Actualizar el endpoint de creación de playlist
app.post('/playlist', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { name, songs } = req.body;

        // Validar datos
        if (!name) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        // Crear nueva playlist
        user.playlists.push({
            name,
            songs: songs || []
        });

        await user.save();
        res.status(201).json(user.playlists[user.playlists.length - 1]);
    } catch (error) {
        console.error('Error al crear playlist:', error);
        res.status(500).json({ error: 'Error al crear la playlist' });
    }
});


// Endpoint existente para listar artistas
app.get('/artists', async (req, res) => {
    try {
        const artists = await Artist.find(req.query.genre ? { genres: req.query.genre } : {}).populate('albums');
        res.json(artists);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener artistas', error });
    }
});

// Nuevo endpoint para obtener un artista específico por ID
app.get('/artists/:id', async (req, res) => {
    try {
        const artist = await Artist.findById(req.params.id);
        if (!artist) {
            return res.status(404).json({ error: 'Artista no encontrado' });
        }

        const albums = await Album.find({ artist: artist.name });
        const albumsWithSongs = await Promise.all(
            albums.map(async (album) => {
                const songs = await Song.find({ album: album._id });
                return {
                    ...album.toObject(),
                    songs: songs
                };
            })
        );

        const artistResponse = {
            ...artist.toObject(),
            albums: albumsWithSongs
        };

        res.json(artistResponse);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener información del artista' });
    }
});



app.get('/albums', async (req, res) => {
    try {
        const albums = await Album.find(req.query.artistId ? { artist: req.query.artistId } : {});
        res.json(albums);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener álbumes', error });
    }
});

app.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el perfil' });
    }
});

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
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new Error('Credenciales inválidas');
        }
        const token = jwt.sign({ id: user._id }, 'musicartistsecret', { expiresIn: '24h' });
        res.json({ user, token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
app.get('/search', async (req, res) => {
    const { query } = req.query; // El término de búsqueda
    if (!query) {
        return res.status(400).json({ message: 'El término de búsqueda es obligatorio' });
    }

    try {
        const regex = new RegExp(query, 'i'); // Búsqueda insensible a mayúsculas y minúsculas

        // Buscar artistas, álbumes y canciones
        const [artists, albums, songs] = await Promise.all([
            Artist.find({ name: regex }).populate('albums', 'title genre image'),
            Album.find({ title: regex }).populate('artist', 'name'),
            Song.find({ title: regex }).populate('album', 'title artist image')
        ]);

        res.json({
            artists,
            albums,
            songs
        });
    } catch (error) {
        console.error('Error en la búsqueda:', error);
        res.status(500).json({ message: 'Error en la búsqueda', error });
    }
});


// Arrancar servidor
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
