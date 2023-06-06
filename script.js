$(document).ready(function () {
  // Handle form submission for signup
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', (event) => {
      event.preventDefault(); // Prevent the default form submission
  
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
  
      // Check if the password and confirm password match
      if (password !== confirmPassword) {
        alert('Password and Confirm Password do not match');
        return;
      }
  
      // Create an object with the signup data
      const signupData = { name, email, password };
  
      // Send a POST request to the server to store the signup data
      $.ajax({
        url: '/signup',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(signupData),
        success: function () {
          // Signup successful, redirect to login page
          window.location.href = '/login.html';
        },
        error: function () {
          alert('Signup failed. Please try again.');
        }
      });
    });
  }
  
  // Handle form submission for login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault(); // Prevent the default form submission
  
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
  
      // Create an object with the form data
      const loginData = { email, password };
  
      // Send a POST request to the server to authenticate the user
      $.ajax({
        url: '/login',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(loginData),
        success: function () {
          // Login successful, redirect to index page
          window.location.href = '/index.html';
        },
        error: function () {
          alert('Authentication failed. Please check your email and password.');
        }
      });
    });
  }
  
  const verificationForm = document.getElementById('verification-form');
  const updatePasswordForm = document.getElementById('update-password-form');
  
  if (verificationForm && updatePasswordForm) {
    const verifyEmailButton = document.getElementById('verify-email-btn');
    const updatePasswordButton = document.getElementById('update-password-btn');
  
    verifyEmailButton.addEventListener('click', (event) => {
      event.preventDefault();
  
      const email = document.getElementById('email').value;
  
      // Send a GET request to check if the email exists in the 'users' collection
      $.ajax({
        url: '/verify-email',
        method: 'GET',
        data: { email },
        success: function (response) {
          if (response.exists) {
            // Email exists, show the update password form
            verificationForm.style.display = 'none';
            updatePasswordForm.style.display = 'block';
          } else {
            alert('Email not found. Please try again.');
          }
        },
        error: function () {
          alert('An error occurred. Please try again later.');
        }
      });
    });
  
    updatePasswordButton.addEventListener('click', (event) => {
      event.preventDefault();
  
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
  
      if (newPassword !== confirmPassword) {
        alert('New password and confirm password do not match');
        return;
      }
  
      const email = document.getElementById('email').value;
  
      // Send a POST request to update the password in the 'users' collection
      $.ajax({
        url: '/update-password',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email, password: newPassword }),
        success: function () {
          alert('Password updated successfully. Please login with your new password.');
          window.location.href = '/login.html';
        },
        error: function () {
          alert('An error occurred. Please try again later.');
        }
      });
    });
  }
  var todoCount = 0; // Counter for generating unique IDs

  // Submitting the add todo form
  $('#add-todo-form').submit(function (event) {
    event.preventDefault(); // Prevent form submission

    var title = $('#title-input').val().trim(); // Get the title from the input field
    if (title === '') {
      alert('Please enter a title.'); // Show an alert if the title is empty
      return;
    }

    // Send a POST request to create a new todo
    $.ajax({
      url: '/todos',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ title }),
      success: function (newTodo) {
        // Create the square card HTML
        var squareCardHTML =
          `<div class="square-card" id="${newTodo._id}">
            <header>${newTodo.title}</header> <br>
            <div class="add-note-container">
              <input type="text" class="note-input" placeholder="Enter Note"><br>
              <button class="add-note-button">Add</button>
            </div> <br>
            <div class="notes-container"></div>
            <div class="line"></div>
            <div class="actions">
              <button class="edit-button">Edit Title</button>
              <button class="delete-button">Delete</button>
            </div>
          </div>`;

        $('#todo-container').append(squareCardHTML); // Add the square card to the container
        $('#title-input').val(''); // Clear the title input field

        todoCount++; // Increment the todo counter
      },
      error: function () {
        alert('Failed to create todo. Please try again.');
      }
    });
  });

  // Adding a new note
  $(document).on('click', '.square-card .add-note-button', function () {
    var $squareCard = $(this).closest('.square-card');
    var $notesContainer = $squareCard.find('.notes-container');
    var noteText = $squareCard.find('.note-input').val().trim();

    if (noteText === '') {
      alert('Please enter a note.'); // Show an alert if the note is empty
      return;
    }

    var todoId = $squareCard.attr('id');

    // Send a POST request to create a new note
    $.ajax({
      url: `/todos/${todoId}/notes`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ text: noteText }),
      success: function (newNote) {
        // Create the note HTML
        var noteHTML =
          `<div class="note" id="${newNote._id}">
            <input type="checkbox">
            <span class="note-text">${newNote.text}</span>
            <span class="edit-icon">✎</span>
          </div>`;

        $notesContainer.append(noteHTML); // Add the note to the notes container
        $squareCard.find('.note-input').val(''); // Clear the note input field

        enableDragAndDrop(); // Enable drag and drop functionality for the new note
      },
      error: function () {
        alert('Failed to create note. Please try again.');
      }
    });
  });



  // Editing a note
  $(document).on('click', '.square-card .edit-icon', function () {
    var $note = $(this).closest('.note');
    var noteId = $note.attr('id');
    var newText = prompt('Enter the new note text:', $note.find('.note-text').text());

    if (newText !== null && newText.trim() !== '') {
      // Send a PUT request to update the note
      $.ajax({
        url: `/notes/${noteId}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ text: newText }),
        success: function (updatedNote) {
          $note.find('.note-text').text(updatedNote.text);
        },
        error: function () {
          alert('Failed to update note. Please try again.');
        }
      });
    }
  });


  // Editing the title
  $(document).on('click', '.square-card .edit-button', function () {
    var $squareCard = $(this).closest('.square-card');
    var todoId = $squareCard.attr('id');
    var newTitle = prompt('Enter the new title:', $squareCard.find('header').text());

    if (newTitle !== null && newTitle.trim() !== '') {
      // Send a PUT request to update the todo title
      $.ajax({
        url: `/todos/${todoId}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ title: newTitle }),
        success: function (updatedTodo) {
          $squareCard.find('header').text(updatedTodo.title);
        },
        error: function () {
          alert('Failed to update todo title. Please try again.');
        }
      });
    }
  });


  // Deleting a square card
  $(document).on('click', '.square-card .delete-button', function () {
    var $squareCard = $(this).closest('.square-card');
    var todoId = $squareCard.attr('id'); // Get the todo ID

    // Send a DELETE request to the server to delete the todo
    $.ajax({
      url: `/todos/${todoId}`,
      method: 'DELETE',
      success: function () {
        $squareCard.remove();
      },
      error: function (err) {
        console.error(err);
      }
    });
  });

  enableDragAndDrop(); // Enable initial drag and drop functionality for existing notes

  function enableDragAndDrop() {
    $('.note').attr('draggable', 'true'); // Enable dragging for notes

    $('.square-card').on('dragover', function (event) {
      event.preventDefault(); // Allow dropping
      $(this).addClass('drag-over'); // Add class to highlight the drop area
    });

    $('.square-card').on('dragleave', function () {
      $(this).removeClass('drag-over'); // Remove class when leaving the drop area
    });

    $('.note').on('dragstart', function (event) {
      var noteId = event.target.id; // Get the ID of the dragged note
      event.originalEvent.dataTransfer.setData('text/plain', noteId); // Set the dragged note's ID as data
    });

    $('.square-card').on('drop', function (event) {
      event.preventDefault();
      $(this).removeClass('drag-over'); // Remove class from the drop area

      var noteId = event.originalEvent.dataTransfer.getData('text/plain'); // Get the ID of the dragged note
      var $note = $('#' + noteId); // Find the dragged note by ID
      var $notesContainer = $(this).find('.notes-container'); // Find the notes container in the drop area

      $notesContainer.append($note); // Append the dragged note to the drop area

      // Update the note order and todo
      var noteIds = $notesContainer.find('.note').map(function () {
        return this.id;
      }).get();

      // Send a PUT request to update the note order and todo
      $.ajax({
        url: `/todos/${$(this).attr('id')}/notes/reorder`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ noteIds }),
        success: function (updatedNotes) {
          // No need to update the UI since the dropped note is already moved visually
        },
        error: function () {
          alert('Failed to reorder notes. Please try again.');
        }
      });
    });
  }
  
  
  });