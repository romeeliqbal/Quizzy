// Simple Quizzy app (no build tools)
// Data: two sample quizzes
const quizzes = [
    {
      id: 'q1',
      title: 'Basic JavaScript',
      description: '5 short JS questions',
      questions: [
        { id: 1, text: 'Which is correct to declare a variable in JS?', choices: ['let x', 'varx', 'int x', 'dim x'], correct: 0 },
        { id: 2, text: 'Which method adds an item to end of array?', choices: ['push', 'pop', 'shift', 'slice'], correct: 0 },
        { id: 3, text: 'What does === check?', choices: ['value only','type only','value and type','neither'], correct: 2 },
        { id: 4, text: 'Which keyword creates a constant?', choices: ['constant','let','const','var'], correct: 2 },
        { id: 5, text: 'Which is NOT a JS primitive?', choices: ['string','number','object','boolean'], correct: 2 }
      ]
    },
    {
      id: 'q2',
      title: 'HTML Basics',
      description: 'Simple HTML questions',
      questions: [
        { id: 1, text: 'Which tag contains the page title?', choices: ['<head>','<title>','<meta>','<body>'], correct: 1 },
        { id: 2, text: 'Which attribute adds a link?', choices: ['src','href','link','ref'], correct: 1 },
        { id: 3, text: 'Which tag displays a paragraph?', choices: ['<p>','<div>','<h1>','<span>'], correct: 0 }
      ]
    }
  ];
  
  // Key for localStorage
  const LS_KEY = 'quizzy_attempts_v1';
  
  function $(sel) { return document.querySelector(sel); }
  function createEl(tag, cls, txt) { const e = document.createElement(tag); if(cls) e.className = cls; if(txt) e.textContent = txt; return e; }
  
  function init() {
    renderQuizList();
    renderHistory();
  }
  
  function renderQuizList() {
    const root = $('#quiz-list');
    root.innerHTML = '<h2>Available Quizzes</h2>';
    quizzes.forEach(q => {
      const card = createEl('div','quiz-card');
      const left = createEl('div', '');
      left.innerHTML = `<strong>${q.title}</strong><div class="small">${q.description}</div>`;
      const right = createEl('div','');
      const btn = createEl('button','btn','Start');
      btn.onclick = () => startQuiz(q.id);
      right.appendChild(btn);
      card.appendChild(left); card.appendChild(right);
      root.appendChild(card);
    });
  }
  
  let current = null; // {quiz, index, answers}
  function startQuiz(quizId) {
    const quiz = quizzes.find(x => x.id === quizId);
    current = { quiz, index: 0, answers: [] };
    $('#quiz-list').classList.add('hidden');
    $('#history').classList.add('hidden');
    $('#results').classList.add('hidden');
    $('#quiz-run').classList.remove('hidden');
    renderQuestion();
  }
  
  function renderQuestion() {
    const container = $('#quiz-run');
    const q = current.quiz.questions[current.index];
    container.innerHTML = `<h3>${current.quiz.title}</h3><p class="meta">Question ${current.index+1} of ${current.quiz.questions.length}</p>`;
    container.appendChild(createEl('hr'));
    const qtext = createEl('p','', q.text);
    container.appendChild(qtext);
    q.choices.forEach((c, i) => {
      const ch = createEl('button','choice', c);
      ch.onclick = () => choose(i);
      container.appendChild(ch);
    });
    const footer = createEl('div','small');
    footer.innerHTML = `<br><button class="btn" id="btn-cancel">Cancel</button>`;
    container.appendChild(footer);
    $('#btn-cancel').onclick = () => cancelRun();
  }
  
  function choose(choiceIndex) {
    const q = current.quiz.questions[current.index];
    const isCorrect = choiceIndex === q.correct;
    current.answers.push({ qid: q.id, chosen: choiceIndex, correct: q.correct });
    // show immediate feedback
    const buttons = document.querySelectorAll('.choice');
    buttons.forEach((b, i) => {
      b.disabled = true;
      if (i === q.correct) b.classList.add('correct');
      if (i === choiceIndex && i !== q.correct) b.classList.add('wrong');
    });
    // move next after small delay
    setTimeout(() => {
      current.index++;
      if (current.index >= current.quiz.questions.length) {
        finishQuiz();
      } else {
        renderQuestion();
      }
    }, 800);
  }
  
  function finishQuiz() {
    // compute score
    const correctCount = current.answers.filter(a => a.chosen === a.correct).length;
    const score = Math.round((correctCount / current.quiz.questions.length) * 100);
    const attempt = {
      id: Date.now().toString(),
      quizId: current.quiz.id,
      quizTitle: current.quiz.title,
      timestamp: new Date().toISOString(),
      answers: current.answers,
      score
    };
    saveAttempt(attempt);
    showResults(attempt);
  }
  
  function showResults(attempt) {
    $('#quiz-run').classList.add('hidden');
    const root = $('#results');
    root.classList.remove('hidden');
    root.innerHTML = `<h2>Results — ${attempt.quizTitle}</h2>
      <p class="meta">Score: <strong>${attempt.score}%</strong></p>`;
    const list = createEl('div','');
    attempt.answers.forEach((a, idx) => {
      const q = quizzes.find(qz => qz.id === attempt.quizId).questions.find(qq => qq.id === a.qid);
      const item = createEl('div','');
      item.innerHTML = `<strong>Q${idx+1}:</strong> ${q.text} <div>${q.choices[a.chosen]} - ${a.chosen===a.correct ? '<span class="result-good">Correct</span>' : '<span class="result-bad">Wrong</span> (Correct: '+q.choices[a.correct]+')'}</div><hr>`;
      list.appendChild(item);
    });
    root.appendChild(list);
    const btns = createEl('div','');
    const again = createEl('button','btn','Retry Quiz');
    again.onclick = () => startQuiz(attempt.quizId);
    btns.appendChild(again);
    const home = createEl('button','btn','Back to Quizzes');
    home.style.marginLeft = '8px';
    home.onclick = () => {
      root.classList.add('hidden');
      $('#quiz-list').classList.remove('hidden');
      $('#history').classList.remove('hidden');
    };
    root.appendChild(btns);
    renderHistory();
  }
  
  function saveAttempt(attempt) {
    const arr = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    arr.unshift(attempt);
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  }
  
  function getAttempts() {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  }
  
  function renderHistory() {
    const root = $('#history');
    root.innerHTML = '<h3>Past Attempts</h3>';
    const items = getAttempts();
    if (!items.length) {
      root.innerHTML += '<div class="small">No attempts yet</div>';
      return;
    }
    items.slice(0,5).forEach(a => {
      const el = createEl('div','history-item');
      el.innerHTML = `<strong>${a.quizTitle}</strong> <span class="small"> — ${new Date(a.timestamp).toLocaleString()}</span> <div>Score: ${a.score}%</div>`;
      root.appendChild(el);
    });
  }
  
  // Cancel mid-quiz
  function cancelRun() {
    if (confirm('Cancel this quiz?')) {
      $('#quiz-run').classList.add('hidden');
      $('#quiz-list').classList.remove('hidden');
      $('#history').classList.remove('hidden');
    }
  }
  
  window.addEventListener('DOMContentLoaded', init);
  
