document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('eventsTableBody');
    const searchInput = document.getElementById('eventSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');

    let allEvents = [];

    async function loadEvents() {
        try {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:30px;">
                        Loading events...
                    </td>
                </tr>
            `;

            const response = await fetch('/api/admin/events', {
                method: 'GET',
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to load events.');
            }

            allEvents = data.events || [];

            populateCategoryFilter();
            renderEvents();

        } catch (error) {
            console.error('LOAD EVENTS ERROR:', error);

            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:30px; color:#DC2626;">
                        Failed to load events.
                    </td>
                </tr>
            `;
        }
    }

    function populateCategoryFilter() {
        const categories = [
            ...new Set(
                allEvents
                    .map(event => event.category)
                    .filter(Boolean)
            )
        ];

        categoryFilter.innerHTML = `
            <option value="">All Categories</option>
        `;

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    function renderEvents() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedCategory = categoryFilter.value;
        const selectedStatus = statusFilter.value;
        const selectedDate = dateFilter.value;

        const filteredEvents = allEvents.filter(event => {
            const matchesSearch =
                !searchTerm ||
                String(event.title || '').toLowerCase().includes(searchTerm) ||
                String(event.description || '').toLowerCase().includes(searchTerm) ||
                String(event.city || '').toLowerCase().includes(searchTerm) ||
                String(event.venue || '').toLowerCase().includes(searchTerm);

            const matchesCategory =
                !selectedCategory ||
                event.category === selectedCategory;

            const matchesStatus =
                !selectedStatus ||
                getEventStatus(event) === selectedStatus;

            const matchesDate =
                !selectedDate ||
                event.event_date === selectedDate;

            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus &&
                matchesDate
            );
        });

        tableBody.innerHTML = '';

        if (filteredEvents.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:30px;">
                        No events found.
                    </td>
                </tr>
            `;
            return;
        }

        filteredEvents.forEach(event => {
            const row = document.createElement('tr');

            const status = getEventStatus(event);
            const statusLabel = capitalize(status);
            const formattedDate = formatDate(event.event_date);
            const registrations = event.registrations || 0;

            row.innerHTML = `
                <td>
                    <strong>
                        ${escapeHTML(event.title || 'Untitled Event')}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(event.category || 'Uncategorized')}
                </td>

                <td>
                    ${formattedDate}
                </td>

                <td>
                    ${escapeHTML(event.city || event.venue || '-')}
                </td>

                <td>
                    ${registrations}
                </td>

                <td>
                    <span class="status-badge ${status}">
                        ${statusLabel}
                    </span>
                </td>

                <td>
                    <button
                        class="action-btn manage-event"
                        data-id="${event.id}"
                        type="button"
                    >
                        Manage
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });

        document.querySelectorAll('.manage-event').forEach(button => {
            button.addEventListener('click', () => {
                const eventId = button.dataset.id;

                window.location.href =
                    `manage-event.html?id=${encodeURIComponent(eventId)}`;
            });
        });
    }

    function getEventStatus(event) {
        if (event.status === 'cancelled') {
            return 'cancelled';
        }

        if (!event.event_date) {
            return 'active';
        }

        const today = new Date();
        const eventDate = new Date(event.event_date);

        today.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);

        if (eventDate < today) {
            return 'completed';
        }

        if (eventDate.getTime() === today.getTime()) {
            return 'active';
        }

        return 'upcoming';
    }

    function formatDate(dateString) {
        if (!dateString) {
            return '-';
        }

        const date = new Date(dateString + 'T00:00:00');

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function capitalize(text) {
        if (!text) {
            return '';
        }

        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    searchInput.addEventListener('input', renderEvents);
    categoryFilter.addEventListener('change', renderEvents);
    statusFilter.addEventListener('change', renderEvents);
    dateFilter.addEventListener('change', renderEvents);

    loadEvents();
});