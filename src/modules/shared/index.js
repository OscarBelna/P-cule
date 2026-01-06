// Interface publique du module Shared
export { loadData, saveData, defaultData, STORAGE_KEY } from './StorageService.js';
export { formatCurrency, escapeHtml } from './Formatters.js';
export { getAllTransactions } from './TransactionService.js';
export { populateCategorySelect } from './CategoryService.js';

