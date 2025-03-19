let currentPage = 1;
const itemsPerPage = 5;
let questionnaires = [];

function loadQuestionnaires() {
    fetch('/api/questionnaires')
        .then(response => response.json())
        .then(data => {
            questionnaires = data;
            renderQuestionnaires();
        })
        .catch(error => {
            console.error('Error fetching questionnaires:', error);
        });
}


function renderQuestionnaires() {
    const listElement = document.getElementById('questionnaire-list');
    listElement.innerHTML = '';

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const currentItems = questionnaires.slice(start, end);

    currentItems.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('card');
        div.innerHTML = `
            <h2>${item.name}</h2>
            <p>${item.description}</p>
            <p>Questions: ${item.questionCount}</p>
            <p>Completions: ${item.completionCount}</p>
            <div class="actions">
                <button onclick="window.location.href='/run/${item.id}'">Run</button>
                <button onclick="window.location.href='/edit/${item.id}'">Edit</button>
                <button onclick="deleteQuestionnaire(${item.id})">Delete</button>
            </div>
        `;
        listElement.appendChild(div);
    });

    document.getElementById('page-num').innerText = `Page ${currentPage}`;
}

// Delete questionnaire
function deleteQuestionnaire(questionnaireId) {
    const confirmation = confirm('Are you sure you want to delete this questionnaire?');
    if (confirmation) {
        fetch(`/api/questionnaires/${questionnaireId}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            alert('Questionnaire deleted successfully');
            loadQuestionnaires(); // Reload the list of questionnaires after deletion
        })
        .catch(error => {
            console.error('Error deleting questionnaire:', error);
            alert('Error deleting questionnaire');
        });
    }
}



function changePage(direction) {
    if (direction === 'next' && currentPage * itemsPerPage < questionnaires.length) {
        currentPage++;
    } else if (direction === 'prev' && currentPage > 1) {
        currentPage--;
    }

    renderQuestionnaires();
}

function showPage(page) {
    document.getElementById('catalog-page').style.display = page === 'catalog' ? 'block' : 'none';
    document.getElementById('builder-page').style.display = page === 'builder' ? 'block' : 'none';
}

// Initial load
loadQuestionnaires();