// Modal para reproducción de música
// esto lo tienes que poner en index.js, de hecho todos van ahi, pero en especial este se va cargar 
// primero con la linea  de este codigo
function createAudioModal() {
    const modalHTML = `
        <div class="modal fade" id="audioPlayerModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content bg-dark text-white">
                    <div class="modal-header">
                        <h5 class="modal-title">Reproduciendo</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <img id="songCover" src="" alt="Album Cover" class="img-fluid mb-3 rounded" style="max-width: 200px;">
                        <h4 id="songTitle" class="mb-2"></h4>
                        <p id="artistName" class="text-muted"></p>
                        <audio id="audioPlayer" controls class="w-100 mt-3">
                            <source src="" type="audio/mp3">
                            Tu navegador no soporta el elemento de audio.
                        </audio>
                    </div>
                </div>
            </div>
        </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Función para reproducir la canción
// esta funcion ingual va en index.js, y se la debes de poner de onclick a los botones de reproducir
// esta funcion debe de recibir el id de la cancion que lo puedes poner en el onclick="playSong(songs.id)" pero pues ya lo haces
function playSong(songId) {

    // Primero debes de obtener la informacion de la cancion
    // Puedes haciendolo con un fetch a localhost3000 con un get
    // Para esto debes de tener una ruta en el server que pasandole el id de la cancion
    // busque y regresa la informacion

    try{
        // const songData = await fetch
        const modal = document.getElementById('audioPlayerModal');
        const audioPlayer = document.getElementById('audioPlayer');
        const songCover = document.getElementById('songCover');
        const songTitle = document.getElementById('songTitle');
        const artistName = document.getElementById('artistName');

        songCover.src = songData.albumImage;
        songTitle.textContent = songData.title;
        artistName.textContent = songData.artist;
        audioPlayer.src = songData.audioUrl; 

        // el audio url debe de ser la direccion de la cancion, te recomiendo que tengas una carpeta songs
        // en la que se guarden las canciones, para esto debes de tener una ruta post de canciones
        // en la ruta debes de primero guardar el archivo de la cancion en tu carpeta local de canciones
        // y despues en la base de datos guardas la informacion restante normal, y en el audioUrl guardas el path de la cancion

        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();

        audioPlayer.play();
    } catch (error){

    }
}


document.addEventListener('DOMContentLoaded', createAudioModal);
