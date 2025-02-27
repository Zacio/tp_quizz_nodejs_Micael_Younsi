// Connexion au serveur Socket.IO
const socket = io();

// Réception d'un message de bienvenue
socket.on('message', (message) => {
  console.log('Message du serveur :', message);
});

// Demander un quiz par ID
function getQuizById(quizId) {
  socket.emit('send_quiz_request', quizId);
}

// Réception des données d'un quiz
socket.on('quiz_data', (quiz) => {
  console.log('Quiz reçu :', quiz);
});

// Gestion des erreurs
socket.on('error', (errorMessage) => {
  console.error('Erreur :', errorMessage);
});

// ---------------------Rejoindre le salon--------------
function joinRoom(elemntIdOne, elemntIdTwo) {
  const roomName = document.getElementById(elemntIdOne).value;
  const userName = document.getElementById(elemntIdTwo).value;
  if (roomName && userName) {
    socket.emit('join_room', roomName, userName);
    console.log(`Rejoint le salon : ${roomName}`);
  }
}

function leaveRoom(roomName){
  socket.emit('leave_room', roomName)

  let quizSection = document.getElementById("userList");
  let serverInput = document.getElementById("serverInput");

  serverInput.classList.remove("hidden")
  baliseRemoveAllChild(quizSection)

  console.log(`user has leave room : ${roomName}`);
}

socket.on('quiz_broadcast', (quiz) => {
  console.log('Quiz reçu :');

  GameStart(quiz);
});

function broadcastQuiz(quizId) {
  socket.emit('broadcast_quiz', { quizId });
}

socket.on('user_list', (users, roomName) => {
  console.log(`users : ${users} roomnames: ${roomName}`)
  fetchSalon(users, roomName)
});

function changeScore(score){
  socket.emit('change_score', { score });
} 
function fetchResult(){
  socket.emit('fetch_result');
}
socket.on("show_Result", (members) => {
  console.log(members)
  showResult(members)
})

function resetScore(){
  socket.emit('reset_score');
}

document.addEventListener("DOMContentLoaded", () => {
  socket.emit('show_salons');
});

socket.on('get_salons_response', (roomsNameList) => {
  showSalons(roomsNameList);
});