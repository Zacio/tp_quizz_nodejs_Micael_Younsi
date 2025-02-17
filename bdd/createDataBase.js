// Exemple de création de table
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS quizz (
      id_quizz INTEGER PRIMARY KEY AUTOINCREMENT,
      name_quizz TEXT NOT NULL,
      questions_quizz JSON NOT NULL
    )`);
  });
    
    const quiz = {
      name_quizz: "Quiz de base",
      questions_quizz: JSON.stringify([
        {
          question: "Quelle est la capitale de la France ?",
          choices: ["Paris", "Berlin", "Londres", "Madrid"],
          correct: "Paris"
        },
        {
          question: "2 + 2 = ?",
          choices: ["3", "4", "5", "6", "7", "8", "9", "10"],
          correct: "4"
        },
        {
          "question": "Quelle est la capitale de l'Espagne ?",
          "choices": ["Madrid", "Barcelone", "Séville", "Valence"],
          "correct": "Madrid"
        },
        {
          "question": "Quel est le plus grand océan de la planète ?",
          "choices": ["Pacifique", "Atlantique", "Indien", "Arctique"],
          "correct": "Pacifique"
        },
        {
          "question": "Qui a peint La Joconde ?",
          "choices": ["Leonardo da Vinci", "Vincent van Gogh", "Pablo Picasso", "Claude Monet"],
          "correct": "Leonardo da Vinci"
        },
        {
          "question": "Quelle est la formule chimique de l'eau ?",
          "choices": ["H2O", "CO2", "O2", "H2SO4"],
          "correct": "H2O"
        },
        {
          "question": "Dans quel pays se trouve la Grande Muraille ?",
          "choices": ["Chine", "Japon", "Inde", "Corée du Sud"],
          "correct": "Chine"
        },
        {
          "question": "Quelle planète est surnommée la planète rouge ?",
          "choices": ["Mars", "Jupiter", "Saturne", "Venus"],
          "correct": "Mars"
        },
        {
          "question": "Quel est l'animal terrestre le plus rapide ?",
          "choices": ["Guépard", "Lion", "Antilope", "Léopard"],
          "correct": "Guépard"
        },
        {
          "question": "Quel est l'instrument de musique avec des touches noires et blanches ?",
          "choices": ["Piano", "Guitare", "Violoncelle", "Flûte"],
          "correct": "Piano"
        }
      ])
    };
    
    // Insertion du quiz
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