# AI Agent Instructions for Portfolio Website

## Project Overview
This is a CV and portfolio website showcasing playable ads and game development projects. The site is built using vanilla HTML, CSS, and JavaScript, with a data-driven architecture for managing project information.

## Key Files and Structure
- `index.html`: Main page structure and layout
- `style.css`: Core styling with a defined color scheme (dark: #2B2D42, gray: #8D99AE, light: #EDF2F4, accent: #901423ff)
- `script.js`: Dynamic project card generation and DOM manipulation
- `data/projects.json`: Central data store for all project information
- `data/projects/`: Contains individual HTML files for each playable demo

## Project Data Schema
Projects in `projects.json` follow this structure:
```json
{
  "id": "unique-identifier",
  "title": "Project Title",
  "genres": ["Genre1", "Genre2"],
  "forProject": "Parent Project Name",
  "tags": ["Technology1", "Technology2"],
  "cover": {
    "webp": "assets/image.webp",
    "fallback": "assets/image.png"
  },
  "description": "Russian description",
  "description_en": "English description",
  "date": "YYYY-MM-DD",
  "linkDemo": "projects/folder/demo.html",
  "linkStore": "store-url",
  "playable": {
    "type": "iframe",
    "src": "projects/folder/demo.html"
  }
}
```

## Project Files Organization
- Projects are organized by game/product in subdirectories under `data/projects/`
- Each project demo is a self-contained HTML file using either WebGL (Cocos Creator) or CreateJS
- Asset files are stored in the `assets/` directory with both WebP and fallback formats

## Development Patterns
1. Adding a New Project:
   - Add project metadata to `projects.json`
   - Place demo HTML in appropriate subfolder under `data/projects/`
   - Add cover images to `assets/` in both WebP and fallback formats

2. Project Card Generation:
   - Projects are automatically sorted by date (newest first)
   - Cards are generated dynamically by `script.js`
   - Project tags and metadata are rendered consistently across all cards

3. Responsive Design:
    - The layout is responsive and adapts to various screen sizes
    - CSS media queries are used to ensure usability on mobile devices

4. CV block:
    - The CV section is static and styled to match the overall site theme
    - Contact information and social links are included in the footer

5. iFrame playable preview:
    - Playable ads are embedded using iframes for easy interaction
    - Ensure the demo HTML files are optimized for performance
    - iFrame has fixed dimensions for consistency imitating the phone screen
    - iFrame can be rotated to landscape mode for better user experience

6. Accessibility:
    - Use semantic HTML elements for better accessibility
    - Ensure color contrast meets accessibility standards

7. Pixi.js:
    - Pixi.js is included for potential future enhancements involving WebGL rendering

## Common Tasks
- To add a new project: Update `projects.json` and add required assets/demo files
- To modify styling: Check `style.css` for the color scheme and existing patterns
- To update card layout: Modify the card generation logic in `script.js`
- To update CV information: Edit `cv_en.json` and `cv_ru.json` for English and Russian versions respectively
- Fix javaScript errors and ensure cross-browser compatibility

## Integration Points
- Projects are loaded via JSON fetch from `projects.json`
- Demo iframes are embedded using the `playable.src` property
- External links use `linkStore` for app store connections