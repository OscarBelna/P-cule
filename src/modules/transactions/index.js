// Interface publique du module Transactions
export { initTransactionForm } from './TransactionController.js';
export { renderTransactions, populateCategorySelect, updateCategoryColorIndicator } from './TransactionRenderer.js';
export { initRecurrenceModal } from './RecurrenceController.js';
export { initTransactionFilters } from './TransactionFiltersController.js';
export { getAllTransactions } from '../shared/index.js';

