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
