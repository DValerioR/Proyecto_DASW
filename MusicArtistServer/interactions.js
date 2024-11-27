let currentSongId = null;

// Funciones de interacción
async function handleLike(songId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showLoginModal();
            return;
        }

        const response = await fetch(`/songs/${songId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const likeBtn = document.querySelector(`button[onclick="handleLike('${songId}')"]`);
            likeBtn.classList.toggle('liked', data.isLiked);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function handleAddToPlaylist(songId) {
    currentSongId = songId;
    const token = localStorage.getItem('token');
    if (!token) {
        showLoginModal();
        return;
    }

    try {
        const response = await fetch('/playlists', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const playlists = await response.json();
        
        const select = document.getElementById('playlistSelect');
        select.innerHTML = playlists.map(p => 
            `<option value="${p._id}">${p.name}</option>`
        ).join('');
        
        new bootstrap.Modal(document.getElementById('addToPlaylistModal')).show();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function playSong(songId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showLoginModal();
        return;
    }

    try {
        await fetch(`/songs/${songId}/play`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        // Aquí iría la lógica del reproductor
    } catch (error) {
        console.error('Error:', error);
    }
}

async function confirmAddToPlaylist() {
    const playlistId = document.getElementById('playlistSelect').value;
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`/playlist/${playlistId}/song`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ songId: currentSongId })
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('addToPlaylistModal')).hide();
            showAlert('Canción agregada a la playlist', 'success');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al agregar la canción', 'error');
    }
}

// Funciones auxiliares
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed bottom-0 end-0 m-3`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
}

function showLoginModal() {
    // Implementar según tu modal de login existente
}
