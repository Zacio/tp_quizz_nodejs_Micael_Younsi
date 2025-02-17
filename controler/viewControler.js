


  function GameStart(quiz){
    let quizSection = document.getElementById("quizSection");
    baliseRemoveAllChild(quizSection);
    let quizToShow = quiz;
    let scoreBalise = document.getElementById("score");
    scoreBalise.textContent = 0;
    resetScore();
    showQuiz(quizToShow, 0);
  }


function baliseRemoveAllChild(balise){
  let section = balise;
  while(section.lastChild){
    section.removeChild(section.lastChild)
  }
}

  function Answer(buttonDiv, reponse, buttonClicked, score){
    let scoreBalise = document.getElementById("score");

    scoreNumber = parseInt(scoreBalise.textContent);
    let allChild = buttonDiv.children ;
    allChild = Array.prototype.slice.call(allChild);
    allChild.forEach(child => {
      if(child == buttonClicked){
        if(child.textContent == reponse){
          child.classList.add("juste");
          changeScore(score);
          scoreBalise.textContent = (scoreNumber + score);
        }else{
          child.classList.add("faux");
        }
      }else if(child.textContent == reponse){
        child.classList.add("juste");
      }
      child.onclick = () => {}
    })
    
  }
  function showQuiz(quiz, questionNumber){

    let quizSection = document.getElementById("quizSection");
    let timerBar = document.getElementById("timerBar");
    let nameQuiz = document.createElement("p");
    let questionBalise = document.createElement("p");
    let answerDiv = document.createElement("div");
    let timer = 500
    let question = quiz.questions[questionNumber];
    let questionResponses = question.choices;

    baliseRemoveAllChild(quizSection)
    // Réinitialiser la barre de progression et les sections
    timerBar.max = timer;
    timerBar.value = timer;

    nameQuiz.textContent = `${quiz.name}`;
    
    questionBalise.textContent = `${question.question}`;

    quizSection.appendChild(nameQuiz);
    quizSection.appendChild(questionBalise);
    quizSection.appendChild(answerDiv);

    questionResponses.forEach(response => {
      let reponseBalise = document.createElement("button");
      reponseBalise.textContent = `${response}`;
        reponseBalise.onclick = () => {
          Answer(answerDiv, question.correct, reponseBalise, timer)
        };
      answerDiv.appendChild(reponseBalise);
    });
    // Définir le timer
    let timerInterval = setInterval(() => {
      timer--;
      timerBar.value = timer;
    
      // Si le timer atteint zéro
      if (timer <= 0) {
        clearInterval(timerInterval); // Arrêter le timer
      
        // Passer à la question suivante ou terminer le quiz
        if (quiz.questions.length > questionNumber + 1) {
          showQuiz(quiz, questionNumber + 1);
        } else {
          fetchResult();
        }
      }
    }, 10);
  }

function fetchSalon(members, roomName){
  let usersBalise = document.getElementById("userList");
  let serverDiv = document.getElementById("serverInput");

  let salonName = document.createElement("p");
  let disconnectedButton = document.createElement("button");

  salonName.textContent = roomName;
  disconnectedButton.textContent = "Disconnected";
  disconnectedButton.onclick = () => {
    leaveRoom(roomName);
  };

  serverDiv.classList.add("hidden");

  baliseRemoveAllChild(usersBalise)

  usersBalise.appendChild(salonName);
  usersBalise.appendChild(disconnectedButton);

  members.forEach(element => {
    let userText = document.createElement("p");
    userText.textContent = element["name_user"];
    usersBalise.appendChild(userText);
  });
}


function showResult(members){
  let quizSection = document.getElementById("quizSection");

  let participents = members.sort((a, b) => b["score"] - a["score"]);
  baliseRemoveAllChild(quizSection);

  participents.forEach(participent => {
    let participentTextBalise = document.createElement("p")
    participentTextBalise.textContent = `${participent["name_user"]}: ${participent["score"]}`
    quizSection.appendChild(participentTextBalise)
  });
}