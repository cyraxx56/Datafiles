window.addEventListener('DOMContentLoaded', () => {
    // Initialize default admin user if none exist
    if (!localStorage.getItem('users')) {
        const admin = { username: 'admin', password: 'admin', isAdmin: true };
        localStorage.setItem('users', JSON.stringify([admin]));
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const page = document.body.id;  // determines which page we're on

    // Redirect logic based on authentication and page
    if (page === 'user') {
        if (!currentUser) {
            alert('You must log in first.');
            window.location.href = 'login.html';
            return;
        }
    }
    if (page === 'admin') {
        if (!currentUser || !currentUser.isAdmin) {
            alert('Admin access only.');
            window.location.href = 'login.html';
            return;
        }
    }
    if (page === 'library' || page === 'upload') {
        if (!currentUser) {
            alert('You must log in to access this page.');
            window.location.href = 'login.html';
            return;
        }
    }

    // Logout button handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }

    // ----- Registration Logic -----
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('registerUsername').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const errorEl = document.getElementById('registerError');

            // Validate form fields
            if (!username || !email || !password || !confirmPassword) {
                errorEl.textContent = 'All fields are required.';
                return;
            }
            if (password !== confirmPassword) {
                errorEl.textContent = 'Passwords do not match.';
                return;
            }
            // Basic email validation
            const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
            if (!emailPattern.test(email)) {
                errorEl.textContent = 'Please enter a valid email.';
                return;
            }

            // Check for existing user
            let users = JSON.parse(localStorage.getItem('users')) || [];
            const userExists = users.find(user => user.username === username);
            if (userExists) {
                errorEl.textContent = 'Username already taken.';
                return;
            }

            // Create new user
            const newUser = { username, password, isAdmin: false };
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            alert('Registration successful! You can now log in.');
            window.location.href = 'login.html';
        });
    }

    // ----- Login Logic -----
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            const errorEl = document.getElementById('loginError');

            if (!username || !password) {
                errorEl.textContent = 'Please enter username and password.';
                return;
            }

            let users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(user => user.username === username && user.password === password);
            if (!user) {
                errorEl.textContent = 'Invalid username or password.';
                return;
            }
            // Successful login
            localStorage.setItem('currentUser', JSON.stringify(user));
            alert('Login successful!');
            if (user.isAdmin) {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'user.html';
            }
        });
    }

    // ----- Admin Page: List all users -----
    if (page === 'admin') {
        const userList = document.getElementById('userList');
        if (userList) {
            const users = JSON.parse(localStorage.getItem('users'));
            if (users && users.length > 0) {
                users.forEach(user => {
                    const li = document.createElement('li');
                    li.textContent = user.username + (user.isAdmin ? ' (Admin)' : '');
                    userList.appendChild(li);
                });
            } else {
                userList.textContent = 'No users registered.';
            }
        }
    }

    // ----- User Page: Show user's uploaded books -----
    if (page === 'user') {
        const myBooksList = document.getElementById('myBooksList');
        const welcomeEl = document.getElementById('welcomeUser');
        if (welcomeEl) welcomeEl.textContent = 'Hello, ' + currentUser.username + '!';
        if (myBooksList) {
            let books = JSON.parse(localStorage.getItem('books')) || [];
            const myBooks = books.filter(b => b.uploadedBy === currentUser.username);
            if (myBooks.length > 0) {
                myBooks.forEach(book => {
                    const li = document.createElement('li');
                    li.textContent = book.title + ' by ' + book.author;
                    myBooksList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'You have not uploaded any books.';
                myBooksList.appendChild(li);
            }
        }
    }

    // ----- Book Upload Logic -----
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('bookTitle').value.trim();
            const author = document.getElementById('bookAuthor').value.trim();
            const category = document.getElementById('bookCategory').value;
            const price = document.getElementById('bookPrice').value;
            const content = document.getElementById('bookContentInput').value.trim();
            const errorEl = document.getElementById('uploadError');

            // Validate fields
            if (!title || !author || !category || !price || !content) {
                errorEl.textContent = 'All fields are required.';
                return;
            }
            if (isNaN(price) || Number(price) < 0) {
                errorEl.textContent = 'Price must be a positive number.';
                return;
            }
            // Create book object
            const book = {
                id: Date.now(),
                title,
                author,
                category,
                price: parseFloat(price).toFixed(2),
                content,
                uploadedBy: currentUser.username
            };
            // Save to localStorage
            let books = JSON.parse(localStorage.getItem('books')) || [];
            books.push(book);
            localStorage.setItem('books', JSON.stringify(books));
            alert('Book uploaded successfully!');
            window.location.href = 'library.html';
        });
    }

    // ----- Library Page Logic -----
    if (page === 'library') {
        const alphabetButtons = document.querySelectorAll('.letter-btn');
        const bookList = document.getElementById('bookList');
        const bookContentEl = document.getElementById('bookContent');

        // Attach click events to each letter button
        alphabetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const letter = btn.textContent;
                filterBooks(letter);
            });
        });

        // Filter and display books by category letter
        function filterBooks(letter) {
            // Clear previous results
            bookList.innerHTML = '';
            bookContentEl.innerHTML = '';

            const books = JSON.parse(localStorage.getItem('books')) || [];
            const filtered = books.filter(b => b.category.toUpperCase() === letter);

            if (filtered.length === 0) {
                bookList.innerHTML = '<p>No books found for this category.</p>';
                return;
            }
            // List filtered books
            filtered.forEach(book => {
                const li = document.createElement('li');
                const link = document.createElement('a');
                link.href = '#';
                link.textContent = book.title + ' by ' + book.author;
                link.addEventListener('click', () => showBook(book.id));
                li.appendChild(link);
                bookList.appendChild(li);
            });
        }

        // Display selected book's details
        function showBook(bookId) {
            const books = JSON.parse(localStorage.getItem('books')) || [];
            const book = books.find(b => b.id === bookId);
            if (!book) return;
            bookContentEl.innerHTML = `
                <h3>${book.title}</h3>
                <p><strong>Author:</strong> ${book.author}</p>
                <p><strong>Price:</strong> $${book.price}</p>
                <h4>Content:</h4>
                <p>${book.content}</p>
            `;
        }
    }
});
