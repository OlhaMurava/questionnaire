document.getElementById('add-question-btn').addEventListener('click', function() {
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('question');
    questionDiv.innerHTML = `
        <label>Question Text:</label>
        <input type="text" name="questionText" required>
        
        <label>Question Type:</label>
        <select name="questionType">
            <option value="text">Text</option>
            <option value="single">Single Choice</option>
            <option value="multiple">Multiple Choice</option>
        </select>
        
        <label>Answers (comma separated):</label>
        <input type="text" name="answers" placeholder="e.g. Yes, No, Maybe">
    `;
    document.getElementById('questions-container').appendChild(questionDiv);
});

document.getElementById('questionnaire-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('questionnaire-name').value;
    const description = document.getElementById('questionnaire-description').value;
    const questions = [];

    const questionDivs = document.getElementsByClassName('question');
    for (const questionDiv of questionDivs) {
        const questionText = questionDiv.querySelector('[name="questionText"]').value;
        const questionType = questionDiv.querySelector('[name="questionType"]').value;
        const answers = questionDiv.querySelector('[name="answers"]').value.split(',');

        questions.push({ questionText, questionType, answers });
    }

    fetch('/api/questionnaires', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description, questions })
    })
    .then(response => response.text())
    .then(data => {
        alert('Questionnaire created successfully');
        window.location.href = '/';
    })
    .catch(error => {
        console.error('Error saving questionnaire:', error);
        alert('An error occurred');
    });
});
