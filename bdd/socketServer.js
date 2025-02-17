const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app); // Créer le serveur HTTP
const io = new Server(server); // Attacher Socket.IO au serveur HTTP

const sqlite3 = require('sqlite3').verbose();

// Connexion à la base de données
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Erreur lors de l\'ouverture de la base de données:', err.message);
  } else {
    console.log('Connexion à la base de données SQLite réussie.');
  }
});

const port = 3000;

// Liste des utilisateurs connectés par salon
const rooms = {}; // Ex : { roomName: [socketId1, socketId2, ...] }

// Front-end de l'application
try {
  app.use(express.static(path.join(__dirname, '../css')));
  app.use(express.static(path.join(__dirname, '../controler')));
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
  });
} catch {
  console.log("Index indisponible");
}

//--------------------------Socket----------------------
io.on('connection', (socket) => {
  console.log('Un client est connecté :', socket.id);

  // Envoyer un message de bienvenue au client
  socket.emit('message', 'Bienvenue sur le serveur Socket.IO');

  // Gérer la déconnexion d'un client
  socket.on('disconnect', () => {
    console.log(`Client déconnecté : ${socket.id}`);

    // Retirer le socket de toutes les salles où il était
    for (const roomName in rooms) {
      rooms[roomName] = rooms[roomName].filter((id) => id !== socket.id);

      // Si la salle est vide, la supprimer
      if (rooms[roomName].length === 0) {
        delete rooms[roomName];
      } else {
        // Notifier les autres utilisateurs du salon
        io.to(roomName).emit('user_list', rooms[roomName]);
      }
    }
  });

  //------------------salon---------------------
  socket.on('join_room', (roomName) => {
    socket.join(roomName);
    console.log(`Utilisateur ${socket.id} a rejoint le salon : ${roomName}`);

    // Ajouter l'utilisateur à la liste du salon
    if (!rooms[roomName]) {
      rooms[roomName] = [];
    }
    rooms[roomName].push(socket.id);

    // Envoyer la liste mise à jour des utilisateurs à tous les membres du salon
    io.to(roomName).emit('user_list', rooms[roomName]);
  });

  socket.on('leave_room', (roomName) => {
    socket.leave(roomName);
    console.log(`Utilisateur ${socket.id} a quitté le salon : ${roomName}`);

    // Retirer l'utilisateur de la liste du salon
    if (rooms[roomName]) {
      rooms[roomName] = rooms[roomName].filter((id) => id !== socket.id);

      // Si la salle est vide, la supprimer
      if (rooms[roomName].length === 0) {
        delete rooms[roomName];
      } else {
        // Envoyer la liste mise à jour des utilisateurs
        io.to(roomName).emit('user_list', rooms[roomName]);
      }
    }
  });
});

// Démarrer le serveur HTTP
server.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});
