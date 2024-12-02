document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', document.getElementById('songTitle').value);
    formData.append('genre', document.getElementById('genre').value);

    // Aqui en lugar de subir la imagen o la cancion como tal, esto puede ser muy pesado
    // y causar errores, en lugar de eso guardenlas en una carpeta local al mismo nivel del server
    // puede ser la misma si quieren, una carpeta uploads, o dos separadas para imagenes y canciones
    // y en lugar de guardar el archivo guarden el path src="../uploads/filename" osea que guardarian
    // esto ../uploads/filename y al momento de usarlo tanto en la funcion de reproducir como para las imagenes
    // lo usarian asi src="../uploads/filename" o lo que es lo mismo src="${song.audioFile}"
    formData.append('audioFile', document.getElementById('songFile').files[0]);
    formData.append('coverImage', document.getElementById('coverImage').files[0]);

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            alert('Canción subida exitosamente');
            window.location.href = 'index.html';
        } else {
            const error = await response.json();
            alert(`Error: ${error.message}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al subir la canción');
    }
});