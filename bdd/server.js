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
      // Trouver et retirer l'utilisateur par son id_user
      rooms[roomName] = rooms[roomName].filter(user => user.id_user !== socket.id);
  
      // Si la salle est vide, la supprimer
      if (rooms[roomName].length === 0) {
        delete rooms[roomName];
      } else {
        // Notifier les autres utilisateurs du salon
        io.to(roomName).emit('user_list', rooms[roomName], roomName);
      }
    }
  });
  

  //------------------salon---------------------
  socket.on('join_room', (roomName, userName) => {
    socket.join(roomName);
    console.log(`Utilisateur ${socket.id} a rejoint le salon : ${roomName}`);
    

    // Ajouter l'utilisateur à la liste du salon
    if (!rooms[roomName]) {
      rooms[roomName] = [];
    }
    rooms[roomName].push({"name_user": userName, "id_user": socket.id, "score": "0"});

    // Envoyer la liste mise à jour des utilisateurs à tous les membres du salon
    io.to(roomName).emit('user_list', rooms[roomName], roomName);
  });

  socket.on('leave_room', (roomName) => {
    socket.leave(roomName);
    console.log(`Utilisateur ${socket.id} a quitté le salon : ${roomName}`);
  
    // Retirer l'utilisateur de la liste du salon
    if (rooms[roomName]) {
      rooms[roomName] = rooms[roomName].filter(user => user.id_user !== socket.id);
  
      // Si la salle est vide, la supprimer
      if (rooms[roomName].length === 0) {
        delete rooms[roomName];
      } else {
        // Envoyer la liste mise à jour des utilisateurs
        io.to(roomName).emit('user_list', rooms[roomName], roomName);
      }
    }
  });

  socket.on('broadcast_quiz', ({ quizId }) => {
  
    // Récupérer le quiz depuis la base de données
    db.get(`SELECT * FROM quizz WHERE id_quizz = ?`, [quizId], (err, row) => {
      if (err) {
        console.error('Erreur lors de la récupération du quiz :', err.message);
        socket.emit('error', 'Erreur lors de la récupération du quiz.');
      } else if (!row) {
        socket.emit('error', 'Quiz non trouvé.');
      } else {
        const quizData = {
          id: row.id_quizz,
          name: row.name_quizz,
          questions: JSON.parse(row.questions_quizz),
        };
  
        for (const roomName in rooms) {
          // Vérifier si "Billie" est dans la liste des utilisateurs de cette salle
          const user = rooms[roomName].find(member => member.id_user === socket.id);
          if (user) {
            io.to(roomName).emit('quiz_broadcast', quizData);
            console.log(`Quiz ${quizId} diffusé dans le salon ${roomName}`);
            break; // On peut arrêter la recherche une fois l'utilisateur trouvé
          }
        }
        
        // Diffuser le quiz uniquement au salon spécifié
      }
    });
  });
  
  socket.on('change_score', (score) => {
    // Parcourir toutes les salles
    for (const roomName in rooms) {
      // Vérifier si "Billie" est dans la liste des utilisateurs de cette salle
      const user = rooms[roomName].find(member => member.id_user === socket.id);
      if (user) {
        user["score"] = parseInt(user["score"]) + parseInt(score["score"])
        break; // On peut arrêter la recherche une fois l'utilisateur trouvé
      }
    }
  });

  socket.on('reset_score', () => {
    // Parcourir toutes les salles
    for (const roomName in rooms) {
      // Vérifier si "Billie" est dans la liste des utilisateurs de cette salle
      const mainUser = rooms[roomName].find(member => member.id_user === socket.id);
      if (mainUser) {
        rooms[roomName].forEach(user => {
          user["score"] = 0;
        });
        break; // On peut arrêter la recherche une fois l'utilisateur trouvé
      }
    }
  });

  socket.on('fetch_result', () => {
    // Parcourir toutes les salles
    for (const roomName in rooms) {
      // Vérifier si "Billie" est dans la liste des utilisateurs de cette salle
      const user = rooms[roomName].find(member => member.id_user === socket.id);
      if (user) {
        console.log(user)
        io.to(roomName).emit('show_Result', rooms[roomName]);
        break; // On peut arrêter la recherche une fois l'utilisateur trouvé
      }
    }
  });
  
});

// Démarrer le serveur HTTP
server.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});
