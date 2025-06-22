const API_URL = "http://localhost:5000/api"; // change if needed

let token = localStorage.getItem('token');
let currentUser = null;
const main = document.getElementById('main');

async function api(endpoint, method = 'GET', data = null, isForm = false) {
  const opts = { method, headers: {} };
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (data && !isForm) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(data);
  } else if (data && isForm) {
    opts.body = data;
  }
  const res = await fetch(`${API_URL}${endpoint}`, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function renderLogin() {
  main.innerHTML = `
    <h2>Login</h2>
    <form id="loginForm">
      <input name="email" placeholder="Email" required>
      <input name="password" type="password" placeholder="Password" required>
      <button>Login</button>
    </form>
    <p>or <a href="#" id="toRegister">Register</a></p>
  `;
  document.getElementById('loginForm').onsubmit = async e => {
    e.preventDefault();
    try {
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd.entries());
      const res = await api('/auth/login', 'POST', body);
      token = res.token;
      localStorage.setItem('token', token);
      loadProfile();
    } catch (err) {
      alert('Login failed!');
    }
  };
  document.getElementById('toRegister').onclick = () => renderRegister();
}

function renderRegister() {
  main.innerHTML = `
    <h2>Register</h2>
    <form id="registerForm">
      <input name="username" placeholder="Username" required>
      <input name="email" type="email" placeholder="Email" required>
      <input name="password" type="password" placeholder="Password" required>
      <button>Register</button>
    </form>
    <p>or <a href="#" id="toLogin">Login</a></p>
  `;
  document.getElementById('registerForm').onsubmit = async e => {
    e.preventDefault();
    try {
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd.entries());
      const res = await api('/auth/register', 'POST', body);
      token = res.token;
      localStorage.setItem('token', token);
      loadProfile();
    } catch (err) {
      alert('Registration failed!');
    }
  };
  document.getElementById('toLogin').onclick = () => renderLogin();
}

async function loadProfile() {
  try {
    currentUser = await api('/users/me');
    renderMain();
  } catch (err) {
    token = null;
    localStorage.removeItem('token');
    renderLogin();
  }
}

function renderMain() {
  main.innerHTML = `
    <nav>
      <button id="feedBtn">Feed</button>
      <button id="myProfileBtn">My Profile</button>
      <button id="logoutBtn">Logout</button>
    </nav>
    <div id="content"></div>
  `;
  document.getElementById('feedBtn').onclick = () => renderFeed();
  document.getElementById('myProfileBtn').onclick = () => renderProfile(currentUser._id, true);
  document.getElementById('logoutBtn').onclick = () => {
    token = null; localStorage.removeItem('token'); renderLogin();
  };
  renderFeed();
}

async function renderFeed() {
  const content = document.getElementById('content');
  try {
    const posts = await api('/posts');
    content.innerHTML = `
      <h2>Feed</h2>
      <form id="postForm">
        <textarea name="text" placeholder="What's on your mind?" required></textarea>
        <input type="file" name="image" accept="image/*">
        <button>Post</button>
      </form>
      <div class="feed">${posts.map(postHtml).join('')}</div>
    `;
    document.getElementById('postForm').onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await api('/posts', 'POST', fd, true);
        renderFeed();
      } catch {
        alert('Could not post!');
      }
    };
    document.querySelectorAll('.profile-link').forEach(link => {
      link.onclick = e => {
        e.preventDefault();
        renderProfile(link.dataset.id, false);
      };
    });
  } catch {
    content.innerHTML = `<p>Failed to load feed.</p>`;
  }
}

function postHtml(p) {
  return `
    <div class="post">
      <strong><a href="#" class="profile-link" data-id="${p.author._id}">${p.author.username}</a></strong>
      <p>${escapeHtml(p.text)}</p>
      ${p.image ? `<img src="${API_URL.replace('/api','')}${p.image}" alt="post img">` : ''}
      <small>${new Date(p.createdAt).toLocaleString()}</small>
    </div>
  `;
}

async function renderProfile(userId, isMe) {
  const content = document.getElementById('content');
  try {
    const user = isMe ? currentUser : await api(`/users/${userId}`);
    const posts = await api(`/posts/user/${userId}`);
    content.innerHTML = `
      <div class="profile">
        ${user.profilePic ? `<img src="${API_URL.replace('/api','')}${user.profilePic}">` : '<div style="width:120px;height:120px;background:#eee;border-radius:8px;"></div>'}
        <h2>${escapeHtml(user.username)}</h2>
        <p>${escapeHtml(user.bio || '')}</p>
        ${isMe ? `
          <form id="editProfileForm">
            <input name="username" value="${escapeHtml(user.username)}" required>
            <textarea name="bio" placeholder="Bio">${escapeHtml(user.bio||"")}</textarea>
            <input type="file" name="profilePic" accept="image/*">
            <button>Update Profile</button>
          </form>
        ` : ''}
      </div>
      <h3>Posts</h3>
      <div class="feed">${posts.map(postHtml).join('')}</div>
      ${!isMe ? `<button id="backBtn">Back</button>` : ''}
    `;
    if (isMe) {
      document.getElementById('editProfileForm').onsubmit = async e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
          await api('/users/me', 'PUT', fd, true);
          loadProfile();
        } catch {
          alert('Update failed!');
        }
      };
    } else {
      document.getElementById('backBtn').onclick = () => renderFeed();
    }
    document.querySelectorAll('.profile-link').forEach(link => {
      link.onclick = e => {
        e.preventDefault();
        renderProfile(link.dataset.id, false);
      };
    });
  } catch {
    content.innerHTML = `<p>Failed to load profile.</p>`;
  }
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
}

if (token) loadProfile();
else renderLogin();