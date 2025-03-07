let editor;
let currentOpenFile = null;
let tabs = [];
let activeTabIndex = -1;

// Initialize CodeMirror editor
document.addEventListener('DOMContentLoaded', () => {
  editor = CodeMirror(document.getElementById('editor'), {
    mode: 'javascript',
    theme: 'monokai',
    lineNumbers: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    styleActiveLine: true,
    tabSize: 2,
    indentWithTabs: false,
    lineWrapping: false
  });
  
  // Update cursor position in status bar
  editor.on('cursorActivity', updateCursorPosition);
  
  // Initialize event listeners
  setupEventListeners();
});

function setupEventListeners() {
  // Handle file operations from main process
  window.electronAPI.onFileNew((event) => {
    newFile();
  });
  
  window.electronAPI.onFileOpened((event, { filePath, content }) => {
    openFile(filePath, content);
  });
  
  window.electronAPI.onFileSave((event, { filePath }) => {
    saveFile(filePath);
  });
}

function newFile() {
  const fileName = "untitled";
  editor.setValue('');
  
  // Create new tab
  addTab(fileName);
  
  // Update status bar
  updateStatusBar(fileName);
  
  currentOpenFile = null;
}

function openFile(filePath, content) {
  const fileName = filePath.split(/[/\\]/).pop();
  
  // Set editor content
  editor.setValue(content);
  
  // Set appropriate mode based on file extension
  setEditorMode(fileName);
  
  // Create new tab or switch to existing
  const existingTabIndex = tabs.findIndex(tab => tab.path === filePath);
  if (existingTabIndex >= 0) {
    switchToTab(existingTabIndex);
  } else {
    addTab(fileName, filePath);
  }
  
  // Update status bar
  updateStatusBar(fileName);
  
  currentOpenFile = filePath;
}

function saveFile(filePath) {
  const content = editor.getValue();
  window.electronAPI.saveContent(filePath, content);
  
  const fileName = filePath.split(/[/\\]/).pop();
  
  // Update tab if it was untitled
  if (currentOpenFile === null) {
    updateTab(activeTabIndex, fileName, filePath);
  }
  
  // Update status bar
  updateStatusBar(fileName);
  
  currentOpenFile = filePath;
}

function addTab(name, path = null) {
  const tabsContainer = document.getElementById('tabs');
  
  // Create tab element
  const tab = document.createElement('div');
  tab.className = 'tab';
  tab.textContent = name;
  tab.dataset.index = tabs.length;
  
  // Add click event to switch tabs
  tab.addEventListener('click', () => {
    switchToTab(parseInt(tab.dataset.index));
  });
  
  // Add tab to container
  tabsContainer.appendChild(tab);
  
  // Add tab to tabs array
  tabs.push({ name, path, element: tab });
  
  // Switch to the new tab
  switchToTab(tabs.length - 1);
}

function updateTab(index, name, path) {
  if (index >= 0 && index < tabs.length) {
    tabs[index].name = name;
    tabs[index].path = path;
    tabs[index].element.textContent = name;
  }
}

function switchToTab(index) {
  // Remove active class from current tab
  if (activeTabIndex >= 0 && activeTabIndex < tabs.length) {
    tabs[activeTabIndex].element.classList.remove('active');
  }
  
  // Set active class to new tab
  activeTabIndex = index;
  tabs[activeTabIndex].element.classList.add('active');
  
  // Update current file
  currentOpenFile = tabs[activeTabIndex].path;
  
  // Update status bar
  updateStatusBar(tabs[activeTabIndex].name);
}

function updateStatusBar(fileName) {
  document.getElementById('file-info').textContent = fileName || 'No file open';
  updateCursorPosition();
}

function updateCursorPosition() {
  const cursor = editor.getCursor();
  document.getElementById('cursor-position').textContent = 
    `Ln: ${cursor.line + 1}, Col: ${cursor.ch + 1}`;
}

function setEditorMode(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  let mode = 'javascript'; // Default mode
  
  switch (extension) {
    case 'js':
      mode = 'javascript';
      break;
    case 'html':
      mode = 'htmlmixed';
      break;
    case 'css':
      mode = 'css';
      break;
    case 'json':
      mode = { name: 'javascript', json: true };
      break;
    case 'md':
      mode = 'markdown';
      break;
    case 'xml':
      mode = 'xml';
      break;
    default:
      mode = 'javascript';
  }
  
  editor.setOption('mode', mode);
}