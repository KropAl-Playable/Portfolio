// Get user's language
const userLang = navigator.language || navigator.userLanguage;
const isRussian = userLang.toLowerCase().startsWith('ru');

// Format a job entry
function formatJobEntry(job) {
  const responsibilities = job.responsibilities ? 
    `<div class="responsibilities">
      <h4 data-ru="Обязанности" data-en="Responsibilities">Responsibilities</h4>
      <ul>${job.responsibilities.map(r => `<li>${r}</li>`).join('')}</ul>
     </div>` : '';
  
  const achievements = job.achievements ? 
    `<div class="achievements">
      <h4 data-ru="Достижения" data-en="Achievements">Achievements</h4>
      <ul>${job.achievements.map(a => `<li>${a}</li>`).join('')}</ul>
     </div>` : '';

  return `
    <div class="job-entry">
      <div class="job-title">${job.role}</div>
      <div class="job-company">${job.company}</div>
      <div class="job-date">${job.start} — ${job.end}</div>
      ${responsibilities}
      ${achievements}
    </div>
  `;
}

// Format earlier experience entry
function formatEarlierJob(job) {
  return `
    <div class="earlier-job">
      <strong>${job.role}</strong> at ${job.company} (${job.period}) — ${job.notes}
    </div>
  `;
}

// Update page content based on language
function updatePageContent() {
  fetch(isRussian ? 'cv_ru.json' : 'cv_en.json')
    .then(response => response.json())
    .then(cv => {
      // Update meta information
      document.querySelector('h1').textContent = cv.meta.name;
      document.querySelector('header p').textContent = cv.meta.title;
      
      // Update section titles
      document.querySelectorAll('[data-ru][data-en]').forEach(el => {
        el.textContent = isRussian ? el.dataset.ru : el.dataset.en;
      });
      
      // Update Summary
      document.querySelector('#about .summary').textContent = cv.summary;
      
      // Update Skills
      Object.entries(cv.skills).forEach(([category, skills]) => {
        const ul = document.querySelector(`#${category} ul`);
        if (ul) {
          ul.innerHTML = skills.map(skill => `<li>${skill}</li>`).join('');
        }
      });
      
      // Update Experience
      const mainExp = document.querySelector('#experience .main-experience');
      mainExp.innerHTML = cv.experience.map(formatJobEntry).join('');
      
      const earlierExp = document.querySelector('#experience .earlier-experience');
      earlierExp.innerHTML += cv.earlier_experience.map(formatEarlierJob).join('');
      
      // Update Education
      const eduList = document.querySelector('#education .education-list');
      eduList.innerHTML = cv.education.map(edu => `
        <div class="education-entry">
          <h4>${edu.institution}</h4>
          <p>${edu.faculty}</p>
          <p class="notes">${edu.notes}</p>
        </div>
      `).join('');
      
      const coursesList = document.querySelector('#education .courses-list ul');
      coursesList.innerHTML = cv.courses.map(course => `<li>${course}</li>`).join('');
      
      // Update Languages
      const langList = document.querySelector('#additional .languages ul');
      langList.innerHTML = cv.languages.map(lang => 
        `<li>${lang.lang} — ${lang.level}</li>`
      ).join('');
      
      // Update Hobbies
      const hobbiesList = document.querySelector('#additional .hobbies ul');
      hobbiesList.innerHTML = cv.hobbies.map(hobby => `<li>${hobby}</li>`).join('');
      
      // Update Additional Info
      const extra = document.querySelector('#additional .extra');
      extra.querySelector('.availability').textContent = cv.additional.availability;
      extra.querySelector('.references').textContent = cv.additional.references;
    });
}

let allProjects = [];
let currentSort = 'newest';
let currentFilter = null;

function is3D(project) {
  return project.tags && project.tags.some(tag => tag.toLowerCase().includes('3d'));
}
function is2D(project) {
  return project.tags && project.tags.some(tag => tag.toLowerCase().includes('2d'));
}
function isPlayable(project) {
  return project.playable && project.playable.type === 'iframe';
}
function isBanner(project) {
  return project.playable && project.playable.type === 'banner';
}

function renderProjects() {
  const container = document.getElementById("project-list");
  container.innerHTML = '';
  let projects = [...allProjects];
  // Filter
  if (currentFilter === '3d') projects = projects.filter(is3D);
  if (currentFilter === '2d') projects = projects.filter(is2D);
  if (currentFilter === 'playable') projects = projects.filter(isPlayable);
  if (currentFilter === 'banner') projects = projects.filter(isBanner);
  // Sort
  projects.sort((a, b) => {
    if (currentSort === 'newest') return new Date(b.date) - new Date(a.date);
    if (currentSort === 'oldest') return new Date(a.date) - new Date(b.date);
    return 0;
  });
  // Render
  projects.forEach(project => {
    const card = document.createElement("div");
    card.className = "card";
    // Cover container for uniform size
    const coverContainer = document.createElement("div");
    coverContainer.className = "card-cover-container";
    const cover = document.createElement("img");
    cover.src = project.cover.fallback;
    cover.alt = project.title;
    coverContainer.appendChild(cover);
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
    // Date (hidden, for sorting only)
    const date = document.createElement("p");
    date.className = "date";
    date.textContent = `Дата: ${new Date(project.date).toLocaleDateString("ru-RU")}`;
    // Actions (stick to bottom)
    const actions = document.createElement("div");
    actions.className = "card-actions";
    // Play button (large, on top)
    const playButton = document.createElement("button");
    playButton.className = "play-button";
    playButton.innerHTML = isRussian ? "▶ Играть" : "▶ Play";
    playButton.onclick = (e) => {
      e.preventDefault();
      const iframe = document.getElementById("game-frame");
      iframe.src = project.playable.src;
      modal.style.display = "block";
    };
    // Store Page button (smaller, below)
    const storeButton = document.createElement("a");
    storeButton.className = "store-link";
    storeButton.textContent = isRussian ? "Страница в магазине" : "Store Page";
    storeButton.target = "_blank";
    // Device-aware store link
    let storeUrl = project.linkStoreGoogle || project.linkStore || "";
    if (project.linkStoreAppStore && /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)) {
      storeUrl = project.linkStoreAppStore;
    }
    storeButton.href = storeUrl || "#";
    if (!storeUrl) storeButton.style.display = "none";
    actions.appendChild(playButton);
    actions.appendChild(storeButton);
    content.appendChild(title);
    content.appendChild(desc);
    content.appendChild(tags);
    content.appendChild(date);
    content.appendChild(actions);
    card.appendChild(coverContainer);
    card.appendChild(content);
    container.appendChild(card);
  });
}

async function loadProjects() {
  const res = await fetch("projects.json");
  const data = await res.json();
  allProjects = data.projects;
  renderProjects();
}

function setupProjectTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      if (this.dataset.sort) {
        currentSort = this.dataset.sort;
        // Remove filter highlight
        currentFilter = null;
        tabs.forEach(t => { if (t.dataset.filter) t.classList.remove('active'); });
      }
      if (this.dataset.filter) {
        currentFilter = this.dataset.filter;
        // Remove sort highlight
        currentSort = 'newest';
        tabs.forEach(t => { if (t.dataset.sort) t.classList.remove('active'); });
      }
      renderProjects();
    });
  });
  // Set default active
  tabs[0].classList.add('active');
}

document.addEventListener("DOMContentLoaded", () => {
  updatePageContent();
  loadProjects();
  setupProjectTabs();
});
