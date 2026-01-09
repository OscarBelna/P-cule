/**
 * Formate un montant en devise
 * @param {number} amount - Le montant à formater
 * @returns {string} Le montant formaté
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Échappe le HTML pour éviter les injections XSS
 * @param {string} text - Le texte à échapper
 * @returns {string} Le texte échappé
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Formate une date en format YYYY-MM-DD en utilisant le fuseau horaire local
 * @param {Date} date - La date à formater
 * @returns {string} La date formatée en YYYY-MM-DD
 */
export function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Crée une date à partir d'une chaîne YYYY-MM-DD en utilisant le fuseau horaire local
 * @param {string} dateString - La date au format YYYY-MM-DD
 * @returns {Date} La date créée
 */
export function parseDateLocal(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
}

