const API_BASE = "http://localhost:3000";

async function loadArtistProfile() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const artistId = urlParams.get('id');

        if (!artistId) {
            throw new Error('ID de artista no proporcionado');
        }

        const response = await fetch(`${API_BASE}/artists/${artistId}`);
        if (!response.ok) {
            throw new Error('Error al cargar el perfil del artista');
        }

        const artist = await response.json();
        displayArtistProfile(artist);

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('artistProfile').innerHTML = `
            <div class="alert alert-danger">
                Error al cargar el perfil del artista: ${error.message}
            </div>
        `;
    }
}

function displayArtistProfile(artist) {
    const profileSection = document.getElementById('artistProfile');
    profileSection.innerHTML = `
        <div class="artist-header mb-4">
            <div class="row align-items-center">
                <div class="col-md-4">
                    <img src="${artist.image}" alt="${artist.name}" 
                         class="img-fluid rounded-circle artist-image">
                </div>
                <div class="col-md-8">
                    <h1>${artist.name}</h1>
                    <p class="text-muted">${artist.genres ? artist.genres.join(', ') : 'Sin géneros'}</p>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-12">
                <h3>Álbumes</h3>
                <div class="row" id="albumsSection">
                    ${renderAlbums(artist.albums)}
                </div>
            </div>

            <div class="col-12 mt-4">
                <h3>Canciones Populares</h3>
                <div class="popular-songs">
                    ${renderArtistSongs(artist.albums)}
                </div>
            </div>
        </div>
    `;
}

function renderAlbums(albums) {
    if (!albums || albums.length === 0) {
        return '<p class="text-muted">No hay álbumes disponibles</p>';
    }

    return albums.map(album => `
        <div class="col-md-4 mb-3">
            <div class="card album-card">
                <img src="${album.image}" class="card-img-top" alt="${album.title}">
                <div class="card-body">
                    <h5 class="card-title">${album.title}</h5>
                    <p class="card-text text-muted">${album.genre}</p>
                </div>
            </div>
        </div>
    `).join('');
}

function renderArtistSongs(albums) {
    if (!albums || albums.length === 0) {
        return '<p class="text-muted">No hay canciones disponibles</p>';
    }

    const allSongs = albums.reduce((songs, album) => {
        if (album.songs) {
            songs.push(...album.songs.map(song => ({
                ...song,
                albumTitle: album.title,
                albumImage: album.image
            })));
        }
        return songs;
    }, []);

    return `
        <div class="list-group song-list">
            ${allSongs.map((song, index) => `
                <div class="list-group-item bg-dark song-item">
                    <div class="d-flex align-items-center">
                        <span class="me-3 text-muted">${index + 1}</span>
                        <img src="${song.albumImage}" 
                             alt="${song.title}" 
                             class="song-thumbnail me-3">
                        <div>
                            <h6 class="mb-0">${song.title}</h6>
                            <small class="text-muted">${song.albumTitle}</small>
                        </div>
                        <div class="ms-auto">
                            <span class="text-muted me-3">${song.duration || '--:--'}</span>
                            <button class="btn btn-sm btn-outline-primary" onclick="handleAddToPlaylist('${song._id}')">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}
async function handleAddToPlaylist(songId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Debes iniciar sesión para agregar canciones a playlists');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/playlists`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Error al obtener playlists');
        
        const playlists = await response.json();

        if (playlists.length === 0) {
            if (confirm('No tienes playlists. ¿Deseas crear una nueva?')) {
                window.location.href = 'add-playlist.html';
            }
            return;
        }

        const playlistId = await showPlaylistSelector(playlists);
        if (playlistId) {
            const addResponse = await fetch(`${API_BASE}/playlist/${playlistId}/songs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ songId })
            });

            if (!addResponse.ok) throw new Error('Error al agregar canción');
            alert('Canción agregada exitosamente');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al procesar la solicitud: ' + error.message);
    }
}

function showPlaylistSelector(playlists) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content bg-dark text-white">
                    <div class="modal-header">
                        <h5 class="modal-title">Seleccionar Playlist</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="list-group bg-dark">
                            ${playlists.map(playlist => `
                                <button onclick="selectPlaylist('${playlist._id}')" 
                                        class="list-group-item list-group-item-action bg-dark text-white">
                                    ${playlist.name}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const modalInstance = new bootstrap.Modal(modal);
        
        window.selectPlaylist = (playlistId) => {
            modalInstance.hide();
            resolve(playlistId);
        };

        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
            resolve(null);
        });

        modalInstance.show();
    });
}

async function addSongToPlaylist(songId, playlistId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/playlist/${playlistId}/songs`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ songId })
    });

    if (!response.ok) {
        throw new Error('Error al agregar la canción');
    }

    return response.json();
}

document.addEventListener('DOMContentLoaded', loadArtistProfile);