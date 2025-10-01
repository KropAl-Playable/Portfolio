async function loadProjects() {
  const res = await fetch("data/projects.json");
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
    desc.textContent = project.description;

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

document.addEventListener("DOMContentLoaded", loadProjects);
