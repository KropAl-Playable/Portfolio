// Get user's language
const userLang = navigator.language || navigator.userLanguage;
const isRussian = userLang.toLowerCase().startsWith('ru');

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

// Global state
const state = {
  projects: [],
  currentSort: 'newest',
  currentFilter: null
};

// Initialize projects list
async function loadProjects() {
  try {
    const res = await fetch("projects.json");
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.projects)) {
      throw new Error('Invalid projects data format');
    }
    state.projects = data.projects;
    renderProjects();
  } catch (error) {
    console.error('Failed to load projects:', error);
    document.getElementById('project-list')?.insertAdjacentHTML(
      'beforeend',
      `<div class="error-message">${isRussian ? 'Ошибка загрузки проектов' : 'Failed to load projects'}</div>`
    );
  }
}

function renderProjects() {
  const container = document.getElementById("project-list");
  if (!container) return;
  
  container.innerHTML = '';
  let projects = [...state.projects];
  // Filter
  if (state.currentFilter === '3d') projects = projects.filter(is3D);
  if (state.currentFilter === '2d') projects = projects.filter(is2D);
  if (state.currentFilter === 'playable') projects = projects.filter(isPlayable);
  if (state.currentFilter === 'banner') projects = projects.filter(isBanner);
  // Sort
  projects.sort((a, b) => {
    if (state.currentSort === 'newest') return new Date(b.date) - new Date(a.date);
    if (state.currentSort === 'oldest') return new Date(a.date) - new Date(b.date);
    return 0;
  });

  if (!projects || !Array.isArray(projects)) {
    console.warn('Invalid projects data');
    return;
  }

  projects.forEach(project => {
    if (!project) return;
    createProjectCard(project);
  });
}

function createProjectCard(project) {
  const container = document.getElementById("project-list");
  if (!container) return;

  const card = document.createElement("div");
  card.className = "card";
  
  // Cover container for uniform size
  const coverContainer = document.createElement("div");
  coverContainer.className = "card-cover-container";

  let pixiApp, sprite;
  // PIXI.js cover animation with limited contexts
  const maxContexts = 10; // Maximum number of WebGL contexts to maintain
  if (typeof PIXI !== 'undefined') {
    try {
      // Clean up old contexts if needed
      const existingContexts = document.querySelectorAll('canvas.pixi-view');
      if (existingContexts.length >= maxContexts) {
        const oldestContext = existingContexts[0];
        const oldestCard = oldestContext.closest('.card');
        if (oldestCard) {
          oldestCard.querySelector('.card-cover-container').innerHTML = '';
          createFallbackImage(oldestCard.querySelector('.card-cover-container'));
        }
      }

      pixiApp = new PIXI.Application({
        width: 280,
        height: 420, // Adjusted for 3:5 ratio
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      });
      pixiApp.view.classList.add('pixi-view'); // For tracking contexts
      coverContainer.appendChild(pixiApp.view);
      
      // Load image lazily with error handling
      PIXI.Texture.fromURL(project.cover.fallback).then(texture => {
        if (!pixiApp) return;
        sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        pixiApp.stage.addChild(sprite);
        
        // Set up resize and interaction after sprite is loaded
        function resizePixi() {
          const rect = coverContainer.getBoundingClientRect();
          if (!pixiApp || !sprite) return;
          pixiApp.renderer.resize(rect.width, rect.height);
          sprite.x = rect.width / 2;
          sprite.y = rect.height / 2;
          const scale = Math.max(rect.width / texture.width, rect.height / texture.height);
          sprite.width = texture.width * scale;
          sprite.height = texture.height * scale;
        }
        
        setTimeout(resizePixi, 0);
        const resizeHandler = () => {
          if (pixiApp && sprite) resizePixi();
        };
        window.addEventListener('resize', resizeHandler);
        
        // Hover animation on entire card
        let hover = false;
        let mouseX = 0, mouseY = 0;
        
        const enterHandler = () => { hover = true; };
        const leaveHandler = () => {
          hover = false;
          if (!sprite) return;
          sprite.scale.set(1, 1);
          if (pixiApp) {
            pixiApp.stage.angle = 0;
            card.style.transform = 'scale(1)';
          }
        };
        
        const moveHandler = (e) => {
          const rect = card.getBoundingClientRect(); // Using card instead of coverContainer
          mouseX = (e.clientX - rect.left) / rect.width - 0.5;
          mouseY = (e.clientY - rect.top) / rect.height - 0.5;
        };
        
        // Apply hover handlers to the entire card
        card.addEventListener('mouseenter', enterHandler);
        card.addEventListener('mouseleave', leaveHandler);
        card.addEventListener('mousemove', moveHandler);
        
        // Animation ticker with reduced zoom and rotation applied to entire card
        const tickerHandler = () => {
          if (hover && sprite && pixiApp) {
            sprite.scale.set(1.05, 1.05); // Reduced zoom
            const rotationX = mouseY * 8; // Vertical tilt
            const rotationY = mouseX * -8; // Horizontal tilt
            card.style.transform = `scale(1.02) perspective(1000px) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
          }
        };
        
        if (pixiApp) {
          pixiApp.ticker.add(tickerHandler);
        }
        
        // Enhanced cleanup
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.removedNodes.forEach((node) => {
              if (node === card) {
                window.removeEventListener('resize', resizeHandler);
                card.removeEventListener('mouseenter', enterHandler);
                card.removeEventListener('mouseleave', leaveHandler);
                card.removeEventListener('mousemove', moveHandler);
                if (pixiApp) {
                  pixiApp.ticker.remove(tickerHandler);
                  pixiApp.destroy(true);
                  pixiApp = null;
                }
                observer.disconnect();
              }
            });
          });
        });
        
        observer.observe(card.parentNode, { childList: true });
      }).catch(error => {
        console.warn('Failed to load image:', error);
        createFallbackImage(coverContainer);
      });
    } catch (error) {
      console.warn('Failed to setup PIXI view:', error);
      createFallbackImage(coverContainer);
    }
  } else {
    createFallbackImage(coverContainer);
  }
  
  function createFallbackImage() {
    const fallbackImg = document.createElement('img');
    fallbackImg.src = project.cover.fallback;
    fallbackImg.alt = project.title;
    coverContainer.appendChild(fallbackImg);
  }

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

function setupProjectTabs() {
  const tabs = document.querySelectorAll('.tab');
  
  function updateTabStates() {
    // Remove active state from all tabs
    tabs.forEach(t => t.classList.remove('active'));
    
    // Set active state based on current filter or sort
    if (state.currentFilter) {
      tabs.forEach(t => {
        if (t.dataset.filter === state.currentFilter) {
          t.classList.add('active');
        }
      });
    } else {
      tabs.forEach(t => {
        if (t.dataset.sort === state.currentSort) {
          t.classList.add('active');
        }
      });
    }
  }
  
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      if (this.dataset.sort) {
        state.currentSort = this.dataset.sort;
        state.currentFilter = null; // Clear any active filter
      }
      if (this.dataset.filter) {
        state.currentFilter = this.dataset.filter;
        state.currentSort = 'newest'; // Reset to default sort
      }
      
      updateTabStates();
      renderProjects();
    });
  });
  
  // Set initial active state
  updateTabStates();
}

// Update page content based on language
function updatePageContent() {
  document.querySelectorAll('[data-ru][data-en]').forEach(el => {
    el.textContent = isRussian ? el.dataset.ru : el.dataset.en;
  });
}

// Debounce helper function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Show/hide sticky header on scroll (debounced)
let lastScrollTop = 0;
const handleScroll = debounce(function() {
  const stickyHeader = document.querySelector('.sticky-header');
  if (!stickyHeader) return;
  
  const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
  const mainHeader = document.getElementById('main-header');
  const mainHeaderHeight = mainHeader ? mainHeader.offsetHeight : 0;
  
  // Show sticky header when scrolling down past the main header
  if (currentScroll > mainHeaderHeight) {
    if (currentScroll > lastScrollTop) {
      // Scrolling down
      stickyHeader.classList.remove('visible');
    } else {
      // Scrolling up
      stickyHeader.classList.add('visible');
    }
  } else {
    stickyHeader.classList.remove('visible');
  }
  
  lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
}, 10); // 10ms debounce

window.addEventListener('scroll', handleScroll);



// Load CV data
async function loadCVData() {
  try {
    const res = await fetch(isRussian ? 'cv_ru.json' : 'cv_en.json');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    
    // Update meta information
    document.querySelector('.header-main h1').textContent = data.meta.name;
    document.querySelector('.header-main p').textContent = data.meta.title;
    document.querySelector('.contacts').innerHTML = `
      📍 ${data.meta.location} | ✉️ <a href="mailto:${data.meta.email}">${data.meta.email}</a> | 🔗 
      <a href="#projects" class="portfolio-link">${isRussian ? 'Портфолио' : 'Portfolio'}</a>
    `;
    
    // Update CV sections
    document.querySelector('#about .summary').textContent = data.summary;
    
    // Update skills
    Object.keys(data.skills).forEach(category => {
      const ul = document.querySelector(`#${category} ul`);
      if (ul) {
        ul.innerHTML = data.skills[category].map(skill => `<li>${skill}</li>`).join('');
      }
    });
    
    // Update experience
    const mainExp = document.querySelector('.main-experience');
    mainExp.innerHTML = data.experience.map(job => formatJobEntry(job)).join('');
    
    const earlierExp = document.querySelector('.earlier-experience');
    earlierExp.innerHTML += data.earlier_experience.map(job => formatEarlierJob(job)).join('');
    
    // Update education
    const eduList = document.querySelector('.education-list');
    eduList.innerHTML = data.education.map(edu => `
      <div class="education-entry">
        <strong>${edu.institution}</strong><br>
        ${edu.faculty}${edu.notes ? ` — ${edu.notes}` : ''}
      </div>
    `).join('');
    
    // Update courses
    const coursesList = document.querySelector('.courses-list ul');
    coursesList.innerHTML = data.courses.map(course => `<li>${course}</li>`).join('');
    
    // Update languages
    const langList = document.querySelector('.languages ul');
    langList.innerHTML = data.languages.map(lang => `
      <li><strong>${lang.lang}</strong> — ${lang.level}</li>
    `).join('');
    
    // Update hobbies
    const hobbiesList = document.querySelector('.hobbies ul');
    hobbiesList.innerHTML = data.hobbies.map(hobby => `<li>${hobby}</li>`).join('');
    
    // Update additional info
    document.querySelector('.availability').textContent = data.additional.availability;
    
  } catch (error) {
    console.error('Failed to load CV data:', error);
  }
}

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  loadCVData(); // Add CV data loading
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

  // Initialize CV content visibility
  document.querySelectorAll('.cv-spoiler').forEach(details => {
    const content = details.querySelector('.cv-content');
    if (!content) return;
    
    // Special handling for about section
    if (details.closest('#about')) {
      details.open = true;
      content.style.maxHeight = 'none';
      content.style.display = 'block';
      return;
    }
    
    // Set initial state
    if (details.open) {
      content.style.display = 'block';
      requestAnimationFrame(() => {
        content.style.maxHeight = content.scrollHeight + 'px';
      });
    } else {
      content.style.maxHeight = '0';
      content.style.display = 'none';
    }
    
    // Toggle animation
    details.addEventListener('toggle', function() {
      if (this.open) {
        content.style.display = 'block';
        requestAnimationFrame(() => {
          content.style.maxHeight = content.scrollHeight + 'px';
        });
      } else {
        content.style.maxHeight = '0';
        content.addEventListener('transitionend', function handler() {
          if (!details.open) {
            content.style.display = 'none';
          }
          content.removeEventListener('transitionend', handler);
        });
      }
    });

    // Smooth transition
    content.style.transition = 'max-height 0.4s cubic-bezier(.4,0,.2,1)';
  });
});