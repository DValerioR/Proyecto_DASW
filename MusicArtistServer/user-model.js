const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    _id: { type: String },
    username: { 
        type: String, 
        required: true,
        unique: true,
        trim: true
    },
    email: { 
        type: String, 
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: { 
        type: String, 
        required: true 
    },
    isArtist: {
        type: Boolean,
        default: false
    },
    profilePicture: {
        type: String,
        default: '/images/default-avatar.jpg'
    },
    playlists: [{
        name: String,
        songs: [{ type: String, ref: 'Song' }]
    }],
    following: [{ type: String, ref: 'User' }],
    followers: [{ type: String, ref: 'User' }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Generar ID personalizado
userSchema.pre('save', function(next) {
    if (this.isNew) {
        const username = this.username.toLowerCase().replace(/[^a-z0-9]/g, '');
        const timestamp = Date.now().toString(36);
        this._id = `user-${username}-${timestamp}`;
    }
    next();
});

// Hash contraseña antes de guardar
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Método para verificar contraseña
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
