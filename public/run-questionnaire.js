document.addEventListener("DOMContentLoaded", function () {
    const questionnaireContainer = document.getElementById('questionnaire-container');
    const startTime = Date.now();
    const questionnaireId = window.location.pathname.split("/").pop();

    fetch(`/api/questionnaires/${questionnaireId}`)
        .then(response => response.json())
        .then(questionnaire => {
            questionnaireContainer.innerHTML = `<h2>${questionnaire.name}</h2><p>${questionnaire.description}</p>`;

            questionnaire.questions.forEach((question, index) => {
                const questionElement = document.createElement('div');
                questionElement.classList.add('question');
                
                if (question.question_type === 'text') {
                    questionElement.innerHTML = ` 
                        <label>${question.question_text}</label>
                        <input type="text" name="question-${index}" required>
                    `;
                } else if (question.question_type === 'single' || question.question_type === 'multiple') {
                    questionElement.innerHTML = `
                        <label>${question.question_text}</label>
                        ${question.answers.map(answer => `
                            <label>
                                <input type="${question.question_type === 'single' ? 'radio' : 'checkbox'}" 
                                       name="question-${index}" value="${answer}">
                                ${answer}
                            </label>
                        `).join('')}
                    `;
                }
                questionnaireContainer.appendChild(questionElement);
            });

            const submitButton = document.createElement('button');
            submitButton.textContent = 'Submit';
            submitButton.onclick = () => submitResponses(questionnaireId, startTime);
            questionnaireContainer.appendChild(submitButton);
        });
});

function submitResponses(questionnaireId, startTime) {
    const endTime = Date.now();
    const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
    const responses = [];

    document.querySelectorAll('.question').forEach((questionElement, index) => {
        let answer;
        if (questionElement.querySelector('input[type="text"]')) {
            answer = questionElement.querySelector('input[type="text"]').value;
        } else {
            answer = Array.from(questionElement.querySelectorAll('input:checked')).map(input => input.value);
        }
        responses.push({ question: index + 1, answer });
    });

    fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionnaireId, responses, timeTaken })
    })
    .then(response => response.json())
    .then(message => {
        alert(`Responses submitted successfully! Time taken: ${timeTaken} seconds.`);
        window.location.href = '/';
    })
    .catch(error => console.error('Error submitting responses:', error));
}

