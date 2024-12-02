const API_BASE = "http://localhost:3000";

// Función principal para cargar el perfil
async function loadUserProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar el perfil');
        }

        const user = await response.json();
        setupProfileHeader(user);
        
        if (user.isArtist) {
            renderArtistProfile(user);
        } else {
            renderRegularProfile(user);
        }
        
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('profileContent').innerHTML = 
            '<div class="alert alert-danger">Error al cargar el perfil</div>';
    }
}

// Configurar el encabezado del perfil
function setupProfileHeader(user) {
    const headerContent = `
        <div class="profile-header">
            <div class="profile-header-content">
                <img src="${user.profilePicture || '/api/placeholder/200/200'}" 
                     alt="Profile" class="profile-image">
                <div class="profile-info">
                    <div class="profile-type">${user.isArtist ? 'Artista Verificado' : 'Perfil'}</div>
                    <h1 class="profile-name">${user.username}</h1>
                    <div class="profile-stats">
                        ${user.isArtist ? 
                          `${user.followers?.length || 0} seguidores • ${user.songs?.length || 0} canciones` :
                          `${user.playlists?.length || 0} playlists • ${user.following?.length || 0} seguidos`}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('profileHeader').innerHTML = headerContent;
}

// Renderizar perfil de artista
function renderArtistProfile(user) {
    const content = `
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <div class="artist-upload-section mb-4">
                        <h3><i class="fas fa-music"></i> Zona de Artista</h3>
                        <p>Comparte tu música con el mundo</p>
                        <a href="upload.html" class="btn btn-light">
                            <i class="fas fa-upload"></i> Subir Nueva Canción
                        </a>
                    </div>
                </div>
            </div>

            <div class="row mb-4">
                <div class="col-md-8">
                    <div class="card bg-dark">
                        <div class="card-body">
                            <h4 class="card-title mb-3">Tus Canciones</h4>
                            <div id="artistSongs" class="song-list">
                                ${renderArtistSongs(user.songs || [])}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="card bg-dark">
                        <div class="card-body">
                            <h4 class="card-title mb-3">Estadísticas</h4>
                            <div class="stats-list">
                                <div class="stat-item">
                                    <i class="fas fa-play"></i>
                                    <span>Total reproducciones: ${calculateTotalPlays(user.songs || [])}</span>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-users"></i>
                                    <span>Seguidores: ${user.followers?.length || 0}</span>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-music"></i>
                                    <span>Canciones: ${user.songs?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('profileContent').innerHTML = content;
}

// Renderizar perfil de usuario regular
function renderRegularProfile(user) {
    const content = `
        <div class="container">
            <div class="row">
                <div class="col-12 mb-4">
                    <div class="card bg-dark">
                        <div class="card-body">
                            <h4 class="card-title">Tus Playlists</h4>
                            <div class="playlist-grid mt-3">
                                ${renderUserPlaylists(user.playlists || [])}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-8">
                    <div class="card bg-dark">
                        <div class="card-body">
                            <h4 class="card-title">Canciones Favoritas</h4>
                            <div id="likedSongs" class="song-list">
                                ${renderLikedSongs(user.likedSongs || [])}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="card bg-dark">
                        <div class="card-body">
                            <h4 class="card-title">Artistas Seguidos</h4>
                            <div id="followedArtists" class="artist-list">
                                ${renderFollowedArtists(user.following || [])}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('profileContent').innerHTML = content;
}

// Funciones auxiliares para renderizar contenido
function renderArtistSongs(songs) {
    if (songs.length === 0) {
        return '<p class="text-muted">No has subido canciones aún</p>';
    }

    return songs.map(song => `
        <div class="song-item">
            <img src="${song.album?.image || '/api/placeholder/40/40'}" alt="${song.title}">
            <div class="song-info">
                <h6>${song.title}</h6>
                <small>${song.album?.name || 'Single'}</small>
            </div>
            <div class="song-stats">
                <span><i class="fas fa-play"></i> ${song.plays || 0}</span>
                <span><i class="fas fa-heart"></i> ${song.likes?.length || 0}</span>
            </div>
            <div class="song-actions">
                <button class="btn btn-sm btn-outline-danger" onclick="deleteSong('${song._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function renderUserPlaylists(playlists) {
    if (playlists.length === 0) {
        return '<p class="text-muted">No has creado playlists aún</p>';
    }

    return playlists.map(playlist => `
        <div class="playlist-card">
            <img src="${playlist.image || '/api/placeholder/200/200'}" 
                 alt="${playlist.name}" class="playlist-image">
            <h5>${playlist.name}</h5>
            <p>${playlist.songs?.length || 0} canciones</p>
            <a href="playlist.html?id=${playlist._id}" class="btn btn-sm btn-primary">
                <i class="fas fa-play"></i> Reproducir
            </a>
        </div>
    `).join('');
}

function renderLikedSongs(songs) {
    if (songs.length === 0) {
        return '<p class="text-muted">No has dado like a ninguna canción</p>';
    }

    return songs.map(song => `
        <div class="song-item">
            <img src="${song.album?.image || '/api/placeholder/40/40'}" alt="${song.title}">
            <div class="song-info">
                <h6>${song.title}</h6>
                <small>${song.artist}</small>
            </div>
            <button class="btn btn-sm btn-outline-primary">
                <i class="fas fa-heart"></i>
            </button>
        </div>
    `).join('');
}

function renderFollowedArtists(artists) {
    if (artists.length === 0) {
        return '<p class="text-muted">No sigues a ningún artista</p>';
    }

    return artists.map(artist => `
        <div class="artist-item">
            <img src="${artist.profilePicture || '/api/placeholder/40/40'}" 
                 alt="${artist.username}" class="artist-avatar">
            <span>${artist.username}</span>
            <button class="btn btn-sm btn-outline-primary">Siguiendo</button>
        </div>
    `).join('');
}

function calculateTotalPlays(songs) {
    return songs.reduce((total, song) => total + (song.plays || 0), 0);
}

// Función para eliminar canción (solo para artistas)
async function deleteSong(songId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta canción?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/songs/${songId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            loadUserProfile(); // Recargar el perfil
        } else {
            throw new Error('Error al eliminar la canción');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la canción');
    }
}

// Inicializar la página
document.addEventListener('DOMContentLoaded', loadUserProfile);
