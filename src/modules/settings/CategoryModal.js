import { loadData, saveData } from '../shared/index.js';

// Variable pour le callback après création de catégorie
let categoryModalCallback = null;
// Variable pour stocker le type de catégorie à créer
let categoryModalType = 'transaction';

// Palettes de couleurs prédéfinies
const COLOR_PALETTES = {
    pastel: [
        '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9',
        '#BAE1FF', '#E0BBE4', '#FEC8C1', '#FFD9B3',
        '#FFF4BD', '#C7F5D9', '#B8E6F5', '#F5D5E8'
    ],
    light: [
        '#FF6B6B', '#FFA07A', '#FFD93D', '#6BCB77',
        '#4ECDC4', '#45B7D1', '#A29BFE', '#FD79A8',
        '#FDCB6E', '#55EFC4', '#74B9FF', '#A29BFE'
    ],
    dark: [
        '#C92A2A', '#D9480F', '#F59F00', '#2B8A3E',
        '#087F5B', '#0C8599', '#5F3DC4', '#C2255C',
        '#E67700', '#099268', '#1971C2', '#862E9C'
    ]
};

/**
 * Génère les palettes de couleurs
 */
function generateColorPalettes() {
    Object.keys(COLOR_PALETTES).forEach(paletteType => {
        const paletteContainer = document.getElementById(`palette-${paletteType}`);
        if (!paletteContainer) return;
        
        paletteContainer.innerHTML = '';
        
        COLOR_PALETTES[paletteType].forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.setAttribute('data-color', color);
            swatch.setAttribute('title', color);
            
            swatch.addEventListener('click', () => {
                selectColor(color);
            });
            
            paletteContainer.appendChild(swatch);
        });
    });
}

/**
 * Sélectionne une couleur
 */
function selectColor(color) {
    const colorInput = document.getElementById('category-modal-color');
    const colorPreview = document.getElementById('category-modal-color-preview');
    
    if (colorInput) colorInput.value = color;
    if (colorPreview) colorPreview.style.backgroundColor = color;
    
    // Mettre à jour la sélection visuelle dans toutes les palettes
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.classList.remove('selected');
        if (swatch.getAttribute('data-color') === color) {
            swatch.classList.add('selected');
        }
    });
}

/**
 * Initialise le système d'onglets
 */
function initColorTabs() {
    const tabs = document.querySelectorAll('.color-tab');
    const panels = document.querySelectorAll('.color-tab-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Désactiver tous les onglets et panneaux
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            // Activer l'onglet et le panneau sélectionnés
            tab.classList.add('active');
            const targetPanel = document.getElementById(`color-panel-${targetTab}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

/**
 * Crée dynamiquement la structure des onglets de couleur si elle n'existe pas
 */
function ensureColorPickerTabsStructure() {
    const modal = document.getElementById('category-modal');
    if (!modal) return;
    
    const colorGroup = modal.querySelector('.form-group:has(label[for="category-modal-color"])');
    if (!colorGroup) return;
    
    // Vérifier si la structure des onglets existe déjà
    if (colorGroup.querySelector('.color-picker-tabs')) {
        return; // Structure déjà présente
    }
    
    // Récupérer l'input de couleur existant
    const existingColorInput = colorGroup.querySelector('#category-modal-color');
    const existingColorPreview = colorGroup.querySelector('#category-modal-color-preview');
    const existingValue = existingColorInput ? existingColorInput.value : '#3b82f6';
    
    // Créer la nouvelle structure
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'color-picker-tabs';
    
    // Créer l'en-tête des onglets
    const tabsHeader = document.createElement('div');
    tabsHeader.className = 'color-tabs-header';
    
    const tabs = [
        { id: 'pastel', label: 'Pastel', active: true },
        { id: 'light', label: 'Clair', active: false },
        { id: 'dark', label: 'Foncé', active: false }
    ];
    
    tabs.forEach(tab => {
        const tabButton = document.createElement('button');
        tabButton.type = 'button';
        tabButton.className = `color-tab ${tab.active ? 'active' : ''}`;
        tabButton.setAttribute('data-tab', tab.id);
        tabButton.textContent = tab.label;
        tabsHeader.appendChild(tabButton);
    });
    
    // Créer le contenu des onglets
    const tabsContent = document.createElement('div');
    tabsContent.className = 'color-tabs-content';
    
    // Créer les panneaux pour chaque palette
    ['pastel', 'light', 'dark'].forEach(paletteType => {
        const panel = document.createElement('div');
        panel.className = `color-tab-panel ${paletteType === 'pastel' ? 'active' : ''}`;
        panel.id = `color-panel-${paletteType}`;
        
        const palette = document.createElement('div');
        palette.className = 'color-palette';
        palette.id = `palette-${paletteType}`;
        
        panel.appendChild(palette);
        tabsContent.appendChild(panel);
    });
    
    // Créer le sélecteur personnalisé (toujours visible)
    const customContainer = document.createElement('div');
    customContainer.className = 'color-picker-container';
    customContainer.style.marginTop = '16px';
    customContainer.style.paddingTop = '16px';
    customContainer.style.borderTop = '1px solid var(--border)';
    
    const customLabel = document.createElement('label');
    customLabel.textContent = 'Sélectionner une couleur personnalisée';
    customLabel.style.display = 'block';
    customLabel.style.marginBottom = '8px';
    customLabel.style.fontSize = '14px';
    customLabel.style.color = 'var(--text-secondary)';
    
    const colorInputWrapper = document.createElement('div');
    colorInputWrapper.style.display = 'flex';
    colorInputWrapper.style.alignItems = 'center';
    colorInputWrapper.style.gap = '12px';
    
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.id = 'category-modal-color';
    colorInput.value = existingValue;
    
    const colorPreview = document.createElement('span');
    colorPreview.className = 'color-preview';
    colorPreview.id = 'category-modal-color-preview';
    colorPreview.style.backgroundColor = existingValue;
    
    colorInputWrapper.appendChild(colorInput);
    colorInputWrapper.appendChild(colorPreview);
    
    customContainer.appendChild(customLabel);
    customContainer.appendChild(colorInputWrapper);
    
    // Assembler la structure
    tabsContainer.appendChild(tabsHeader);
    tabsContainer.appendChild(tabsContent);
    tabsContainer.appendChild(customContainer);
    
    // Remplacer l'ancien contenu
    const label = colorGroup.querySelector('label[for="category-modal-color"]');
    const labelClone = label ? label.cloneNode(true) : null;
    colorGroup.innerHTML = '';
    if (labelClone) colorGroup.appendChild(labelClone);
    colorGroup.appendChild(tabsContainer);
}

/**
 * Initialise le modal de création de catégorie
 */
export function initCategoryModal() {
    const modal = document.getElementById('category-modal');
    const closeBtn = document.getElementById('category-modal-close');
    const cancelBtn = document.getElementById('category-modal-cancel');
    const form = document.getElementById('category-modal-form');
    
    if (!modal) return;
    
    // S'assurer que la structure des onglets existe
    ensureColorPickerTabsStructure();
    
    const colorInput = document.getElementById('category-modal-color');
    const colorPreview = document.getElementById('category-modal-color-preview');
    
    // Générer les palettes de couleurs
    generateColorPalettes();
    
    // Initialiser le système d'onglets
    initColorTabs();
    
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
    
    // Mise à jour de l'aperçu de couleur (pour le sélecteur personnalisé)
    if (colorInput && colorPreview) {
        colorInput.addEventListener('input', (e) => {
            colorPreview.style.backgroundColor = e.target.value;
            // Désélectionner les swatches quand on utilise le sélecteur personnalisé
            document.querySelectorAll('.color-swatch').forEach(swatch => {
                swatch.classList.remove('selected');
            });
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
 * @param {String} type - Type de catégorie ('transaction' ou 'savings')
 */
export function openCategoryModal(callback = null, type = 'transaction') {
    const modal = document.getElementById('category-modal');
    const nameInput = document.getElementById('category-modal-name');
    const colorInput = document.getElementById('category-modal-color');
    const colorPreview = document.getElementById('category-modal-color-preview');
    const modalTitle = modal.querySelector('.modal-header h2');
    
    if (!modal) return;
    
    categoryModalCallback = callback;
    categoryModalType = type;
    
    // Mettre à jour le titre selon le type
    if (modalTitle) {
        modalTitle.textContent = type === 'savings' 
            ? 'Nouvelle catégorie d\'économie' 
            : 'Nouvelle catégorie';
    }
    
    // Réinitialiser le formulaire
    const form = document.getElementById('category-modal-form');
    if (form) form.reset();
    
    // Réinitialiser la couleur et les onglets
    const defaultColor = '#3b82f6';
    if (colorInput) colorInput.value = defaultColor;
    if (colorPreview) colorPreview.style.backgroundColor = defaultColor;
    
    // Réinitialiser les onglets (activer "Pastel" par défaut)
    const tabs = modal.querySelectorAll('.color-tab');
    const panels = modal.querySelectorAll('.color-tab-panel');
    
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    
    const pastelTab = modal.querySelector('.color-tab[data-tab="pastel"]');
    const pastelPanel = modal.querySelector('#color-panel-pastel');
    
    if (pastelTab) pastelTab.classList.add('active');
    if (pastelPanel) pastelPanel.classList.add('active');
    
    // Le sélecteur personnalisé est toujours visible, pas besoin de le gérer
    
    // Désélectionner tous les swatches
    const swatches = modal.querySelectorAll('.color-swatch');
    
    swatches.forEach(swatch => {
        swatch.classList.remove('selected');
    });
    
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
        categoryModalType = 'transaction';
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
    
    // Créer la catégorie avec le type approprié
    const newCategory = {
        id: Date.now().toString(),
        name: name,
        color: color,
        type: categoryModalType
    };
    
    data.categories.push(newCategory);
    saveData(data);
    
    // Mettre à jour les affichages selon le type
    if (categoryModalType === 'savings') {
        if (window.renderSavingsCategories) {
            window.renderSavingsCategories();
        }
        if (window.renderGoals) {
            window.renderGoals();
        }
    } else {
        if (window.renderCategories) {
            window.renderCategories();
        }
    }
    
    // Notifier les autres modules
    if (window.onCategoryUpdated) {
        window.onCategoryUpdated();
    }
    
    // Gérer le callback selon le contexte
    if (categoryModalCallback) {
        closeCategoryModal();
        setTimeout(() => {
            // Si c'est une catégorie de transaction, mettre à jour le select
            if (categoryModalType === 'transaction') {
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
            }
            
            // Appeler le callback
            if (categoryModalCallback) {
                categoryModalCallback(newCategory.id);
                categoryModalCallback = null;
            }
        }, 100);
    } else {
        closeCategoryModal();
    }
    
    // Réinitialiser le type
    categoryModalType = 'transaction';
}

// Exporter pour utilisation globale
window.openCategoryModal = openCategoryModal;

