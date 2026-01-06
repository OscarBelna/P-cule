import { loadData } from '../shared/index.js';
import { escapeHtml } from '../shared/index.js';

/**
 * Affiche les catégories
 */
export function renderCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;

    const data = loadData();
    const categories = data.categories;

    if (categories.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
                <p>Aucune catégorie pour le moment</p>
                <p style="font-size: 14px; margin-top: 8px;">Créez votre première catégorie ci-dessus</p>
            </div>
        `;
        return;
    }

    container.innerHTML = categories.map(category => `
        <div class="category-item">
            <div class="category-color" style="background-color: ${category.color}"></div>
            <div class="category-name">${escapeHtml(category.name)}</div>
            <div class="category-actions">
                <button class="btn-edit btn-sm" onclick="editCategory('${category.id}')">
                    Modifier
                </button>
                <button class="btn-delete btn-sm" onclick="deleteCategory('${category.id}')">
                    Supprimer
                </button>
            </div>
        </div>
    `).join('');
}

