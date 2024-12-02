const API_BASE = "http://localhost:3000";
const API_GENRES = `${API_BASE}/genres`;
const API_ARTISTS = `${API_BASE}/artists`;
const API_SONGS = `${API_BASE}/songs`;

const genreList = document.getElementById("genreList");
const pageTitle = document.getElementById("pageTitle");
const carouselContent = document.getElementById("carouselContent");
const artistTitle = document.getElementById("artistTitle");
const artistSection = document.getElementById("artistSection");
const songTitle = document.getElementById("songTitle");
const songSection = document.getElementById("songSection");

// Cargar géneros en el dropdown
async function loadGenresDropdown() {
    try {
        const response = await fetch(API_GENRES);
        const genres = await response.json();
        genreList.innerHTML = "";

        genres.forEach(genre => {
            const li = document.createElement("li");
            li.innerHTML = `<a class="dropdown-item" href="#" onclick="loadPage('${genre}')">${genre}</a>`;
            genreList.appendChild(li);
        });
    } catch (error) {
        console.error("Error al cargar géneros:", error);
    }
}

// Actualizar título de la página
function updatePageTitle(genre) {
    pageTitle.textContent = genre ? `Género: ${genre}` : "Géneros Destacados";
}

// Cargar géneros destacados en la página principal
async function loadGenresSection() {
    try {
        const response = await fetch(API_GENRES);
        const genres = await response.json();

        artistSection.innerHTML = ""; // Limpia la sección
        genres.slice(0, 6).forEach((genre, index) => {
            artistSection.innerHTML += `
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <img src="/images/genre-${index + 1}.jpg" class="card-img-top" alt="${genre}">
                        <div class="card-body text-center">
                            <h5 class="card-title">${genre}</h5>
                            <a href="#" onclick="loadPage('${genre}')" class="btn btn-primary">Explorar</a>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error al cargar géneros destacados:", error);
    }
}

// Cargar artistas en el carrusel
async function loadCarousel(genre = null) {
    try {
        const response = genre
            ? await fetch(`${API_ARTISTS}?genre=${genre}`) // Filtrar por género
            : await fetch(API_ARTISTS); // Obtener todos los artistas
        const artists = await response.json();
        carouselContent.innerHTML = ""; // Limpia el carrusel

        if (artists.length === 0) {
            carouselContent.innerHTML = `
                <div class="carousel-item active">
                    <img src="/images/default.jpg" class="d-block w-100" alt="Sin Artistas">
                    <div class="carousel-caption d-none d-md-block">
                        <h5>No hay artistas disponibles</h5>
                    </div>
                </div>
            `;
            return;
        }

        artists.slice(0, 3).forEach((artist, index) => {
            const isActive = index === 0 ? "active" : "";
            carouselContent.innerHTML += `
                <div class="carousel-item ${isActive}">
                    <img src="${artist.image}" class="d-block w-100" alt="${artist.name}">
                    <div class="carousel-caption d-none d-md-block">
                        <h5>${artist.name}</h5>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error al cargar el carrusel:", error);
        carouselContent.innerHTML = `
            <div class="carousel-item active">
                <img src="/images/error.jpg" class="d-block w-100" alt="Error">
                <div class="carousel-caption d-none d-md-block">
                    <h5>Error al cargar artistas</h5>
                </div>
            </div>
        `;
    }
}


// Actualizar título de la sección de artistas
function updateArtistTitle(genre) {
    artistTitle.textContent = genre ? `Artistas del Género: ${genre}` : "Géneros Destacados";
}

// Cargar artistas en la sección
async function loadArtists(genre = null) {
    try {
        const response = genre
            ? await fetch(`${API_ARTISTS}?genre=${genre}`) // Filtrar por género
            : await fetch(API_ARTISTS); // Obtener todos los artistas

        const artists = await response.json();
        artistSection.innerHTML = ""; // Limpia la sección

        if (artists.length === 0) {
            artistSection.innerHTML = `<p class="text-center text-muted">No se encontraron artistas.</p>`;
            return;
        }

        artists.slice(0, 3).forEach(artist => {
            artistSection.innerHTML += `
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <img src="${artist.image}" class="card-img-top" alt="${artist.name}">
                        <div class="card-body text-center">
                            <h5 class="card-title">${artist.name}</h5>
                            <a href="artist-profile.html?id=${artist._id}" class="btn btn-primary">Ver más</a>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error al cargar artistas:", error);
        artistSection.innerHTML = `<p class="text-center text-danger">Ocurrió un error al cargar los artistas.</p>`;
    }
}


// Actualizar título de la sección de canciones
function updateSongTitle(genre) {
    songTitle.textContent = genre ? `Canciones del Género: ${genre}` : "Canciones Destacadas";
}

// Función para cargar canciones
async function loadSongs(genre = null) {
    try {
        const response = genre
            ? await fetch(`${API_BASE}/songs?genre=${genre}`)
            : await fetch(`${API_BASE}/songs`);

        if (!response.ok) throw new Error('Error en la respuesta del servidor');

        const songs = await response.json();
        songSection.innerHTML = songs.length === 0 
            ? '<p class="text-center text-muted">No se encontraron canciones.</p>'
            : songs.slice(0, 3).map(song => `
                <div class="song-item d-flex align-items-center mb-3">
                    <img src="${song.album?.image || '/api/placeholder/40/40'}" 
                         alt="${song.title}" 
                         class="me-3"
                         style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px;">
                    <div>
                        <h6 class="mb-0">${song.title}</h6>
                        <small>${song.album?.artist || 'Artista desconocido'}</small><br>
                        <span class="small text-muted">Duración: ${song.duration || "N/A"}</span>
                    </div>
                    <button class="btn btn-primary ms-auto" onclick="handleAddToPlaylist('${song._id}')">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            `).join('');
    } catch (error) {
        console.error("Error detallado:", error);
        songSection.innerHTML = `<p class="text-center text-danger">Ocurrió un error al cargar las canciones.</p>`;
    }
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




async function searching(event) {
    event.preventDefault(); // Prevenir el comportamiento por defecto del formulario

    const query = document.getElementById('barSearch').value.trim();
    if (!query) {
        alert('Por favor, ingresa un término de búsqueda');
        return;
    }

    try {
        // Realiza la solicitud al backend
        const response = await fetch(`/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error('Error en la búsqueda');
        }

        const results = await response.json(); // Parsear la respuesta como JSON
        displayResults(results); // Mostrar resultados en la página
    } catch (error) {
        console.error('Error al realizar la búsqueda:', error);
        document.getElementById('searchResults').innerHTML = '<p>Error al realizar la búsqueda.</p>';
    }
}

function displayResults(results) {
    const { artists, albums, songs } = results;

    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = ''; // Limpiar resultados previos

    // Título general
    resultsDiv.innerHTML += `<div class="result-title">Resultados:</div>`;
    resultsDiv.innerHTML += `<button id="closeSearch" class="close-btn" onclick="closeSearch(event)">×</button>`;

    // Mostrar artistas
    if (artists.length > 0) {
        resultsDiv.innerHTML += `<h3>Artistas:</h3>`;
        artists.forEach(artist => {
            resultsDiv.innerHTML += `
                <div>
                    <strong>${artist.name}</strong>
                    <p>Géneros: ${artist.genres.join(', ')}</p>
                </div>`;
        });
    }

    // Mostrar álbumes
    if (albums.length > 0) {
        resultsDiv.innerHTML += `<h3>Álbumes:</h3>`;
        albums.forEach(album => {
            resultsDiv.innerHTML += `
                <div>
                    <strong>${album.title}</strong>
                    <p>Artista: ${album.artist.name}</p>
                </div>`;
        });
    }

    // Mostrar canciones
    if (songs.length > 0) {
        resultsDiv.innerHTML += `<h3>Canciones:</h3>`;
        songs.forEach(song => {
            const albumImage = song.album.imageUrl || 'default-image.jpg';  // Imagen por defecto
            const albumArtist = song.album.artist.name || 'Desconocido';
            const duration = song.duration || 'N/A';

            resultsDiv.innerHTML += `
                <div class="song-item d-flex align-items-center mb-3">
                    <img src="${albumImage}" alt="${song.title}" class="me-3" 
                        style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px;">
                    <div>
                        <h6 class="mb-0">${song.title}</h6>
                        <small>${albumArtist}</small><br>
                        <span class="small text-muted">Duración: ${duration}</span>
                    </div>
                    <button class="btn btn-primary ms-auto">Agregar</button>
                    <button class="btn btn-success ms-2" onclick="playSong('${song.id}')">
                        <i class="bi bi-play-fill"></i> Reproducir
                    </button>
                </div>`;
        });
    }

    // Si no hay resultados
    if (artists.length === 0 && albums.length === 0 && songs.length === 0) {
        resultsDiv.innerHTML = '<p class="no-results">No se encontraron resultados.</p>';
    }
}

// Función para manejar la reproducción de la canción
function playSong(songId) {
    console.log(`Reproduciendo la canción con ID: ${songId}`);
    // Aquí puedes agregar la lógica para reproducir la canción.
}



// Función para cerrar los resultados de búsqueda
function closeSearch(event) {
    event.preventDefault;
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.style.display = 'none'; // Ocultar los resultados
}


// Cargar página principal o de género
async function loadPage(genre = null) {
    updatePageTitle(genre);

    if (!genre) {
        // Página principal
        await loadGenresSection();
        artistTitle.textContent = "Géneros Destacados";
    } else {
        // Género específico
        await loadArtists(genre);
        artistTitle.textContent = `Artistas del Género: ${genre}`;
    }

    updateSongTitle(genre);
    await loadCarousel(genre); // Carrusel
    await loadSongs(genre); // Canciones
}
// Colocar boton de subir cancion para artistas
document.addEventListener('DOMContentLoaded', async () => {
    const artistControls = document.getElementById('artistControls');
    const token = localStorage.getItem('token');

    if (token) {
        try {
            const response = await fetch('http://localhost:3000/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const user = await response.json();
                if (user.isArtist) {
                    const uploadButton = document.createElement('a');
                    uploadButton.href = "upload.html";
                    uploadButton.className = "nav-link";
                    uploadButton.innerHTML = `
                        <button type="button" class="btn btn-default text-white">
                            <i class="fa-solid fa-upload nav-link"></i> Subir Canción
                        </button>
                    `;
                    artistControls.appendChild(uploadButton);
                }
            } else {
                console.error('Error al obtener el perfil:', await response.text());
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
        }
    }
});

// Boton de cerrar sesion
document.addEventListener('DOMContentLoaded', () => {
    const authButton = document.getElementById('authButton');
    const token = localStorage.getItem('token');

    if (token) {
        // Usuario autenticado, mostrar botón de cerrar sesión
        authButton.innerHTML = `
            <ul class="navbar-nav" id="authButton">
                <li class="nav-item" >
                    <button class="btn btn-default">
                        <a class="fa-regular fa-user nav-link" href="perfil.html"></a>
                    </button>
                </li>
            </ul> 
            <ul class="navbar-nav">
                <li class="nav-item">
                    <button class="btn btn-danger" id="logoutButton">
                        <i class="fa-solid fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                </li>
            </ul>
        `;

        document.getElementById('logoutButton').addEventListener('click', () => {
            localStorage.removeItem('token'); // Eliminar el token
            alert('Has cerrado sesión exitosamente.');
            window.location.href = 'index.html'; // Redirigir a la página principal
        });
    } else {
        // Usuario no autenticado, mostrar botón de login
        authButton.innerHTML = `
            <a class="btn btn-primary" href="login.html">
                <i class="fa-solid fa-sign-in-alt"></i> Iniciar Sesión
            </a>
        `;
    }
});

// Inicializar página
document.addEventListener("DOMContentLoaded", () => {
    loadGenresDropdown();
    loadPage();
});
