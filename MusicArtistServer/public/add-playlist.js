const API_BASE = "http://localhost:3000";

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    loadAvailableSongs();
});

// Cargar canciones disponibles
async function loadAvailableSongs() {
    try {
        const response = await fetch(`${API_BASE}/songs`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar las canciones');
        }

        const songs = await response.json();
        displaySongs(songs);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('songsList').innerHTML = 
            '<div class="alert alert-danger">Error al cargar las canciones</div>';
    }
}

// Mostrar canciones en la interfaz
function displaySongs(songs) {
    const songsContainer = document.getElementById('songsList');
    songsContainer.innerHTML = songs.map(song => `
        <div class="song-item d-flex align-items-center p-2 mb-2 bg-dark rounded">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${song._id}" id="song-${song._id}">
            </div>
            <img src="${song.album?.image || '/api/placeholder/40/40'}" 
                 alt="${song.title}"
                 class="mx-2"
                 style="width: 40px; height: 40px; object-fit: cover;">
            <div class="song-info flex-grow-1">
                <div class="song-title text-light">${song.title}</div>
                <small class="text-muted">${song.album?.artist || 'Artista desconocido'}</small>
            </div>
            <span class="text-muted">${song.duration || '--:--'}</span>
        </div>
    `).join('');
}

// Manejar el envío del formulario
document.getElementById('playlistForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const playlistName = document.getElementById('playlistName').value;
    const selectedSongs = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);

    if (!playlistName.trim()) {
        alert('Por favor, ingresa un nombre para la playlist');
        return;
    }

    if (selectedSongs.length === 0) {
        alert('Por favor, selecciona al menos una canción');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/playlist`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: playlistName,
                songs: selectedSongs
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear la playlist');
        }

        const data = await response.json();
        alert('Playlist creada exitosamente');
        window.location.href = 'playlist.html';
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Error al crear la playlist');
    }
});