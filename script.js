// Get user's language
const userLang = navigator.language || navigator.userLanguage;
const isRussian = userLang.toLowerCase().startsWith('ru');

// Parse CV sections from text
function parseCVSections(text) {
  const sections = {};
  let currentSection = '';
  let content = [];
  
  text.split('\n').forEach(line => {
    if (line.match(/^[A-Za-z& ]+$/)) {
      if (currentSection) {
        sections[currentSection] = content.join('\n');
        content = [];
      }
      currentSection = line.trim();
    } else if (line.trim() && currentSection) {
      content.push(line);
    }
  });
  
  if (currentSection && content.length) {
    sections[currentSection] = content.join('\n');
  }
  
  return sections;
}

// Convert text content to HTML
function formatCVContent(content) {
  return content
    .split('\n\n')
    .map(paragraph => `<p>${paragraph.trim()}</p>`)
    .join('');
}

// Format experience section
function formatExperience(content) {
  const entries = content.split(/\n(?=[A-Za-z]+ — )/);
  return entries.map(entry => {
    const [title, ...rest] = entry.split('\n');
    const [role, period] = title.split(' — ');
    return `
      <div class="job-entry">
        <div class="job-title">${role}</div>
        <div class="job-date">${period}</div>
        ${formatCVContent(rest.join('\n'))}
      </div>
    `;
  }).join('');
}

// Update page content based on language
function updatePageContent() {
  // Update header
  document.querySelector('h1').textContent = isRussian ? 'Алексей Кропачев' : 'Alexey Kropachev';
  document.querySelector('header p').textContent = 'Senior Playable Ads Developer / Team Lead';
  
  // Update section titles
  document.querySelectorAll('[data-ru][data-en]').forEach(el => {
    el.textContent = isRussian ? el.dataset.ru : el.dataset.en;
  });
  
  // Load and update CV sections
  fetch(isRussian ? 'CV_RU.txt' : 'CV_EN.txt')
    .then(response => response.text())
    .then(text => {
      const sections = parseCVSections(text);
      
      // Update Summary
      document.querySelector('#about p').textContent = sections['Summary'];
      
      // Update Professional Experience
      document.querySelector('#experience .cv-content').innerHTML = 
        formatExperience(sections['Professional Experience']);
      
      // Update Education
      document.querySelector('#education .cv-content').innerHTML = 
        formatCVContent(sections['Education & Courses']);
      
      // Update Additional sections
      document.querySelector('#additional .languages .cv-content').innerHTML = 
        formatCVContent(sections['Languages']);
      
      document.querySelector('#additional .hobbies .cv-content').innerHTML = 
        formatCVContent(sections['Hobbies & Interests']);
      
      document.querySelector('#additional .extra .cv-content').innerHTML = 
        formatCVContent(sections['Additional']);
    });
}

async function loadProjects() {
  const res = await fetch("projects.json");
  const data = await res.json();

  const container = document.getElementById("project-list");

  // Create modal for playable preview
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-button">&times;</span>
      <div class="iframe-container">
        <iframe id="game-frame"></iframe>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Close modal functionality
  const closeButton = modal.querySelector(".close-button");
  closeButton.onclick = () => {
    modal.style.display = "none";
    const iframe = document.getElementById("game-frame");
    iframe.src = "";
  };

  // Close on outside click
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
      const iframe = document.getElementById("game-frame");
      iframe.src = "";
    }
  };

  // Сортировка по дате (новые сверху)
  data.projects.sort((a, b) => new Date(b.date) - new Date(a.date));

  data.projects.forEach(project => {
    const card = document.createElement("div");
    card.className = "card";

    const cover = document.createElement("img");
    cover.src = project.cover.fallback;
    cover.alt = project.title;

    const content = document.createElement("div");
    content.className = "card-content";

    const title = document.createElement("h3");
    title.textContent = project.title;

    const desc = document.createElement("p");
    desc.textContent = isRussian ? project.description : (project.description_en || project.description);

    // 📌 Теги / жанры
    const tags = document.createElement("div");
    tags.className = "tags";
    project.tags.forEach(tag => {
      const span = document.createElement("span");
      span.textContent = tag;
      tags.appendChild(span);
    });

    const date = document.createElement("p");
    date.className = "date";
    date.textContent = `Дата: ${new Date(project.date).toLocaleDateString("ru-RU")}`;

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const playButton = document.createElement("button");
    playButton.className = "play-button";
    playButton.innerHTML = "▶ Играть";
    playButton.onclick = (e) => {
      e.preventDefault();
      const iframe = document.getElementById("game-frame");
      iframe.src = project.playable.src;
      modal.style.display = "block";
    };

    const link = document.createElement("a");
    link.href = project.linkStore || "#";
    link.target = "_blank";
    link.className = "store-link";
    link.textContent = "Google Play";
    if (!project.linkStore) link.style.display = "none";

    actions.appendChild(playButton);
    actions.appendChild(link);

    content.appendChild(title);
    content.appendChild(desc);
    content.appendChild(tags);
    content.appendChild(date);
    content.appendChild(actions);

    card.appendChild(cover);
    card.appendChild(content);

    container.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updatePageContent();
  loadProjects();
});
