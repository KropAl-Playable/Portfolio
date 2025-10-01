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
  // PIXI.js cover animation
  if (typeof PIXI !== 'undefined') {
    try {
      pixiApp = new PIXI.Application({
        width: 280, // will be resized
        height: 500,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      });
      coverContainer.appendChild(pixiApp.view);
      
      // Load image lazily with error handling
      PIXI.Texture.fromURL(project.cover.fallback).then(texture => {
        if (!pixiApp) return; // App might have been destroyed
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
        
        // Initial resize
        setTimeout(resizePixi, 0);
        const resizeHandler = () => {
          if (pixiApp && sprite) resizePixi();
        };
        window.addEventListener('resize', resizeHandler);
        
        // Hover animation
        let hover = false;
        let mouseX = 0, mouseY = 0;
        
        const enterHandler = () => { hover = true; };
        const leaveHandler = () => {
          hover = false;
          if (!sprite) return;
          sprite.scale.set(1, 1);
          sprite.rotation = 0;
          if (pixiApp) {
            pixiApp.stage.pivot.set(0, 0);
            pixiApp.stage.position.set(0, 0);
            pixiApp.stage.angle = 0;
          }
        };
        
        const moveHandler = (e) => {
          const rect = coverContainer.getBoundingClientRect();
          mouseX = (e.clientX - rect.left) / rect.width - 0.5;
          mouseY = (e.clientY - rect.top) / rect.height - 0.5;
        };
        
        coverContainer.addEventListener('mouseenter', enterHandler);
        coverContainer.addEventListener('mouseleave', leaveHandler);
        coverContainer.addEventListener('mousemove', moveHandler);
        
        // Animation ticker
        const tickerHandler = () => {
          if (hover && sprite && pixiApp) {
            sprite.scale.set(1.07, 1.07);
            const maxAngle = 0.18;
            sprite.rotation = -mouseX * maxAngle * 0.5;
            pixiApp.stage.pivot.set(sprite.x, sprite.y);
            pixiApp.stage.position.set(sprite.x, sprite.y);
            pixiApp.stage.angle = mouseX * 8;
          }
        };
        
        if (pixiApp) {
          pixiApp.ticker.add(tickerHandler);
        }
        
        // Cleanup function for when the card is removed
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.removedNodes.forEach((node) => {
              if (node === card) {
                window.removeEventListener('resize', resizeHandler);
                coverContainer.removeEventListener('mouseenter', enterHandler);
                coverContainer.removeEventListener('mouseleave', leaveHandler);
                coverContainer.removeEventListener('mousemove', moveHandler);
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
        createFallbackImage();
      });
    } catch (error) {
      console.warn('Failed to setup PIXI view:', error);
      createFallbackImage();
    }
  } else {
    createFallbackImage();
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
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      if (this.dataset.sort) {
        state.currentSort = this.dataset.sort;
        // Remove filter highlight
        state.currentFilter = null;
        tabs.forEach(t => { if (t.dataset.filter) t.classList.remove('active'); });
      }
      if (this.dataset.filter) {
        state.currentFilter = this.dataset.filter;
        // Remove sort highlight
        state.currentSort = 'newest';
        tabs.forEach(t => { if (t.dataset.sort) t.classList.remove('active'); });
      }
      renderProjects();
    });
  });
  // Set default active
  tabs[0].classList.add('active');
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

// Initialize PIXI Mouse Trail Effect
function initializePixiTrail() {
  if (!window.PIXI) return;

  const trailTextureUrl = 'assets/trail.PNG';
  let app, ticker;
  const trailPoints = [];
  const maxTrail = 32;
  let lastX = window.innerWidth/2;
  let lastY = window.innerHeight/2;
  
  function setupPixiApp() {
    app = new PIXI.Application({
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
  }

  function handleMouseMove(e) {
    lastX = e.clientX;
    lastY = e.clientY;
  }

  function handleResize() {
    if (app) app.renderer.resize(window.innerWidth, window.innerHeight);
  }

  function cleanup() {
    document.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('resize', handleResize);
    if (app && app.ticker && ticker) app.ticker.remove(ticker);
    trailPoints.forEach(pt => {
      if (pt.sprite) pt.sprite.destroy();
    });
    if (app) app.destroy(true);
  }

  function startTrailAnimation(texture) {
    ticker = () => {
      // Add new point
      trailPoints.push({
        x: lastX,
        y: lastY,
        alpha: 1,
        sprite: null
      });

      if (trailPoints.length > maxTrail) {
        const old = trailPoints.shift();
        if (old.sprite) {
          app.stage.removeChild(old.sprite);
          old.sprite.destroy();
        }
      }

      // Draw trail
      trailPoints.forEach((pt, i) => {
        if (!pt.sprite) {
          pt.sprite = new PIXI.Sprite(texture);
          pt.sprite.anchor.set(0.5);
          app.stage.addChild(pt.sprite);
        }
        pt.sprite.x = pt.x;
        pt.sprite.y = pt.y;
        pt.sprite.alpha = (i + 1) / trailPoints.length * 0.7;
        pt.sprite.scale.set(0.5 + 0.7 * (i + 1) / trailPoints.length);
      });
    };
    
    if (app && app.ticker) app.ticker.add(ticker);
  }

  // Initialize and set up event listeners
  setupPixiApp();
  document.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('resize', handleResize);
  window.addEventListener('unload', cleanup);

  // Load and initialize texture
  try {
    const texture = PIXI.Texture.from(trailTextureUrl);
    texture.baseTexture.once('error', (error) => {
      console.warn('Failed to load trail texture:', error);
      cleanup();
    });
    texture.baseTexture.once('loaded', () => startTrailAnimation(texture));
  } catch (error) {
    console.warn('Failed to initialize trail effect:', error);
    cleanup();
  }
}

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  // Initialize PIXI trail effect
  initializePixiTrail();
  
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