import { loadData } from '../shared/index.js';
import { escapeHtml } from '../shared/index.js';

/**
 * Affiche les catégories de transactions
 */
export function renderCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;

    const data = loadData();
    // Filtrer uniquement les catégories de type 'transaction' (ou sans type pour rétrocompatibilité)
    const categories = data.categories.filter(c => !c.type || c.type === 'transaction');

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

/**
 * Affiche les catégories d'économie
 */
export function renderSavingsCategories() {
    const container = document.getElementById('savings-categories-container');
    if (!container) return;

    const data = loadData();
    // Filtrer uniquement les catégories de type 'savings'
    const categories = data.categories.filter(c => c.type === 'savings');

    if (categories.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p>Aucune catégorie d'économie</p>
                <p style="font-size: 14px; margin-top: 8px;">Créez votre première catégorie d'économie ci-dessus</p>
            </div>
        `;
        return;
    }

    container.innerHTML = categories.map(category => `
        <div class="category-item">
            <div class="category-color" style="background-color: ${category.color}"></div>
            <div class="category-name">${escapeHtml(category.name)}</div>
            <div class="category-actions">
                <button class="btn-edit btn-sm" onclick="editSavingsCategory('${category.id}')">
                    Modifier
                </button>
                <button class="btn-delete btn-sm" onclick="deleteSavingsCategory('${category.id}')">
                    Supprimer
                </button>
            </div>
        </div>
    `).join('');
}

