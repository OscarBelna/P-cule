import { loadData } from './StorageService.js';

/**
 * Remplit un select de catégories de manière générique
 * @param {string} selectId - L'ID de l'élément select à remplir
 * @param {Function} onUpdateCallback - Callback optionnel appelé après la mise à jour
 */
export function populateCategorySelect(selectId, onUpdateCallback = null) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const data = loadData();
    const currentValue = select.value; // Sauvegarder la valeur actuelle
    
    select.innerHTML = '';
    
    // Ajouter les catégories
    data.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        // Ajouter le rond de couleur dans la liste déroulante
        option.textContent = `⬤ ${category.name}`;
        // Stocker le nom sans le rond pour l'affichage sélectionné
        option.dataset.name = category.name;
        // Colorer le texte de l'option avec la couleur de la catégorie
        option.style.color = category.color;
        select.appendChild(option);
    });
    
    // Restaurer la valeur sélectionnée ou ajouter le placeholder si aucune catégorie n'est sélectionnée
    if (currentValue && data.categories.find(cat => cat.id === currentValue)) {
        select.value = currentValue;
    } else {
        // Ajouter l'option placeholder seulement quand aucune catégorie n'est sélectionnée
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = 'Sélectionnez une catégorie';
        placeholderOption.disabled = true;
        placeholderOption.hidden = true;
        select.insertBefore(placeholderOption, select.firstChild);
        select.value = '';
        select.selectedIndex = 0; // Sélectionner le placeholder
    }
    
    // Appeler le callback si fourni
    if (onUpdateCallback) {
        onUpdateCallback();
    }
}

