const API_BASE = "http://localhost:3000";
let currentPlaylist = null;

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    loadUserPlaylists();
    setupAuthButton();
});

// Cargar las playlists del usuario
async function loadUserPlaylists() {
    const playlistGrid = document.getElementById('playlistGrid');
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        const response = await fetch(`${API_BASE}/playlists`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al obtener las playlists');
        }

        const playlists = await response.json();
        displayPlaylists(playlists);

    } catch (error) {
        console.error('Error detallado:', error);
        playlistGrid.innerHTML = `
            <div class="alert alert-danger m-3">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error al cargar las playlists: ${error.message}
                <br><small>Por favor, intenta recargar la página</small>
            </div>
        `;
    }
}

// Mostrar las playlists en la interfaz
function displayPlaylists(playlists) {
    const playlistGrid = document.getElementById('playlistGrid');
    
    if (playlists.length === 0) {
        playlistGrid.innerHTML = `
            <div class="text-center text-muted">
                <p>No tienes playlists todavía</p>
                <a href="add-playlist.html" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Crear tu primera playlist
                </a>
            </div>
        `;
        return;
    }

    playlistGrid.innerHTML = playlists.map(playlist => `
        <div class="playlist-card mb-3" onclick="displayPlaylistContent(${JSON.stringify(playlist).replace(/"/g, '&quot;')})">
            <img src="${playlist.image || '/api/placeholder/200/200'}" 
                 alt="${playlist.name}" 
                 class="playlist-image">
            <div class="playlist-info p-3">
                <h5 class="playlist-name">${playlist.name}</h5>
                <p class="song-count mb-0">
                    ${playlist.songs.length} canciones
                </p>
            </div>
            <div class="playlist-actions">
                <button class="btn btn-sm btn-danger" 
                        onclick="event.stopPropagation(); deletePlaylist('${playlist._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function displayPlaylistContent(playlist) {
    currentPlaylist = playlist;
    const contentDiv = document.getElementById('playlistContent');
    
    try {
        // Obtener detalles completos de las canciones
        const response = await fetch(`${API_BASE}/playlist/${playlist._id}/songs`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener detalles de las canciones');
        }

        const songsDetails = await response.json();
        
        contentDiv.innerHTML = `
            <div class="playlist-header mb-4">
                <div class="d-flex align-items-center">
                    <div class="playlist-image me-4">
                        <img src="/api/placeholder/200/200" 
                             alt="${playlist.name}"
                             class="rounded"
                             style="width: 150px; height: 150px; object-fit: cover;">
                    </div>
                    <div>
                        <h2>${playlist.name}</h2>
                        <p class="text-muted mb-2">${playlist.songs.length} canciones</p>
                    </div>
                </div>
            </div>
            
            <div class="playlist-songs">
                ${renderPlaylistSongs(songsDetails)}
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        contentDiv.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar el contenido de la playlist: ${error.message}
            </div>
        `;
    }
}

function renderPlaylistSongs(songs) {
    if (!songs || songs.length === 0) {
        return '<p class="text-muted">Esta playlist está vacía</p>';
    }

    return `
        <div class="song-list">
            ${songs.map((song, index) => `
                <div class="song-item d-flex align-items-center p-3 border-bottom">
                    <span class="me-3 text-muted">${index + 1}</span>
                    <img src="${song.album?.image || '/api/placeholder/40/40'}" 
                         alt="${song.title}"
                         class="me-3"
                         style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                    <div class="flex-grow-1">
                        <div class="song-title">${song.title}</div>
                        <small class="text-muted">${song.album?.artist || 'Artista desconocido'}</small>
                    </div>
                    <div class="me-3 text-muted">${song.duration || '--:--'}</div>
                    <button class="btn btn-sm btn-danger" 
                            onclick="removeSongFromPlaylist('${song._id}', '${currentPlaylist._id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}


// Eliminar una playlist
async function deletePlaylist(playlistId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta playlist?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/playlist/${playlistId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al eliminar la playlist');
        }

        loadUserPlaylists();
        document.getElementById('playlistContent').innerHTML = `
            <div class="text-center text-muted mt-5">
                <i class="fas fa-music fa-3x mb-3"></i>
                <h4>Selecciona una playlist para ver su contenido</h4>
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la playlist');
    }
}

// Remover una canción de la playlist
async function removeSongFromPlaylist(songId) {
    if (!currentPlaylist) return;
    
    if (!confirm('¿Estás seguro de que deseas eliminar esta canción de la playlist?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/playlist/${currentPlaylist._id}/songs/${songId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al remover la canción');
        }

        // Actualizar la lista de canciones en la interfaz
        currentPlaylist.songs = currentPlaylist.songs.filter(song => song._id !== songId);
        displayPlaylistContent(currentPlaylist);
        loadUserPlaylists(); // Recargar la lista de playlists para actualizar el contador
    } catch (error) {
        console.error('Error:', error);
        alert('Error al remover la canción de la playlist');
    }
}

// Configurar el botón de autenticación
function setupAuthButton() {
    const authButton = document.getElementById('authButton');
    const token = localStorage.getItem('token');

    if (token) {
        authButton.innerHTML = `
            <button class="btn btn-danger" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
            </button>
        `;
    } else {
        authButton.innerHTML = `
            <a href="login.html" class="btn btn-primary">
                <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
            </a>
        `;
    }
}

// Función de logout
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}
