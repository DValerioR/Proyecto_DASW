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
                            <a href="profile.html?id=${artist._id}" class="btn btn-primary">Ver más</a>
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

// Cargar canciones en la sección
async function loadSongs(genre = null) {
    try {
        const response = genre
            ? await fetch(`${API_SONGS}?genre=${genre}`) // Filtrar por género
            : await fetch(API_SONGS); // Obtener todas las canciones

        const songs = await response.json();
        songSection.innerHTML = ""; // Limpia la sección

        if (songs.length === 0) {
            songSection.innerHTML = `<p class="text-center text-muted">No se encontraron canciones.</p>`;
            return;
        }

        songs.slice(0, 3).forEach(song => {
            songSection.innerHTML += `
                <div class="song-item d-flex align-items-center mb-3">
                    <img src="${song.album.image}" alt="${song.title}" class="me-3" 
                        style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px;">
                    <div>
                        <h6 class="mb-0">${song.title}</h6>
                        <small>${song.album.artist}</small><br>
                        <span class="small text-muted">Duración: ${song.duration || "N/A"}</span>
                    </div>
                    <button class="btn btn-primary ms-auto">Agregar</button>
                </div>
                <div class="song-actions">
                    <button class="btn btn-link like-btn ${song.likes.includes(userId) ? 'liked' : ''}" 
                            onclick="handleLike('${song._id}')">
                        <i class="fas fa-heart"></i>
                        <span class="likes-count">${song.likes.length}</span>
                    </button>
                    <button class="btn btn-link" onclick="handleAddToPlaylist('${song._id}')">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-link" onclick="playSong('${song._id}')">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error al cargar canciones:", error);
        songSection.innerHTML = `<p class="text-center text-danger">Ocurrió un error al cargar las canciones.</p>`;
    }
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

// Inicializar página
document.addEventListener("DOMContentLoaded", () => {
    loadGenresDropdown();
    loadPage();
});
