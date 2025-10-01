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
      // Update job title in header-contacts
      const contacts = document.querySelector('.header-contacts p');
      if (contacts) {
        // Remove job title from contacts if present
        contacts.childNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('Team Lead')) {
            node.textContent = '';
          }
        });
      }
      
      // Update section titles
      document.querySelectorAll('[data-ru][data-en]').forEach(el => {
        if (el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'H4') {
          el.textContent = isRussian ? el.dataset.ru : el.dataset.en;
        }
      });
      
  // Update Summary
  const aboutSummary = document.querySelector('#about .summary') || document.querySelector('.cv-spoiler .summary');
  if (aboutSummary) aboutSummary.textContent = cv.summary;
      
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

  projects.forEach(project => {
    const card = document.createElement("div");
    card.className = "card";
    // Cover container for uniform size
    const coverContainer = document.createElement("div");
    coverContainer.className = "card-cover-container";

    // PIXI.js cover animation
    const pixiApp = new PIXI.Application({
      width: 280, // will be resized
      height: 500,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });
    coverContainer.appendChild(pixiApp.view);
    // Load image as PIXI sprite
    const texture = PIXI.Texture.from(project.cover.fallback);
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    pixiApp.stage.addChild(sprite);
    // Resize canvas and sprite to fit container
    function resizePixi() {
      const rect = coverContainer.getBoundingClientRect();
      pixiApp.renderer.resize(rect.width, rect.height);
      sprite.x = rect.width / 2;
      sprite.y = rect.height / 2;
      // Cover fit
      const scale = Math.max(rect.width / texture.width, rect.height / texture.height);
      sprite.width = texture.width * scale;
      sprite.height = texture.height * scale;
    }
    // Initial resize
    setTimeout(resizePixi, 0);
    window.addEventListener('resize', resizePixi);
    // Hover animation: scale and perspective
    let hover = false;
    let mouseX = 0, mouseY = 0;
    coverContainer.addEventListener('mouseenter', () => { hover = true; });
    coverContainer.addEventListener('mouseleave', () => {
      hover = false;
      sprite.scale.set(1, 1);
      sprite.rotation = 0;
      pixiApp.stage.pivot.set(0, 0);
      pixiApp.stage.position.set(0, 0);
      pixiApp.stage.angle = 0;
    });
    coverContainer.addEventListener('mousemove', (e) => {
      const rect = coverContainer.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    });
    pixiApp.ticker.add(() => {
      if (hover) {
        // Scale up
        sprite.scale.set(1.07, 1.07);
        // Perspective skew/rotation
        const maxAngle = 0.18; // ~10deg
        sprite.rotation = -mouseX * maxAngle * 0.5;
        pixiApp.stage.pivot.set(sprite.x, sprite.y);
        pixiApp.stage.position.set(sprite.x, sprite.y);
        pixiApp.stage.angle = mouseX * 8;
      } else {
        sprite.scale.set(1, 1);
        sprite.rotation = 0;
        pixiApp.stage.pivot.set(0, 0);
        pixiApp.stage.position.set(0, 0);
        pixiApp.stage.angle = 0;
      }
    });

    const content = document.createElement("div");
    content.className = "card-content";
    const title = document.createElement("h3");
    title.textContent = project.title;
    // Description block scrollable
    const descScroll = document.createElement("div");
    descScroll.className = "card-desc-scroll";
    descScroll.textContent = isRussian ? project.description : (project.description_en || project.description);
    content.appendChild(title);
    content.appendChild(descScroll);
    // Date (hidden, for sorting only)
    const date = document.createElement("p");
    date.className = "date";
    date.textContent = `Дата: ${new Date(project.date).toLocaleDateString("ru-RU")}`;
    // Actions (stick to bottom)
    const actions = document.createElement("div");
    actions.className = "card-actions";
    // Play button (thinner)
    const playButton = document.createElement("button");
    playButton.className = "play-button thin";
    playButton.innerHTML = isRussian ? "▶ Играть" : "▶ Play";
    playButton.onclick = (e) => {
      e.preventDefault();
      openPlayableModal(project);
    };
    // Store Page button (thinner)
    const storeButton = document.createElement("a");
    storeButton.className = "store-link thin";
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
    content.appendChild(date);
    content.appendChild(actions);
    card.appendChild(coverContainer);
    card.appendChild(content);
    container.appendChild(card);
  });
}

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

  projects.forEach(project => {
    const card = document.createElement("div");
    card.className = "card";
    // Cover container for uniform size
    const coverContainer = document.createElement("div");
    coverContainer.className = "card-cover-container";

    // PIXI.js cover animation
    const pixiApp = new PIXI.Application({
      width: 280, // will be resized
      height: 500,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });
    coverContainer.appendChild(pixiApp.view);
    // Load image as PIXI sprite
    const texture = PIXI.Texture.from(project.cover.fallback);
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    pixiApp.stage.addChild(sprite);
    // Resize canvas and sprite to fit container
    function resizePixi() {
      const rect = coverContainer.getBoundingClientRect();
      pixiApp.renderer.resize(rect.width, rect.height);
      sprite.x = rect.width / 2;
      sprite.y = rect.height / 2;
      // Cover fit
      const scale = Math.max(rect.width / texture.width, rect.height / texture.height);
      sprite.width = texture.width * scale;
      sprite.height = texture.height * scale;
    }
    // Initial resize
    setTimeout(resizePixi, 0);
    window.addEventListener('resize', resizePixi);
    // Hover animation: scale and perspective
    let hover = false;
    let mouseX = 0, mouseY = 0;
    coverContainer.addEventListener('mouseenter', () => { hover = true; });
    coverContainer.addEventListener('mouseleave', () => {
      hover = false;
      sprite.scale.set(1, 1);
      sprite.rotation = 0;
      pixiApp.stage.pivot.set(0, 0);
      pixiApp.stage.position.set(0, 0);
      pixiApp.stage.angle = 0;
    });
    coverContainer.addEventListener('mousemove', (e) => {
      const rect = coverContainer.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    });
    pixiApp.ticker.add(() => {
      if (hover) {
        // Scale up
        sprite.scale.set(1.07, 1.07);
        // Perspective skew/rotation
        const maxAngle = 0.18; // ~10deg
        sprite.rotation = -mouseX * maxAngle * 0.5;
        pixiApp.stage.pivot.set(sprite.x, sprite.y);
        pixiApp.stage.position.set(sprite.x, sprite.y);
        pixiApp.stage.angle = mouseX * 8;
      } else {
        sprite.scale.set(1, 1);
        sprite.rotation = 0;
        pixiApp.stage.pivot.set(0, 0);
        pixiApp.stage.position.set(0, 0);
        pixiApp.stage.angle = 0;
      }
    });

    const content = document.createElement("div");
    content.className = "card-content";
    const title = document.createElement("h3");
    title.textContent = project.title;
    // Description block scrollable
    const descScroll = document.createElement("div");
    descScroll.className = "card-desc-scroll";
    descScroll.textContent = isRussian ? project.description : (project.description_en || project.description);
    content.appendChild(title);
    content.appendChild(descScroll);
    // Date (hidden, for sorting only)
    const date = document.createElement("p");
    date.className = "date";
    date.textContent = `Дата: ${new Date(project.date).toLocaleDateString("ru-RU")}`;
    // Actions (stick to bottom)
    const actions = document.createElement("div");
    actions.className = "card-actions";
    // Play button (thinner)
    const playButton = document.createElement("button");
    playButton.className = "play-button thin";
    playButton.innerHTML = isRussian ? "▶ Играть" : "▶ Play";
    playButton.onclick = (e) => {
      e.preventDefault();
      openPlayableModal(project);
    };
    // Store Page button (thinner)
    const storeButton = document.createElement("a");
    storeButton.className = "store-link thin";
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
    content.appendChild(date);
    content.appendChild(actions);
    card.appendChild(coverContainer);
    card.appendChild(content);
    container.appendChild(card);
  });
      storeUrl = project.linkStoreAppStore;
  
    storeButton.href = storeUrl || "#";
    if (!storeUrl) storeButton.style.display = "none";
    actions.appendChild(playButton);
    actions.appendChild(storeButton);
    content.appendChild(title);
    // Description block scrollable
    const descScroll = document.createElement("div");
    descScroll.className = "card-desc-scroll";
    descScroll.textContent = isRussian ? project.description : (project.description_en || project.description);
    content.appendChild(descScroll);
    content.appendChild(date);
    content.appendChild(actions);
    card.appendChild(coverContainer);
    card.appendChild(content);
    container.appendChild(card);
// Playable modal logic with tags below iframe
function openPlayableModal(project) {
  const modal = document.getElementById("modal");
  const iframe = document.getElementById("game-frame");
  const tagBlock = document.getElementById("modal-tags");
  iframe.src = project.playable.src;
  modal.style.display = "block";
  // Show tags below iframe
  if (tagBlock) {
    tagBlock.innerHTML = '';
    if (project.tags && project.tags.length) {
      project.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'modal-tag';
        span.textContent = tag;
        tagBlock.appendChild(span);
      });
      tagBlock.style.display = 'flex';
    } else {
      tagBlock.style.display = 'none';
    }
  }
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

// Sticky header shrink on scroll (fix shaking)
let headerShrinkApplied = false;
window.addEventListener('scroll', function() {
  const header = document.getElementById('main-header');
  if (!header) return;
  if (window.scrollY > 80 && !headerShrinkApplied) {
    header.classList.add('shrink');
    headerShrinkApplied = true;
  } else if (window.scrollY <= 40 && headerShrinkApplied) {
    header.classList.remove('shrink');
    headerShrinkApplied = false;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  updatePageContent();
  loadProjects();
  setupProjectTabs();

  // Portfolio link scrolls to #projects
  const portfolioLink = document.querySelector('.portfolio-link');
  if (portfolioLink) {
    portfolioLink.addEventListener('click', function(e) {
      e.preventDefault();
      const section = document.getElementById('projects');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Spoiler animation for CV blocks
  document.querySelectorAll('.cv-spoiler').forEach(details => {
    const content = details.querySelector('.cv-content');
    if (!content) return;
    // Set initial max-height
    if (details.open) {
      content.style.maxHeight = content.scrollHeight + 'px';
    } else {
      content.style.maxHeight = '0px';
    }
    details.addEventListener('toggle', function() {
      if (details.open) {
        content.style.display = 'block';
        requestAnimationFrame(() => {
          content.style.maxHeight = content.scrollHeight + 'px';
        });
      } else {
        content.style.maxHeight = '0px';
        setTimeout(() => { content.style.display = 'none'; }, 400);
      }
    });
    // Smooth transition
    content.style.transition = 'max-height 0.4s cubic-bezier(.4,0,.2,1), padding 0.3s';
  });

  // --- PIXI Mouse Trail Effect ---
  // Wait for Pixi to be available
  if (window.PIXI) {
    const trailTextureUrl = 'assets/trail.png'; // User should provide this file
    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true
    });
    app.view.style.position = 'fixed';
    app.view.style.left = '0';
    app.view.style.top = '0';
    app.view.style.width = '100vw';
    app.view.style.height = '100vh';
    app.view.style.pointerEvents = 'none';
    app.view.style.zIndex = '999';
    document.body.appendChild(app.view);

    // Handle resize
    window.addEventListener('resize', () => {
      app.renderer.resize(window.innerWidth, window.innerHeight);
    });

    // Trail logic
    const trailPoints = [];
    const maxTrail = 32;
    let lastX = window.innerWidth/2, lastY = window.innerHeight/2;
    document.addEventListener('mousemove', e => {
      lastX = e.clientX;
      lastY = e.clientY;
    });
    PIXI.Loader.shared.add('trail', trailTextureUrl).load(() => {
      app.ticker.add(() => {
        // Add new point
        trailPoints.push({
          x: lastX,
          y: lastY,
          alpha: 1,
          sprite: null
        });
        if (trailPoints.length > maxTrail) {
          const old = trailPoints.shift();
          if (old.sprite) app.stage.removeChild(old.sprite);
        }
        // Draw trail
        trailPoints.forEach((pt, i) => {
          if (!pt.sprite) {
            pt.sprite = new PIXI.Sprite(PIXI.Loader.shared.resources['trail'].texture);
            pt.sprite.anchor.set(0.5);
            app.stage.addChild(pt.sprite);
          }
          pt.sprite.x = pt.x;
          pt.sprite.y = pt.y;
          pt.sprite.alpha = (i+1)/trailPoints.length * 0.7;
          pt.sprite.scale.set(0.5 + 0.7 * (i+1)/trailPoints.length);
        });
      });
    });
  }
});
