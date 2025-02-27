const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app); // Créer le serveur HTTP
const io = new Server(server); // Attacher Socket.IO au serveur HTTP

const sqlite3 = require('sqlite3').verbose();
// Connexion à la base de données
const db = new sqlite3.Database('./bdd/database.db', (err) => {
  if (err) {
    console.error('Erreur lors de l\'ouverture de la base de données:', err.message);
  } else {
    console.log('Connexion à la base de données SQLite réussie.');
  }
});
const port = 3000;

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS quizz (
    id_quizz INTEGER PRIMARY KEY AUTOINCREMENT,
    name_quizz TEXT NOT NULL,
    questions_quizz JSON NOT NULL
  )`, (err) => {
    if (err) {
      console.error('Erreur lors de la création de la table:', err.message);
    } else {
      console.log('Table "quizz" créée ou déjà existante.');
    }
  });
  
  const quiz = {
    name_quizz: "Quiz de base",
    questions_quizz: JSON.stringify([
      { question: "Quelle est la capitale de la France ?", 
        choices: ["Paris", "Berlin", "Londres", "Madrid"], 
        correct: "Paris" 
      },
      { question: "2 + 2 = ?", 
        choices: ["3", "4", "5", "6", "7", "8", "9", "10"], 
        correct: "4" 
      },
      { question: "Quelle est la capitale de l'Espagne ?", 
        choices: ["Madrid", "Barcelone", "Séville", "Valence"], 
        correct: "Madrid" 
      },
      { question: "Quel est le plus grand océan de la planète ?", 
        choices: ["Pacifique", "Atlantique", "Indien", "Arctique"], 
        correct: "Pacifique" 
      },
      { question: "Qui a peint La Joconde ?", 
        choices: ["Leonardo da Vinci", "Vincent van Gogh", "Pablo Picasso", "Claude Monet"], 
        correct: "Leonardo da Vinci" 
      },
      { question: "Quelle est la formule chimique de l'eau ?", 
        choices: ["H2O", "CO2", "O2", "H2SO4"], 
        correct: "H2O" 
      },
      { question: "Dans quel pays se trouve la Grande Muraille ?", 
        choices: ["Chine", "Japon", "Inde", "Corée du Sud"], 
        correct: "Chine" 
      },
      { question: "Quelle planète est surnommée la planète rouge ?", 
        choices: ["Mars", "Jupiter", "Saturne", "Venus"], 
        correct: "Mars" 
      },
      { question: "Quel est l'animal terrestre le plus rapide ?", 
        choices: ["Guépard", "Lion", "Antilope", "Léopard"], 
        correct: "Guépard" 
      },
      { question: "Quel est l'instrument de musique avec des touches noires et blanches ?", 
        choices: ["Piano", "Guitare", "Violoncelle", "Flûte"], 
        correct: "Piano" 
      }
    ])
  };

  db.get("SELECT COUNT(*) AS count FROM quizz", (err, row) => {
    if (err) {
      console.error('Erreur lors de la vérification du nombre de quizzes:', err.message);
    } else {
      if (row.count === 0) {
        db.run(
          `INSERT INTO quizz (name_quizz, questions_quizz) VALUES (?, ?)`,
          [quiz.name_quizz, quiz.questions_quizz],
          function (err) {
            if (err) {
              console.error('Erreur lors de l\'insertion du quiz:', err.message);
            } else {
              console.log(`Quiz ajouté avec succès avec l'ID ${this.lastID}.`);
            }
          }
        );
      } else {
        console.log('Quiz déjà existant dans la base de données.');
      }
    }
  });
});

const rooms = {};

// Front-end de l'application
try {
  app.use(express.static(path.join(__dirname, '../css')));
  app.use(express.static(path.join(__dirname, '../controler')));
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
  });
  app.get('/salons', (req, res) => {
    res.sendFile(path.join(__dirname, '../salons.html'));
  });
} catch {
  console.log("Index indisponible");
}

//--------------------------Socket----------------------
io.on('connection', (socket) => {
  console.log('Un client est connecté :', socket.id);

  socket.emit('message', 'Bienvenue sur le serveur Socket.IO');

  socket.on('disconnect', () => {
    console.log(`Client déconnecté : ${socket.id}`);
  
    for (const roomName in rooms) {
      rooms[roomName] = rooms[roomName].filter(user => user.id_user !== socket.id);
  
      if (rooms[roomName].length === 0) {
        delete rooms[roomName];
      } else {
        io.to(roomName).emit('user_list', rooms[roomName], roomName);
      }
    }
  });
  

  //------------------salon---------------------
  socket.on('join_room', (roomName, userName) => {
    socket.join(roomName);
    console.log(`Utilisateur ${socket.id} a rejoint le salon : ${roomName}`);
    

    if (!rooms[roomName]) {
      rooms[roomName] = [];
    }
    rooms[roomName].push({"name_user": userName, "id_user": socket.id, "score": "0"});

    io.to(roomName).emit('user_list', rooms[roomName], roomName);
  });

  socket.on('leave_room', (roomName) => {
    socket.leave(roomName);
    console.log(`Utilisateur ${socket.id} a quitté le salon : ${roomName}`);
  
    if (rooms[roomName]) {
      rooms[roomName] = rooms[roomName].filter(user => user.id_user !== socket.id);
  
      if (rooms[roomName].length === 0) {
        delete rooms[roomName];
      } else {
        io.to(roomName).emit('user_list', rooms[roomName], roomName);
      }
    }
  });

  socket.on('broadcast_quiz', ({ quizId }) => {
  
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

      const shuffledQuestions = quizData.questions.sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffledQuestions.slice(0, 3);
      quizData.questions = selectedQuestions;
  
        for (const roomName in rooms) {
          const user = rooms[roomName].find(member => member.id_user === socket.id);
          if (user) {
            io.to(roomName).emit('quiz_broadcast', quizData);
            console.log(`Quiz ${quizId} diffusé dans le salon ${roomName}`);
            break;
          }
        }
        
      }
    });
  });
  
  socket.on('change_score', (score) => {
    for (const roomName in rooms) {
      const user = rooms[roomName].find(member => member.id_user === socket.id);
      if (user) {
        user["score"] = parseInt(user["score"]) + parseInt(score["score"])
        break;
      }
    }
  });

  socket.on('reset_score', () => {
    for (const roomName in rooms) {
      const mainUser = rooms[roomName].find(member => member.id_user === socket.id);
      if (mainUser) {
        rooms[roomName].forEach(user => {
          user["score"] = 0;
        });
        break; 
      }
    }
  });

  socket.on('fetch_result', () => {
    for (const roomName in rooms) {
      const user = rooms[roomName].find(member => member.id_user === socket.id);
      if (user) {
        console.log(user)
        io.to(roomName).emit('show_Result', rooms[roomName]);
        break; 
      }
    }
  });

  socket.on('show_salons', () => {
    let roomsNameList = [];
    console.log(rooms);

    for (let roomName in rooms) {
        roomsNameList.push(roomName);
    }

    console.log(roomsNameList);
    socket.emit('get_salons_response', roomsNameList);
  });

});


server.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});
