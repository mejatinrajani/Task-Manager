// app.js - Task Manager Application
// House of MarkTech - 2025

// DOM Elements - Auth Section
const authSection = document.getElementById('auth-section');
const taskSection = document.getElementById('task-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const registerUsername = document.getElementById('register-username');
const registerPassword = document.getElementById('register-password');
const passwordStrength = document.getElementById('password-strength');
const authError = document.getElementById('auth-error');

// DOM Elements - Task Section
const welcomeMessage = document.getElementById('welcome-message');
const taskInput = document.getElementById('task-input');
const taskCategory = document.getElementById('task-category');
const taskDueDate = document.getElementById('task-due-date');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const searchInput = document.getElementById('search-input');
const filterAll = document.getElementById('filter-all');
const filterCompleted = document.getElementById('filter-completed');
const filterPending = document.getElementById('filter-pending');
const filterCategory = document.getElementById('filter-category');
const sortNewest = document.getElementById('sort-newest');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const progressBar = document.getElementById('progress-bar');
const progressPercentage = document.getElementById('progress-percentage');
const totalTasksElement = document.getElementById('total-tasks');
const completedTasksElement = document.getElementById('completed-tasks');
const pendingTasksElement = document.getElementById('pending-tasks');
const streakDaysElement = document.getElementById('streak-days');
const logoutBtn = document.getElementById('logout-btn');
const loadingElement = document.getElementById('loading');
const emptyState = document.getElementById('empty-state');
const toastContainer = document.getElementById('toast-container');
const editModal = document.getElementById('edit-modal');
const editTaskTitle = document.getElementById('edit-task-title');
const cancelEdit = document.getElementById('cancel-edit');
const saveEdit = document.getElementById('save-edit');

// Application State
const state = {
  currentUser: null,
  tasks: [],
  categories: ['Work', 'Personal', 'Shopping', 'Health', 'Finance', 'Education'],
  filters: {
    search: '',
    status: 'all',
    category: ''
  },
  sort: 'newest',
  lastActive: null,
  streak: 0
};

// Local Storage Keys
const USERS_STORAGE_KEY = 'taskManager_users';
const TASKS_STORAGE_KEY = 'taskManager_tasks';
const CURRENT_USER_KEY = 'taskManager_currentUser';
const STREAK_DATA_KEY = 'taskManager_streakData';

// Initialize Application
function initApp() {
  const savedUser = localStorage.getItem(CURRENT_USER_KEY);
  if (savedUser) {
    state.currentUser = JSON.parse(savedUser);
    loadUserData();
    switchToTaskView();
  }
  initEventListeners();
  const today = new Date().toISOString().split('T')[0];
  taskDueDate.value = today;
  populateCategories();
}

// Event Listeners
function initEventListeners() {
  showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); loginForm.classList.add('hidden'); registerForm.classList.remove('hidden'); });
  showLoginLink.addEventListener('click', (e) => { e.preventDefault(); registerForm.classList.add('hidden'); loginForm.classList.remove('hidden'); });
  loginBtn.addEventListener('click', handleLogin);
  registerBtn.addEventListener('click', handleRegister);
  registerPassword.addEventListener('input', updatePasswordStrength);
  addTaskBtn.addEventListener('click', addTask);
  clearCompletedBtn.addEventListener('click', clearCompletedTasks);
  searchInput.addEventListener('input', updateFilters);
  filterAll.addEventListener('click', () => setStatusFilter('all'));
  filterCompleted.addEventListener('click', () => setStatusFilter('completed'));
  filterPending.addEventListener('click', () => setStatusFilter('pending'));
  filterCategory.addEventListener('change', updateFilters);
  sortNewest.addEventListener('click', toggleSortOrder);
  logoutBtn.addEventListener('click', handleLogout);
  taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
  cancelEdit.addEventListener('click', closeEditModal);
  saveEdit.addEventListener('click', saveEditedTask);
}

// Authentication Functions
function handleLogin() {
  const username = loginUsername.value.trim();
  const password = loginPassword.value;
  if (!username || !password) { showAuthError('Please enter both username and password'); return; }
  const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    state.currentUser = { username: user.username };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(state.currentUser));
    loadUserData();
    switchToTaskView();
    createToast('Welcome back! 👋', 'success');
  } else {
    showAuthError('Invalid username or password');
    loginPassword.value = '';
  }
}

function handleRegister() {
  const username = registerUsername.value.trim();
  const password = registerPassword.value;
  if (!username || !password) { showAuthError('Please enter both username and password'); return; }
  const passwordScore = zxcvbn(password).score;
  if (passwordScore < 2) { showAuthError('Please choose a stronger password'); return; }
  const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
  if (users.some(u => u.username === username)) { showAuthError('Username already exists'); return; }
  users.push({ username, password });
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  state.currentUser = { username };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(state.currentUser));
  initUserData();
  switchToTaskView();
  triggerConfetti();
  createToast('Account created successfully! 🎉', 'success');
}

function updatePasswordStrength() {
  const password = registerPassword.value;
  if (!password) { passwordStrength.innerHTML = ''; return; }
  const result = zxcvbn(password);
  const score = result.score;
  let strength = '', color = '';
  switch (score) {
    case 0: strength = 'Very Weak'; color = 'text-red-600'; break;
    case 1: strength = 'Weak'; color = 'text-orange-500'; break;
    case 2: strength = 'Fair'; color = 'text-yellow-500'; break;
    case 3: strength = 'Good'; color = 'text-green-500'; break;
    case 4: strength = 'Strong'; color = 'text-green-600'; break;
  }
  const progressWidth = (score + 1) * 20;
  passwordStrength.innerHTML = `
    <div class="mb-1 flex items-center justify-between">
      <span class="${color} text-sm font-medium">Password Strength: ${strength}</span>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-2">
      <div class="h-2 rounded-full transition-all duration-500" style="width: ${progressWidth}%; background-color: ${getColorForScore(score)}"></div>
    </div>
    ${result.feedback.warning ? `<p class="mt-1 text-xs text-gray-500">${result.feedback.warning}</p>` : ''}
  `;
}

function getColorForScore(score) {
  const colors = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#22c55e'];
  return colors[score];
}

function handleLogout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  state.currentUser = null;
  state.tasks = [];
  loginUsername.value = ''; loginPassword.value = ''; registerUsername.value = ''; registerPassword.value = ''; passwordStrength.innerHTML = '';
  switchToAuthView();
  createToast('You have been logged out', 'info');
}

function showAuthError(message) {
  authError.textContent = message;
  authError.classList.remove('hidden');
  authError.classList.add('animate-shake');
  setTimeout(() => authError.classList.remove('animate-shake'), 500);
  setTimeout(() => authError.classList.add('hidden'), 5000);
}

function switchToTaskView() {
  authSection.classList.add('hidden');
  taskSection.classList.remove('hidden');
  welcomeMessage.textContent = state.currentUser.username;
  renderTasks();
  updateTaskStats();
}

function switchToAuthView() {
  taskSection.classList.add('hidden');
  authSection.classList.remove('hidden');
  registerForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
}

function addTask() {
  const title = taskInput.value.trim();
  if (!title) { createToast('Please enter a task', 'warning'); taskInput.focus(); return; }
  const category = taskCategory.value || 'Uncategorized';
  const dueDate = taskDueDate.value || new Date().toISOString().split('T')[0];
  const newTask = { id: Date.now().toString(), title, category, dueDate, completed: false, createdAt: new Date().toISOString() };
  state.tasks.unshift(newTask);
  saveTasksToStorage();
  renderTasks();
  updateTaskStats();
  taskInput.value = ''; taskInput.focus();
  createToast('Task added successfully! ✅', 'success');
  updateUserStreak(true);
}

function toggleTaskStatus(taskId) {
  const taskIndex = state.tasks.findIndex(task => task.id === taskId);
  if (taskIndex !== -1) {
    const wasCompleted = state.tasks[taskIndex].completed;
    state.tasks[taskIndex].completed = !wasCompleted;
    saveTasksToStorage();

    // Only update streak when marking complete (not when unchecking)
    if (state.tasks[taskIndex].completed && !wasCompleted) {
      updateUserStreak(true);
    }

    // Visual feedback only when marking complete
    if (state.tasks[taskIndex].completed && !wasCompleted) {
      const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
      if (taskItem) {
        const rect = taskItem.getBoundingClientRect();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: {
            x: rect.left / window.innerWidth,
            y: rect.top / window.innerHeight
          }
        });
      }
      createToast('Task completed! 🎉', 'success');
    }

    renderTasks();
    updateTaskStats();
  }
}


function deleteTask(taskId) {
  if (confirm('Are you sure you want to delete this task?')) {
    state.tasks = state.tasks.filter(task => task.id !== taskId);
    saveTasksToStorage();
    renderTasks();
    updateTaskStats();
    createToast('Task deleted', 'info');
  }
}

function openEditModal(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    editTaskTitle.value = task.title;
    editModal.dataset.taskId = taskId;
    editModal.style.display = 'block';
    editTaskTitle.focus();
  }
}

function closeEditModal() {
  editModal.style.display = 'none';
  editTaskTitle.value = '';
  delete editModal.dataset.taskId;
}

function saveEditedTask() {
  const taskId = editModal.dataset.taskId;
  const newTitle = editTaskTitle.value.trim();
  if (newTitle) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      task.title = newTitle;
      saveTasksToStorage();
      renderTasks();
      closeEditModal();
      createToast('Task updated', 'success');
    }
  } else {
    createToast('Task title cannot be empty', 'warning');
  }
}

function clearCompletedTasks() {
  const completedCount = state.tasks.filter(task => task.completed).length;
  if (completedCount === 0) { createToast('No completed tasks to clear', 'info'); return; }
  if (confirm(`Are you sure you want to clear ${completedCount} completed tasks?`)) {
    state.tasks = state.tasks.filter(task => !task.completed);
    saveTasksToStorage();
    renderTasks();
    updateTaskStats();
    createToast('Completed tasks cleared', 'info');
  }
}

function updateFilters() {
  state.filters.search = searchInput.value.trim().toLowerCase();
  state.filters.category = filterCategory.value;
  renderTasks();
}

function setStatusFilter(status) {
  state.filters.status = status;
  [filterAll, filterCompleted, filterPending].forEach(btn => {
    btn.classList.remove('bg-primary', 'text-white');
    btn.classList.add('bg-gray-200', 'text-gray-700');
  });
  let activeBtn;
  switch (status) {
    case 'all': activeBtn = filterAll; break;
    case 'completed': activeBtn = filterCompleted; break;
    case 'pending': activeBtn = filterPending; break;
  }
  activeBtn.classList.remove('bg-gray-200', 'text-gray-700');
  activeBtn.classList.add('bg-primary', 'text-white');
  renderTasks();
}

function toggleSortOrder() {
  state.sort = state.sort === 'newest' ? 'oldest' : 'newest';
  sortNewest.innerHTML = state.sort === 'newest' 
    ? '<i class="fas fa-sort-amount-down-alt mr-1"></i> Newest' 
    : '<i class="fas fa-sort-amount-up mr-1"></i> Oldest';
  renderTasks();
}

function renderTasks() {
  loadingElement.classList.remove('hidden');
  taskList.innerHTML = '';
  const filteredTasks = state.tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(state.filters.search);
    const matchesStatus = state.filters.status === 'all' || 
                         (state.filters.status === 'completed' && task.completed) ||
                         (state.filters.status === 'pending' && !task.completed);
    const matchesCategory = !state.filters.category || task.category === state.filters.category;
    return matchesSearch && matchesStatus && matchesCategory;
  });
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (state.sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
  setTimeout(() => {
    loadingElement.classList.add('hidden');
    if (sortedTasks.length === 0) emptyState.classList.remove('hidden');
    else {
      emptyState.classList.add('hidden');
      sortedTasks.forEach(task => taskList.appendChild(createTaskElement(task)));
      document.querySelectorAll('.task-item').forEach((item, index) => {
        setTimeout(() => item.classList.add('opacity-100', 'translate-x-0'), index * 50);
      });
    }
  }, 300);
}

function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'task-item glassmorphism rounded-xl p-4 shadow-soft opacity-0 -translate-x-2 transition-all duration-300 relative';
  li.setAttribute('data-task-id', task.id);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dueDate = new Date(task.dueDate); dueDate.setHours(0, 0, 0, 0);
  const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
  let dueDateClass, dueDateIcon, dueDateText;
  if (task.completed) {
    dueDateClass = 'text-green-500'; dueDateIcon = 'fas fa-check-circle'; dueDateText = 'Completed';
  } else if (daysRemaining < 0) {
    dueDateClass = 'text-red-500'; dueDateIcon = 'fas fa-exclamation-circle'; dueDateText = `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} overdue`;
  } else if (daysRemaining === 0) {
    dueDateClass = 'text-yellow-500'; dueDateIcon = 'fas fa-exclamation-triangle'; dueDateText = 'Due today';
  } else if (daysRemaining <= 3) {
    dueDateClass = 'text-yellow-500'; dueDateIcon = 'fas fa-clock'; dueDateText = `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`;
  } else {
    dueDateClass = 'text-blue-500'; dueDateIcon = 'fas fa-calendar'; dueDateText = `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`;
  }
  li.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <input type="checkbox" ${task.completed ? 'checked' : ''} class="w-5 h-5 text-primary accent-primary cursor-pointer mr-3" aria-label="Mark task as complete">
        <div class="flex-1">
          <div class="flex items-center mb-1">
            <span class="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md mr-2">${task.category}</span>
            <span class="${dueDateClass} flex items-center text-sm"><i class="${dueDateIcon} mr-1"></i> ${dueDateText}</span>
          </div>
          <h3 class="text-lg font-medium ${task.completed ? 'line-through text-gray-400' : 'text-dark'}">${task.title}</h3>
          <p class="text-xs text-gray-500 mt-1">Created ${formatDate(task.createdAt)}</p>
        </div>
      </div>
      <div class="flex space-x-2">
        <button class="edit-btn btn-hover text-blue-500 hover:text-blue-700 p-2 bg-blue-100 hover:bg-blue-200 transition-colors" aria-label="Edit Task" data-tooltip="Edit"><i class="fas fa-edit"></i>Edit Task</button>
        <button class="delete-btn btn-hover text-red-500 hover:text-red-700 p-2 bg-red-100 hover:bg-red-200 transition-colors" aria-label="Delete Task" data-tooltip="Delete"><i class="fas fa-trash-alt"></i>Delete Task</button>
      </div>
    </div>
    ${task.completed ? '<div class="absolute -top-2 -right-2 bg-green-500 text-white rounded-full h-5 w-5 flex items-center justify-center"><i class="fas fa-check text-xs"></i></div>' : ''}
  `;
  li.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleTaskStatus(task.id));
  li.querySelector('.edit-btn').addEventListener('click', () => openEditModal(task.id));
  li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
  return li;
}

function updateTaskStats() {
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter(task => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  animateCounter(totalTasksElement, parseInt(totalTasksElement.textContent), totalTasks);
  animateCounter(completedTasksElement, parseInt(completedTasksElement.textContent), completedTasks);
  animateCounter(pendingTasksElement, parseInt(pendingTasksElement.textContent), pendingTasks);
  streakDaysElement.textContent = state.streak;
  animateCounter(streakDaysElement, parseInt(streakDaysElement.textContent), state.streak);
  progressBar.style.width = `${completionPercentage}%`;
  progressPercentage.textContent = `${completionPercentage}%`;
}

function animateCounter(element, startValue, endValue) {
  if (isNaN(startValue)) startValue = 0;
  const duration = 1000;
  const frameDuration = 1000 / 60;
  const totalFrames = Math.round(duration / frameDuration);
  const step = (endValue - startValue) / totalFrames;
  let currentFrame = 0;
  const animation = () => {
    currentFrame++;
    const currentValue = startValue + step * currentFrame;
    element.textContent = Math.floor(currentValue);
    if (currentFrame < totalFrames) requestAnimationFrame(animation);
  };
  requestAnimationFrame(animation);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffInDays === 0) return 'today';
  if (diffInDays === 1) return 'yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function populateCategories() {
  taskCategory.innerHTML = `<option value="">Select Category</option>`;
  filterCategory.innerHTML = `<option value="">All Categories</option>`;
  state.categories.forEach(category => {
    [taskCategory, filterCategory].forEach(select => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      select.appendChild(option);
    });
  });
}

function saveTasksToStorage() {
  if (!state.currentUser) return;
  const allTasks = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY) || '{}');
  allTasks[state.currentUser.username] = state.tasks;
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(allTasks));
}

function loadUserData() {
  if (!state.currentUser) return;
  
  // Load tasks
  const allTasks = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY) || '{}')
  state.tasks = allTasks[state.currentUser.username] || [];
  
  // Load streak data
  const allStreakData = JSON.parse(localStorage.getItem(STREAK_DATA_KEY) || '{}');
  const userStreakData = allStreakData[state.currentUser.username] || { 
    streak: 0, 
    lastActive: null 
  };
  
  state.streak = userStreakData.streak;
  state.lastActive = userStreakData.lastActive;
  
  // Check streak validity on load
  updateUserStreak(false);
}

function initUserData() {
  if (!state.currentUser) return;
  state.tasks = [];
  saveTasksToStorage();
  state.streak = 0;
  state.lastActive = new Date().toISOString();
  saveStreakData();
}

function saveStreakData() {
  if (!state.currentUser) return;
  
  const allStreakData = JSON.parse(localStorage.getItem(STREAK_DATA_KEY) || '{}');
  allStreakData[state.currentUser.username] = { 
    streak: state.streak, 
    lastActive: state.lastActive 
  };
  
  localStorage.setItem(STREAK_DATA_KEY, JSON.stringify(allStreakData));
}

function updateUserStreak(isTaskCompleted) {
  if (!state.currentUser || !isTaskCompleted) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0, 0);

  // Initialize streak if no lastActive date
  if (!state.lastActive) {
    state.streak = 1;
    state.lastActive = today.toISOString();
    saveStreakData();
    return;
  }

  const lastActive = new Date(state.lastActive);
  lastActive.setHours(0, 0, 0, 0, 0);
  const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

  if (daysDiff === 1) { // Consecutive day
    state.streak++;
  } else if (daysDiff > 1) { // Broken streak
    state.streak = 1;
  }

  // Always update lastActive when completing a task
  state.lastActive = today.toISOString();
  saveStreakData();
}

function createToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `glassmorphism rounded-lg p-3 mb-3 flex items-center shadow-soft transform transition-all duration-300 translate-x-full animate-toast max-w-xs`;
  let iconClass, bgClass;
  switch (type) {
    case 'success': iconClass = 'fas fa-check-circle text-green-500'; bgClass = 'border-l-4 border-green-500'; break;
    case 'warning': iconClass = 'fas fa-exclamation-triangle text-yellow-500'; bgClass = 'border-l-4 border-yellow-500'; break;
    case 'error': iconClass = 'fas fa-times-circle text-red-500'; bgClass = 'border-l-4 border-red-500'; break;
    default: iconClass = 'fas fa-info-circle text-blue-500'; bgClass = 'border-l-4 border-blue-500';
  }
  toast.classList.add(bgClass);
  toast.innerHTML = `
    <div class="flex-shrink-0 mr-2"><i class="${iconClass} text-lg"></i></div>
    <div class="flex-1 text-sm">${message}</div>
    <button class="ml-2 text-gray-400 hover:text-gray-600 transition-colors text-sm"><i class="fas fa-times"></i></button>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.remove('translate-x-full'), 10);
  toast.querySelector('button').addEventListener('click', () => removeToast(toast));
  setTimeout(() => removeToast(toast), 5000);
}

function removeToast(toast) {
  toast.classList.add('fade-out');
  setTimeout(() => toast.remove(), 300);
}

function triggerConfetti() {
  confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
}

function addKeyframes() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-5px); } 40%,80% { transform: translateX(5px); } }
    .animate-shake { animation: shake 0.5s ease-in-out; }
    @keyframes toast { 0% { transform: translateX(100%); } 100% { transform: translateX(0); } }
    .animate-toast { animation: toast 0.3s ease-out forwards; }
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
  `;
  document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', () => { addKeyframes(); initApp(); });