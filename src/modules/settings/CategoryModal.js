import { loadData, saveData } from '../shared/index.js';

// Variable pour le callback après création de catégorie
let categoryModalCallback = null;

/**
 * Initialise le modal de création de catégorie
 */
export function initCategoryModal() {
    const modal = document.getElementById('category-modal');
    const closeBtn = document.getElementById('category-modal-close');
    const cancelBtn = document.getElementById('category-modal-cancel');
    const form = document.getElementById('category-modal-form');
    const colorInput = document.getElementById('category-modal-color');
    const colorPreview = document.getElementById('category-modal-color-preview');
    
    if (!modal) return;
    
    // Fermer le modal en cliquant sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeCategoryModal();
        }
    });
    
    // Bouton de fermeture
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeCategoryModal();
        });
    }
    
    // Bouton d'annulation
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeCategoryModal();
        });
    }
    
    // Mise à jour de l'aperçu de couleur
    if (colorInput && colorPreview) {
        colorInput.addEventListener('input', (e) => {
            colorPreview.style.backgroundColor = e.target.value;
        });
        
        // Initialiser l'aperçu de couleur
        colorPreview.style.backgroundColor = colorInput.value;
    }
    
    // Soumission du formulaire
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCategoryModalSubmit();
        });
    }
    
    // Fermer avec Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeCategoryModal();
        }
    });
}

/**
 * Ouvre le modal de création de catégorie
 * @param {Function} callback - Callback optionnel appelé après création
 */
export function openCategoryModal(callback = null) {
    const modal = document.getElementById('category-modal');
    const nameInput = document.getElementById('category-modal-name');
    const colorInput = document.getElementById('category-modal-color');
    const colorPreview = document.getElementById('category-modal-color-preview');
    
    if (!modal) return;
    
    categoryModalCallback = callback;
    
    // Réinitialiser le formulaire
    const form = document.getElementById('category-modal-form');
    if (form) form.reset();
    if (colorInput) colorInput.value = '#3b82f6';
    if (colorPreview) colorPreview.style.backgroundColor = '#3b82f6';
    
    // Afficher le modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus sur le champ nom
    setTimeout(() => {
        if (nameInput) {
            nameInput.focus();
        }
    }, 100);
}

/**
 * Ferme le modal de création de catégorie
 */
export function closeCategoryModal() {
    const modal = document.getElementById('category-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        categoryModalCallback = null;
    }
}

/**
 * Gère la soumission du formulaire du modal
 */
function handleCategoryModalSubmit() {
    const nameInput = document.getElementById('category-modal-name');
    const colorInput = document.getElementById('category-modal-color');
    
    const name = nameInput.value.trim();
    const color = colorInput.value;
    
    if (!name) {
        alert('Veuillez entrer un nom de catégorie');
        return;
    }
    
    const data = loadData();
    
    // Créer la catégorie
    const newCategory = {
        id: Date.now().toString(),
        name: name,
        color: color
    };
    
    data.categories.push(newCategory);
    saveData(data);
    
    // Mettre à jour les affichages
    if (window.renderCategories) {
        window.renderCategories();
    }
    
    // Notifier les autres modules
    if (window.onCategoryUpdated) {
        window.onCategoryUpdated();
    }
    
    // Si on vient du formulaire de transaction, sélectionner la nouvelle catégorie
    if (categoryModalCallback) {
        closeCategoryModal();
        setTimeout(() => {
            const categorySelect = document.getElementById('transaction-category');
            if (categorySelect) {
                if (window.populateCategorySelect) {
                    window.populateCategorySelect();
                }
                categorySelect.value = newCategory.id;
                // Mettre à jour la couleur du select après sélection
                if (window.updateCategoryColorIndicator) {
                    window.updateCategoryColorIndicator();
                } else {
                    // Fallback : déclencher l'événement change pour que l'event listener existant mette à jour la couleur
                    categorySelect.dispatchEvent(new Event('change'));
                }
            }
            if (categoryModalCallback) {
                categoryModalCallback(newCategory.id);
                categoryModalCallback = null;
            }
        }, 100);
    } else {
        closeCategoryModal();
    }
}

// Exporter pour utilisation globale
window.openCategoryModal = openCategoryModal;

