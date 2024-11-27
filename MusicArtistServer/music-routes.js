const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Album = require('../models/album');
const Song = require('../models/song');
const { auth } = require('../middleware/auth');

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

// Subir nueva canción
router.post('/upload', auth, upload.fields([
    { name: 'music', maxCount: 1 },
    { name: 'image', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.user.isArtist) {
            return res.status(403).json({ error: 'Solo los artistas pueden subir canciones' });
        }

        const { title, album, genre, description } = req.body;

        // Crear nuevo álbum si no existe
        let albumDoc = await Album.findById(album);
        if (!albumDoc) {
            albumDoc = new Album({
                title: req.body.albumTitle,
                artist: req.user.username,
                genre,
                image: `/uploads/images/${req.files.image[0].filename}`
            });
            await albumDoc.save();
        }

        // Crear nueva canción
        const song = new Song({
            title,
            album: albumDoc._id,
            duration: req.body.duration,
            music: `/uploads/music/${req.files.music[0].filename}`,
            description
        });

        await song.save();
        res.status(201).json(song);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Obtener canciones por género
router.get('/genre/:genre', async (req, res) => {
    try {
        const albums = await Album.find({ genre: req.params.genre });
        const albumIds = albums.map(album => album._id);
        const songs = await Song.find({ album: { $in: albumIds } })
            .populate('album');
        res.json(songs);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Crear playlist
router.post('/playlist', auth, async (req, res) => {
    try {
        const { name, songs } = req.body;
        req.user.playlists.push({ name, songs });
        await req.user.save();
        res.status(201).json(req.user.playlists[req.user.playlists.length - 1]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Agregar canción a playlist
router.post('/playlist/:playlistId/song', auth, async (req, res) => {
    try {
        const playlist = req.user.playlists.id(req.params.playlistId);
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist no encontrada' });
        }
        
        playlist.songs.push(req.body.songId);
        await req.user.save();
        res.json(playlist);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
