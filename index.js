const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL connection
const pool = new Pool({
  connectionString:process.env.DATABASE_URL
});

// Set up view engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Ensure you have a "views" directory

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve the "Run" questionnaire page
app.get('/run/:id', async (req, res) => {
  const questionnaireId = parseInt(req.params.id);
  console.log(`Serving questionnaire with ID: ${questionnaireId}`);

  try {
    // Fetch the questionnaire details
    const result = await pool.query('SELECT * FROM questionnaires WHERE id = $1', [questionnaireId]);

    if (result.rows.length === 0) {
        return res.status(404).send('Questionnaire not found');
    }

    const questionnaire = result.rows[0];

    // Fetch the associated questions
    const questionsResult = await pool.query(
        'SELECT * FROM questions WHERE questionnaire_id = $1',
        [questionnaireId]
    );

    const questions = questionsResult.rows.map(q => ({
        question_text: q.question_text,
        question_type: q.question_type,
        answers: q.answers 
    }));

    // Pass the questionnaire and questions data to the HTML file
    res.render('run-questionnaire', {
        questionnaire,
        questions
    });
  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    res.status(500).send('Server error');
  }
});

// Serve the HTML file for the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fetch all questionnaires with additional information
app.get('/api/questionnaires', async (req, res) => {
  try {
    // Fetch all questionnaires
    const result = await pool.query('SELECT * FROM questionnaires');
    const questionnaires = result.rows;

    // Get additional information for each questionnaire
    const enhancedQuestionnaires = await Promise.all(questionnaires.map(async (questionnaire) => {
      // Fetch the number of questions
      const questionsResult = await pool.query(
        'SELECT COUNT(*) FROM questions WHERE questionnaire_id = $1',
        [questionnaire.id]
      );
      const questionCount = parseInt(questionsResult.rows[0].count);

      // Fetch the number of completions (responses)
      const responsesResult = await pool.query(
        'SELECT COUNT(*) FROM responses WHERE questionnaire_id = $1',
        [questionnaire.id]
      );
      const completionCount = parseInt(responsesResult.rows[0].count);

      return {
        ...questionnaire,
        questionCount,
        completionCount
      };
    }));

    res.json(enhancedQuestionnaires);
  } catch (error) {
    console.error('Error fetching questionnaires:', error);
    res.status(500).send('Server error');
  }
});


// Fetch a specific questionnaire by ID
app.get('/api/questionnaires/:id', async (req, res) => {
  const questionnaireId = parseInt(req.params.id);
  try {
    const questionnaireResult = await pool.query(
      'SELECT * FROM questionnaires WHERE id = $1',
      [questionnaireId]
    );
    
    if (questionnaireResult.rows.length === 0) {
      return res.status(404).send('Questionnaire not found');
    }

    const questionnaire = questionnaireResult.rows[0];

    const questionsResult = await pool.query(
      'SELECT * FROM questions WHERE questionnaire_id = $1',
      [questionnaireId]
    );

    const questions = questionsResult.rows.map(q => ({
      question_text: q.question_text,
      question_type: q.question_type,
      answers: q.answers
    }));

    res.json({ ...questionnaire, questions });
  } catch (error) {
    console.error('Error fetching questionnaire details:', error);
    res.status(500).send('Server error');
  }
});

// Submit questionnaire responses
app.post('/api/responses', async (req, res) => {
  const { questionnaireId, responses } = req.body;

  try {
    if (!questionnaireId || !responses) {
      return res.status(400).send('Invalid request. Missing data.');
    }

    const responseQuery = `
      INSERT INTO responses (questionnaire_id, responses)
      VALUES ($1, $2)
    `;

    await pool.query(responseQuery, [questionnaireId, JSON.stringify(responses)]);

    res.status(200).json({ message: 'Responses saved successfully' });
  } catch (error) {
    console.error('Error saving responses:', error);
    res.status(500).send('Error saving responses.');
  }
});



// Delete a specific questionnaire by ID
app.delete('/api/questionnaires/:id', async (req, res) => {
  const questionnaireId = parseInt(req.params.id);
  try {
    // Delete the questionnaire from the database
    await pool.query('DELETE FROM responses WHERE questionnaire_id = $1', [questionnaireId]);
    await pool.query('DELETE FROM questions WHERE questionnaire_id = $1', [questionnaireId]);
    await pool.query('DELETE FROM questionnaires WHERE id = $1', [questionnaireId]);

    res.status(200).json({ message: 'Questionnaire deleted successfully' });
  } catch (error) {
    console.error('Error deleting questionnaire:', error);
    res.status(500).send('Error deleting questionnaire.');
  }
});

// Create a new questionnaire
app.post('/api/questionnaires', async (req, res) => {
  const { name, description, questions } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO questionnaires (name, description) VALUES ($1, $2) RETURNING id',
      [name, description]
    );
    const questionnaireId = result.rows[0].id;

    // Insert the questions associated with the new questionnaire
    for (let question of questions) {
      await pool.query(
        'INSERT INTO questions (questionnaire_id, question_text, question_type, answers) VALUES ($1, $2, $3, $4)',
        [questionnaireId, question.questionText, question.questionType, JSON.stringify(question.answers)]
      );
    }

    res.status(200).json({ message: 'Questionnaire created successfully' });
  } catch (error) {
    console.error('Error creating questionnaire:', error);
    res.status(500).send('Error creating questionnaire.');
  }
});


// Edit a specific questionnaire by ID 
app.get('/edit/:id', async (req, res) => {
  const questionnaireId = parseInt(req.params.id);
  try {
    // Fetch the questionnaire details
    const result = await pool.query('SELECT * FROM questionnaires WHERE id = $1', [questionnaireId]);
    
    if (result.rows.length === 0) {
        return res.status(404).send('Questionnaire not found');
    }

    const questionnaire = result.rows[0];

    // Fetch associated questions
    const questionsResult = await pool.query('SELECT * FROM questions WHERE questionnaire_id = $1', [questionnaireId]);
    
    const questions = questionsResult.rows.map(q => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      answers: q.answers || []
    }));

    // Render the edit form with existing data
    res.render('edit', { questionnaire, questions });
  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    res.status(500).send('Server error');
  }
});

// Update a specific questionnaire (handle PUT request)
app.put('/api/questionnaires/:id', async (req, res) => {
  const questionnaireId = parseInt(req.params.id);
  const { name, description, questions } = req.body;

  try {
    // Update the questionnaire details (name and description)
    await pool.query(
      'UPDATE questionnaires SET name = $1, description = $2 WHERE id = $3',
      [name, description, questionnaireId]
    );

    // Update the associated questions
    for (let question of questions) {
      const { id, questionText, questionType, answers } = question;
      
      // Ensure answers are stored as JSON in the database
      await pool.query(
        'UPDATE questions SET question_text = $1, question_type = $2, answers = $3 WHERE id = $4 AND questionnaire_id = $5',
        [questionText, questionType, JSON.stringify(answers), id, questionnaireId]
      );
    }

    res.status(200).json({ message: 'Questionnaire updated successfully' });
  } catch (error) {
    console.error('Error updating questionnaire:', error);
    res.status(500).send('Error updating questionnaire');
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
