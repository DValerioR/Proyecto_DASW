const mongoose = require('mongoose');

// Definición de esquemas
const albumSchema = new mongoose.Schema({
    _id: { type: String },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    genre: { type: String, required: true },
    image: { type: String, required: true }
});

// Middleware para generar el _id del álbum
albumSchema.pre('save', function (next) {
    const artistInitials = this.artist
        .split(' ')
        .map(word => word[0].toUpperCase())
        .join('');

    const albumTitleCamelCase = this.title
        .split(' ')
        .map((word, index) =>
            index === 0
                ? word.toLowerCase()
                : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join('');

    this._id = `${artistInitials}-${albumTitleCamelCase}`;
    next();
});

const Album = mongoose.model('Album', albumSchema);

const songSchema = new mongoose.Schema({
    _id: { type: String },
    title: { type: String, required: true },
    album: { type: String, ref: 'Album', required: true }, // Cambiado a String para usar el _id personalizado
    duration: { type: String },
    music: { type: String, required: true }
});

// Middleware para generar el _id de la canción
songSchema.pre('save', async function (next) {
    try {
        const album = await Album.findById(this.album);

        if (!album) {
            throw new Error('Álbum no encontrado para la canción');
        }

        const artistInitials = album.artist
            .split(' ')
            .map(word => word[0].toUpperCase())
            .join('');

        const albumTitleCamelCase = album.title
            .split(' ')
            .map((word, index) =>
                index === 0
                    ? word.toLowerCase()
                    : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join('');

        const songTitleCamelCase = this.title
            .split(' ')
            .map((word, index) =>
                index === 0
                    ? word.toLowerCase()
                    : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join('');

        this._id = `${artistInitials}-${albumTitleCamelCase}-${songTitleCamelCase}`;
        next();
    } catch (error) {
        next(error);
    }
});

const Song = mongoose.model('Song', songSchema);

// Los datos de albumsData permanecen igual que antes...
const albumsData = [
    // ROCK
    {
        title: "Nevermind",
        artist: "Nirvana",
        genre: "Rock",
        image: "/Proyecto_DASW/images/Nirvana-Nevermind.jpeg",
        songs: [
            {
                title: "Smells Like Teen Spirit",
                duration: "5:01",
                music: "/music/N-nevermind-smellsLikeTeenSpirit.mp4"
            },
            {
                title: "In Bloom",
                duration: "4:15",
                music: "/music/N-nevermind-inBloom.mp4"
            },
            {
                title: "Come As You Are",
                duration: "3:39",
                music: "/music/N-nevermind-comeAsYouAre.mp4"
            },
            {
                title: "Lithium",
                duration: "4:17",
                music: "/music/N-nevermind-lithium.mp4"
            }
        ]
    },
    {
        title: "Black Holes and Revelations",
        artist: "Muse",
        genre: "Rock",
        image: "/Proyecto_DASW/images/Muse.jpeg",
        songs: [
            {
                title: "Starlight",
                duration: "4:00",
                music: "/music/M-blackHolesAndRevelations-starlight.mp4"
            },
            {
                title: "Supermassive Black Hole",
                duration: "3:29",
                music: "/music/M-blackHolesAndRevelations-supermassiveBlackHole.mp4"
            },
            {
                title: "Knights of Cydonia",
                duration: "6:07",
                music: "/music/M-blackHolesAndRevelations-knightsOfCydonia.mp4"
            }
        ]
    },

    // POP
    {
        title: "Lover",
        artist: "Taylor Swift",
        genre: "Pop",
        image: "/Proyecto_DASW/images/Taylor_Swift-Lover.jpg",
        songs: [
            {
                title: "Cruel Summer",
                duration: "2:58",
                music: "/music/TS-lover-cruelSummer.mp4"
            },
            {
                title: "Lover",
                duration: "3:41",
                music: "/music/TS-lover-lover.mp4"
            },
            {
                title: "The Man",
                duration: "3:10",
                music: "/music/TS-lover-theMan.mp4"
            }
        ]
    },
    {
        title: "Divide",
        artist: "Ed Sheeran",
        genre: "Pop",
        image: "/Proyecto_DASW/images/Divide.jpeg",
        songs: [
            {
                title: "Shape of You",
                duration: "3:53",
                music: "/music/ES-divide-shapeOfYou.mp4"
            },
            {
                title: "Castle on the Hill",
                duration: "4:21",
                music: "/music/ES-divide-castleOnTheHill.mp4"
            },
            {
                title: "Perfect",
                duration: "4:23",
                music: "/music/ES-divide-perfect.mp4"
            }
        ]
    },

    // HIP-HOP
    {
        title: "DAMN",
        artist: "Kendrick Lamar",
        genre: "Hip-Hop",
        image: "/Proyecto_DASW/images/Kendrick_Lamar-DAMN.jpeg",
        songs: [
            {
                title: "HUMBLE",
                duration: "2:57",
                music: "/music/KL-DAMN-HUMBLE.mp4"
            },
            {
                title: "DNA",
                duration: "3:05",
                music: "/music/KL-DAMN-DNA.mp4"
            },
            {
                title: "LOYALTY",
                duration: "3:47",
                music: "/music/KL-DAMN-LOYALTY.mp4"
            }
        ]
    },
    {
        title: "Scorpion",
        artist: "Drake",
        genre: "Hip-Hop",
        image: "/Proyecto_DASW/images/Drake-Scorpion.jpg",
        songs: [
            {
                title: "Gods Plan",
                duration: "3:18",
                music: "/music/D-scorpion-godsPlan.mp4"
            },
            {
                title: "In My Feelings",
                duration: "3:37",
                music: "/music/D-scorpion-inMyFeelings.mp4"
            },
            {
                title: "Nice For What",
                duration: "3:30",
                music: "/music/D-scorpion-niceForWhat.mp4"
            }
        ]
    },

    // ELECTRÓNICA
    {
        title: "Random Access Memories",
        artist: "Daft Punk",
        genre: "Electrónica",
        image: "/Proyecto_DASW/images/Daft_Punk-Random_Access_Memories.jpeg",
        songs: [
            {
                title: "Get Lucky",
                duration: "4:08",
                music: "/music/DP-randomAccessMemories-getLucky.mp4"
            },
            {
                title: "Instant Crush",
                duration: "5:37",
                music: "/music/DP-randomAccessMemories-instantCrush.mp4"
            },
            {
                title: "Lose Yourself to Dance",
                duration: "5:53",
                music: "/music/DP-randomAccessMemories-loseYourselfToDance.mp4"
            }
        ]
    },
    {
        title: "Nothing But The Beat",
        artist: "David Guetta",
        genre: "Electrónica",
        image: "/Proyecto_DASW/images/David_Guetta-Nothing_But_The_Beat.jpeg",
        songs: [
            {
                title: "Titanium",
                duration: "4:05",
                music: "/music/DG-nothingButTheBeat-titanium.mp4"
            },
            {
                title: "Turn Me On",
                duration: "3:19",
                music: "/music/DG-nothingButTheBeat-turnMeOn.mp4"
            },
            {
                title: "Without You",
                duration: "3:28",
                music: "/music/DG-nothingButTheBeat-withoutYou.mp4"
            }
        ]
    },

    // JAZZ
    {
        title: "I Put A Spell On You",
        artist: "Nina Simone",
        genre: "Jazz",
        image: "/Proyecto_DASW/images/Nina_Simone-I_Put_A_Spell_On_You.jpg",
        songs: [
            {
                title: "Feeling Good",
                duration: "2:57",
                music: "/music/NS-iPutASpellOnYou-feelingGood.mp4"
            },
            {
                title: "I Put A Spell On You",
                duration: "2:34",
                music: "/music/NS-iPutASpellOnYou-iPutASpellOnYou.mp4"
            },
            {
                title: "Ne Me Quitte Pas",
                duration: "3:35",
                music: "/music/NS-iPutASpellOnYou-neMeQuittePas.mp4"
            }
        ]
    },
    {
        title: "Head Hunters",
        artist: "Herbie Hancock",
        genre: "Jazz",
        image: "/Proyecto_DASW/images/Herbie_Hancock-Head_Hunters.jpg",
        songs: [
            {
                title: "Chameleon",
                duration: "15:41",
                music: "/music/HH-headHunters-chameleon.mp4"
            },
            {
                title: "Watermelon Man",
                duration: "6:29",
                music: "/music/HH-headHunters-watermelonMan.mp4"
            },
            {
                title: "Sly",
                duration: "10:15",
                music: "/music/HH-headHunters-sly.mp4"
            }
        ]
    },

    // REGGAETON
    {
        title: "Un Verano Sin Ti",
        artist: "Bad Bunny",
        genre: "Reggaeton",
        image: "/Proyecto_DASW/images/Bad_Bunny-Un_Verano_Sin_Ti.jpg",
        songs: [
            {
                title: "Titi Me Pregunto",
                duration: "4:03",
                music: "/music/BB-unVeranoSinTi-titiMePregunto.mp4"
            },
            {
                title: "Me Porto Bonito",
                duration: "2:58",
                music: "/music/BB-unVeranoSinTi-mePortoBonito.mp4"
            },
            {
                title: "Ojitos Lindos",
                duration: "4:18",
                music: "/music/BB-unVeranoSinTi-ojitosLindos.mp4"
            }
        ]
    },
    {
        title: "MAÑANA SERÁ BONITO",
        artist: "Karol G",
        genre: "Reggaeton",
        image: "/Proyecto_DASW/images/Karol_G-MAÑANA_SERA_BONITO.jpeg",
        songs: [
            {
                title: "Provenza",
                duration: "3:31",
                music: "/music/KG-mananaBonito-provenza.mp4"
            },
            {
                title: "Mamiii",
                duration: "3:28",
                music: "/music/KG-mananaBonito-mamiii.mp4"
            },
            {
                title: "TQG",
                duration: "3:34",
                music: "/music/KG-mananaBonito-TQG.mp4"
            }
        ]
    }
];


// Función para insertar los datos
async function seedDatabase() {
    try {
        // Conectar a MongoDB
        await mongoose.connect('mongodb+srv://admin:MA021224@myapp.aq5jn.mongodb.net/MusicArtistDB', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Conexión a MongoDB establecida');

        // Limpiar las colecciones existentes
        await Album.deleteMany({});
        await Song.deleteMany({});
        console.log('Colecciones limpiadas');

        // Insertar los álbumes y sus canciones
        for (const albumData of albumsData) {
            const { songs, ...albumInfo } = albumData;
            const album = new Album(albumInfo);
            await album.save();
            console.log(`Álbum guardado: ${album._id}`);

            // Insertar las canciones asociadas a este álbum
            for (const songData of songs) {
                const song = new Song({
                    ...songData,
                    album: album._id // Ahora usa el _id personalizado del álbum
                });
                await song.save();
                console.log(`Canción guardada: ${song._id}`);
            }
        }

        console.log('Base de datos poblada exitosamente');
        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error al poblar la base de datos:', error);
        mongoose.connection.close();
        process.exit(1);
    }
}

// Ejecutar el script
seedDatabase();