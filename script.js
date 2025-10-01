async function loadProjects() {
  const res = await fetch("data/projects.json");
  const data = await res.json();

  const container = document.getElementById("project-list");

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

    const link = document.createElement("a");
    link.href = project.linkDemo;
    link.target = "_blank";
    link.textContent = "Смотреть демо";

    content.appendChild(title);
    content.appendChild(desc);
    content.appendChild(tags);
    content.appendChild(date);
    content.appendChild(link);

    card.appendChild(cover);
    card.appendChild(content);

    container.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", loadProjects);
