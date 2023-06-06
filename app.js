const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Atlas connection
mongoose.connect('mongodb+srv://dhruvil:patel04@dhruvil.ldprohd.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });

  const User = mongoose.model('User', {
    name: String,
    email: String,
    password: String
  }, 'users');
  
  
  const Todo = mongoose.model('Todo', {
    title: String,
  });
  
  const Note = mongoose.model('Note', {
    text: String,
    todo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Todo'
    }
  });
  
 
  // Handle GET request for login.html
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
// Handle GET request for index.html
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Handle GET request for signup.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Handle POST request to create a new todo
app.post('/todos', (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const todo = new Todo({ title });
  todo.save()
    .then((newTodo) => {
      res.json(newTodo);
    })
    .catch((err) => {
      console.error('Failed to create todo', err);
      res.status(500).json({ error: 'Failed to create todo' });
    });
});

// Handle POST request to create a new note
app.post('/todos/:todoId/notes', (req, res) => {
  const { todoId } = req.params;
  const { text } = req.body;

  const note = new Note({ text, todo: todoId });
  note.save()
    .then((newNote) => {
      res.json(newNote);
    })
    .catch((err) => {
      console.error('Failed to create note', err);
      res.status(500).json({ error: 'Failed to create note' });
    });
});

// Handle DELETE request to delete a todo and its associated notes
app.delete('/todos/:todoId', (req, res) => {
  const { todoId } = req.params;

  Todo.findByIdAndDelete(todoId)
    .then((deletedTodo) => {
      if (deletedTodo) {
        // Delete the associated notes
        return Note.deleteMany({ todo: todoId });
      } else {
        res.status(404).json({ error: 'Todo not found' });
      }
    })
    .then(() => {
      res.sendStatus(204);
    })
    .catch((err) => {
      console.error('Failed to delete todo', err);
      res.status(500).json({ error: 'Failed to delete todo' });
    });
});

// Handle PUT request to update a note
app.put('/notes/:noteId', (req, res) => {
  const { noteId } = req.params;
  const { text } = req.body;

  Note.findByIdAndUpdate(noteId, { text }, { new: true })
    .then((updatedNote) => {
      if (updatedNote) {
        res.json(updatedNote);
      } else {
        res.status(404).json({ error: 'Note not found' });
      }
    })
    .catch((err) => {
      console.error('Failed to update note', err);
      res.status(500).json({ error: 'Failed to update note' });
    });
});

// Handle PUT request to update a todo
app.put('/todos/:todoId', (req, res) => {
  const { todoId } = req.params;
  const { title } = req.body;

  Todo.findByIdAndUpdate(todoId, { title }, { new: true })
    .then((updatedTodo) => {
      if (updatedTodo) {
        res.json(updatedTodo);
      } else {
        res.status(404).json({ error: 'Todo not found' });
      }
    })
    .catch((err) => {
      console.error('Failed to update todo', err);
      res.status(500).json({ error: 'Failed to update todo' });
    });
});

// Handle PUT request to reorder notes and update todos
app.put('/todos/:todoId/notes/reorder', (req, res) => {
  const { todoId } = req.params;
  const { noteIds } = req.body;

  Note.updateMany({ todo: todoId }, { $set: { order: null } }) // Clear the existing note order
    .then(() => {
      const updatePromises = noteIds.map((noteId, index) => {
        return Note.findByIdAndUpdate(noteId, { $set: { order: index + 1, todo: todoId } }, { new: true });
      });

      return Promise.all(updatePromises);
    })
    .then((updatedNotes) => {
      res.json(updatedNotes);
    })
    .catch((err) => {
      console.error('Failed to reorder notes', err);
      res.status(500).json({ error: 'Failed to reorder notes' });
    });
});
// Handle POST request to authenticate the user
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Check if the user exists in the 'users' collection
  User.findOne({ email, password })
    .then((user) => {
      if (user) {
        res.sendStatus(200); // Authentication successful
      } else {
        res.sendStatus(401); // Authentication failed
      }
    })
    .catch((err) => {
      console.error('Failed to authenticate user', err);
      res.sendStatus(500);
    });
});

// Handle POST request for signup
app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;

  // Create a new user document
  const user = new User({ name, email, password });
  user.save()
    .then(() => {
      res.sendStatus(200); // Signup successful
    })
    .catch((err) => {
      console.error('Failed to create user', err);
      res.sendStatus(500); // Signup failed
    });
});

// Handle GET request to check if the email exists in the 'users' collection
app.get('/verify-email', (req, res) => {
  const { email } = req.query;

  User.findOne({ email })
    .then((user) => {
      if (user) {
        res.json({ exists: true }); // Email exists
      } else {
        res.json({ exists: false }); // Email does not exist
      }
    })
    .catch((err) => {
      console.error('Failed to verify email', err);
      res.sendStatus(500);
    });
});


// Handle POST request to update the user's password
app.post('/update-password', (req, res) => {
  const { email, password } = req.body;

  User.findOneAndUpdate({ email }, { password }, { new: true })
    .then((user) => {
      if (user) {
        res.sendStatus(200); // Password updated successfully
      } else {
        res.sendStatus(404); // Email does not exist
      }
    })
    .catch((err) => {
      console.error('Failed to update password', err);
      res.sendStatus(500);
    });
});


// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
