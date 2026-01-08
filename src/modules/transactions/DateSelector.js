/**
 * Composant de sélection de date personnalisé
 */

/**
 * Initialise un sélecteur de date personnalisé
 * @param {string} prefix - Préfixe des IDs (ex: "transaction-date" ou "edit-transaction-date")
 * @param {boolean} allowClear - Si true, ajoute un bouton pour effacer la date (par défaut: false)
 */
export function initDateSelector(prefix, allowClear = false) {
    const button = document.getElementById(`${prefix}-btn`);
    const dropdown = document.getElementById(`${prefix}-dropdown`);
    const textEl = document.getElementById(`${prefix}-text`);
    const hiddenInput = document.getElementById(prefix);
    const calendarEl = document.getElementById(`${prefix}-calendar`);
    const monthEl = document.getElementById(`${prefix}-month`);
    const yearEl = document.getElementById(`${prefix}-year`);
    const prevBtn = document.getElementById(`${prefix}-prev-month`);
    const nextBtn = document.getElementById(`${prefix}-next-month`);
    
    if (!button || !dropdown || !hiddenInput || !calendarEl) return;
    
    // Toujours commencer avec la date d'aujourd'hui pour le calendrier
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentDate = new Date(today); // Le calendrier commence toujours à aujourd'hui
    let selectedDate = null;
    
    // Initialiser selectedDate : utiliser la valeur existante ou la date d'aujourd'hui par défaut
    if (hiddenInput.value) {
        selectedDate = new Date(hiddenInput.value + 'T00:00:00');
    } else {
        // Par défaut, sélectionner la date d'aujourd'hui
        selectedDate = new Date(today);
        hiddenInput.value = today.toISOString().split('T')[0];
    }
    
    updateDisplay();
    renderCalendar();
    
    // Ouvrir/fermer le menu
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
    });
    
    // Navigation des mois
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }
    
    // Fermer si on clique en dehors
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !button.contains(e.target)) {
            closeDropdown();
        }
    });
    
    function toggleDropdown() {
        if (dropdown.classList.contains('show')) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }
    
    function openDropdown() {
        // Le calendrier commence toujours à la date d'aujourd'hui
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        currentDate = new Date(today);
        renderCalendar();
        
        // Calculer la position du dropdown en position fixed
        const buttonRect = button.getBoundingClientRect();
        dropdown.style.top = `${buttonRect.bottom + 4}px`;
        dropdown.style.left = `${buttonRect.left}px`;
        
        button.classList.add('active');
        dropdown.classList.add('show');
    }
    
    function closeDropdown() {
        button.classList.remove('active');
        dropdown.classList.remove('show');
    }
    
    function updateDisplay() {
        if (textEl) {
            // Vérifier si une date est sélectionnée
            if (!selectedDate || isNaN(selectedDate.getTime()) || !hiddenInput.value) {
                textEl.textContent = 'Aucune date';
                return;
            }
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selDate = new Date(selectedDate);
            selDate.setHours(0, 0, 0, 0);
            
            if (selDate.getTime() === today.getTime()) {
                textEl.textContent = "Aujourd'hui";
            } else {
                const monthNames = [
                    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
                ];
                const day = selectedDate.getDate();
                const month = monthNames[selectedDate.getMonth()];
                const year = selectedDate.getFullYear();
                textEl.textContent = `${day} ${month} ${year}`;
            }
        }
    }
    
    function renderCalendar() {
        if (!calendarEl) return;
        
        const monthNames = [
            'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
            'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
        ];
        
        // Mettre à jour le header
        if (monthEl) monthEl.textContent = monthNames[currentDate.getMonth()];
        if (yearEl) yearEl.textContent = currentDate.getFullYear();
        
        // Créer le calendrier
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Ajuster pour que lundi = 0
        const adjustedStartingDay = (startingDayOfWeek + 6) % 7;
        
        const weekdays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
        
        calendarEl.innerHTML = '';
        
        // Ajouter les jours de la semaine
        weekdays.forEach(day => {
            const weekdayEl = document.createElement('div');
            weekdayEl.className = 'date-selector-weekday';
            weekdayEl.textContent = day;
            calendarEl.appendChild(weekdayEl);
        });
        
        // Ajouter les jours vides du début
        for (let i = 0; i < adjustedStartingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'date-selector-day other-month';
            calendarEl.appendChild(emptyDay);
        }
        
        // Ajouter les jours du mois
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayEl = document.createElement('button');
            dayEl.type = 'button';
            dayEl.className = 'date-selector-day';
            dayEl.textContent = day;
            
            // Vérifier si c'est aujourd'hui
            const dateOnly = new Date(date);
            dateOnly.setHours(0, 0, 0, 0);
            if (dateOnly.getTime() === today.getTime()) {
                dayEl.classList.add('today');
            }
            
            // Vérifier si c'est la date sélectionnée
            const selectedDateOnly = new Date(selectedDate);
            selectedDateOnly.setHours(0, 0, 0, 0);
            if (dateOnly.getTime() === selectedDateOnly.getTime()) {
                dayEl.classList.add('selected');
            }
            
            // Gérer la sélection
            dayEl.addEventListener('click', (e) => {
                e.stopPropagation();
                selectDate(date);
            });
            
            calendarEl.appendChild(dayEl);
        }
        
        // Ajouter les jours vides de la fin pour compléter la grille
        const totalCells = adjustedStartingDay + daysInMonth;
        const remainingCells = 42 - totalCells; // 6 semaines * 7 jours
        for (let i = 0; i < remainingCells && totalCells + i < 42; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'date-selector-day other-month';
            calendarEl.appendChild(emptyDay);
        }
    }
    
    function selectDate(date) {
        selectedDate = new Date(date);
        hiddenInput.value = date.toISOString().split('T')[0];
        updateDisplay();
        closeDropdown();
        renderCalendar();
        
        // Déclencher un événement change pour compatibilité
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Ajouter un bouton pour effacer la date (seulement si allowClear est true)
    if (allowClear && dropdown) {
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'date-selector-clear';
        clearBtn.textContent = 'Effacer';
        clearBtn.style.cssText = 'margin-top: var(--spacing-sm); padding: var(--spacing-xs) var(--spacing-sm); font-size: 12px; background: transparent; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary); cursor: pointer; width: 100%; transition: all var(--transition-base);';
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedDate = null;
            hiddenInput.value = '';
            updateDisplay();
            closeDropdown();
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
        });
        clearBtn.addEventListener('mouseenter', () => {
            clearBtn.style.background = 'var(--primary-light)';
            clearBtn.style.borderColor = 'var(--primary)';
            clearBtn.style.color = 'var(--primary-dark)';
        });
        clearBtn.addEventListener('mouseleave', () => {
            clearBtn.style.background = 'transparent';
            clearBtn.style.borderColor = 'var(--border)';
            clearBtn.style.color = 'var(--text-secondary)';
        });
        dropdown.appendChild(clearBtn);
    }
    
    // Exposer une méthode pour définir la date programmatiquement
    return {
        setDate: (date) => {
            if (!date || date === '') {
                // Réinitialiser à aucune date
                selectedDate = null;
                hiddenInput.value = '';
                // Le calendrier reste à la date d'aujourd'hui
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                currentDate = new Date(today);
                updateDisplay();
                renderCalendar();
            } else {
                selectedDate = new Date(date + 'T00:00:00');
                currentDate = new Date(selectedDate);
                hiddenInput.value = date;
                updateDisplay();
                renderCalendar();
            }
        },
        getDate: () => selectedDate,
        clearDate: () => {
            selectedDate = null;
            hiddenInput.value = '';
            // Le calendrier reste à la date d'aujourd'hui
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            currentDate = new Date(today);
            updateDisplay();
            renderCalendar();
        }
    };
}

