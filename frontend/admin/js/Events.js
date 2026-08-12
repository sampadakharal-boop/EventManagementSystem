document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('eventsTableBody');
    const searchInput = document.getElementById('eventSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');

    let allEvents = [];
    let selectedEvent = null;

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
        const searchTerm =
            searchInput.value
                .trim()
                .toLowerCase();

        const selectedCategory =
            categoryFilter.value;

        const selectedStatus =
            statusFilter.value;

        const selectedDate =
            dateFilter.value;

        const filteredEvents = allEvents.filter(event => {
            const matchesSearch =
                !searchTerm ||
                String(event.title || '')
                    .toLowerCase()
                    .includes(searchTerm) ||
                String(event.description || '')
                    .toLowerCase()
                    .includes(searchTerm) ||
                String(event.city || '')
                    .toLowerCase()
                    .includes(searchTerm) ||
                String(event.venue || '')
                    .toLowerCase()
                    .includes(searchTerm);

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

            const status =
                getEventStatus(event);

            const statusLabel =
                capitalize(status);

            const formattedDate =
                formatDate(event.event_date);

            const registrations =
                event.registrations || 0;

            row.innerHTML = `
                <td>
                    <strong>
                        ${escapeHTML(
                            event.title || 'Untitled Event'
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(
                        event.category || 'Uncategorized'
                    )}
                </td>

                <td>
                    ${formattedDate}
                </td>

                <td>
                    ${escapeHTML(
                        event.city ||
                        event.venue ||
                        '-'
                    )}
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

        document
            .querySelectorAll('.manage-event')
            .forEach(button => {
                button.addEventListener('click', () => {
                    const eventId =
                        Number(button.dataset.id);

                    openManageModal(eventId);
                });
            });
    }

    function openManageModal(eventId) {
        selectedEvent =
            allEvents.find(
                event => Number(event.id) === eventId
            );

        if (!selectedEvent) {
            alert('Event not found.');
            return;
        }

        let modal =
            document.getElementById('manageEventModal');

        if (!modal) {
            createManageModal();
            modal =
                document.getElementById('manageEventModal');
        }

        fillManageModal(selectedEvent);

        modal.classList.add('show');

        document.body.style.overflow = 'hidden';
    }

    function createManageModal() {
        const modal =
            document.createElement('div');

        modal.id = 'manageEventModal';

        modal.innerHTML = `
            <div class="manage-modal-overlay" id="manageModalOverlay"></div>

            <div class="manage-modal">

                <div class="manage-modal-header">

                    <div>
                        <span class="manage-modal-label">
                            EVENT MANAGEMENT
                        </span>

                        <h2 id="manageModalTitle">
                            Manage Event
                        </h2>
                    </div>

                    <button
                        type="button"
                        id="closeManageModal"
                        class="manage-close"
                    >
                        ×
                    </button>

                </div>

                <form id="manageEventForm">

                    <div class="manage-form-grid">

                        <div class="manage-form-group">
                            <label>Event Name</label>
                            <input
                                type="text"
                                id="manageName"
                                required
                            >
                        </div>

                        <div class="manage-form-group">
                            <label>Category</label>
                            <input
                                type="text"
                                id="manageCategory"
                                required
                            >
                        </div>

                        <div class="manage-form-group manage-full">
                            <label>Description</label>
                            <textarea
                                id="manageDescription"
                                rows="4"
                                required
                            ></textarea>
                        </div>

                        <div class="manage-form-group">
                            <label>Organizer</label>
                            <input
                                type="text"
                                id="manageOrganizer"
                            >
                        </div>

                        <div class="manage-form-group">
                            <label>Venue</label>
                            <input
                                type="text"
                                id="manageVenue"
                                required
                            >
                        </div>

                        <div class="manage-form-group">
                            <label>City</label>
                            <input
                                type="text"
                                id="manageCity"
                                required
                            >
                        </div>

                        <div class="manage-form-group">
                            <label>Address</label>
                            <input
                                type="text"
                                id="manageAddress"
                            >
                        </div>

                        <div class="manage-form-group">
                            <label>Start Date</label>
                            <input
                                type="date"
                                id="manageStartDate"
                                required
                            >
                        </div>

                        <div class="manage-form-group">
                            <label>Start Time</label>
                            <input
                                type="time"
                                id="manageStartTime"
                                required
                            >
                        </div>

                        <div class="manage-form-group">
                            <label>End Date</label>
                            <input
                                type="date"
                                id="manageEndDate"
                            >
                        </div>

                        <div class="manage-form-group">
                            <label>End Time</label>
                            <input
                                type="time"
                                id="manageEndTime"
                            >
                        </div>

                        <div class="manage-form-group">
                            <label>Capacity</label>
                            <input
                                type="number"
                                id="manageCapacity"
                                min="0"
                            >
                        </div>

                        <div class="manage-form-group">
                            <label>Event Type</label>

                            <select id="manageEventType">
                                <option value="free">
                                    Free
                                </option>

                                <option value="paid">
                                    Paid
                                </option>
                            </select>
                        </div>

                        <div class="manage-form-group">
                            <label>Price</label>
                            <input
                                type="number"
                                id="managePrice"
                                min="0"
                            >
                        </div>

                        <div class="manage-form-group">
                            <label>Registration Deadline</label>
                            <input
                                type="date"
                                id="manageDeadline"
                            >
                        </div>

                        <div class="manage-form-group">
                            <label>Contact Email</label>
                            <input
                                type="email"
                                id="manageContactEmail"
                            >
                        </div>

                        <div class="manage-form-group">
                            <label>Website</label>
                            <input
                                type="url"
                                id="manageWebsite"
                            >
                        </div>

                        <div class="manage-form-group">
                            <label>Tags</label>
                            <input
                                type="text"
                                id="manageTags"
                            >
                        </div>

                        <div class="manage-form-group">
                            <label>Status</label>

                            <select id="manageStatus">
                                <option value="active">
                                    Active
                                </option>

                                <option value="cancelled">
                                    Cancelled
                                </option>
                            </select>
                        </div>

                    </div>

                    <div
                        id="manageMessage"
                        class="manage-message"
                    ></div>

                    <div class="manage-modal-footer">

                        <button
                            type="button"
                            id="deleteEventBtn"
                            class="delete-event-btn"
                        >
                            Delete Event
                        </button>

                        <div class="manage-footer-right">

                            <button
                                type="button"
                                id="cancelManageBtn"
                                class="cancel-manage-btn"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                class="save-event-btn"
                            >
                                Save Changes
                            </button>

                        </div>

                    </div>

                </form>

            </div>
        `;

        document.body.appendChild(modal);

        addModalStyles();

        document
            .getElementById('closeManageModal')
            .addEventListener(
                'click',
                closeManageModal
            );

        document
            .getElementById('cancelManageBtn')
            .addEventListener(
                'click',
                closeManageModal
            );

        document
            .getElementById('manageModalOverlay')
            .addEventListener(
                'click',
                closeManageModal
            );

        document
            .getElementById('manageEventForm')
            .addEventListener(
                'submit',
                updateEvent
            );

        document
            .getElementById('deleteEventBtn')
            .addEventListener(
                'click',
                deleteEvent
            );
    }

    function fillManageModal(event) {
        document.getElementById('manageModalTitle').textContent =
            event.title || 'Manage Event';

        document.getElementById('manageName').value =
            event.title || '';

        document.getElementById('manageCategory').value =
            event.category || '';

        document.getElementById('manageDescription').value =
            event.description || '';

        document.getElementById('manageOrganizer').value =
            event.organizer || '';

        document.getElementById('manageVenue').value =
            event.venue || '';

        document.getElementById('manageCity').value =
            event.city || '';

        document.getElementById('manageAddress').value =
            event.address || '';

        document.getElementById('manageStartDate').value =
            event.event_date || '';

        document.getElementById('manageStartTime').value =
            event.event_time || '';

        document.getElementById('manageEndDate').value =
            event.end_date || '';

        document.getElementById('manageEndTime').value =
            event.end_time || '';

        document.getElementById('manageCapacity').value =
            event.capacity || 0;

        document.getElementById('manageEventType').value =
            event.event_type || 'free';

        document.getElementById('managePrice').value =
            event.price || 0;

        document.getElementById('manageDeadline').value =
            event.registration_deadline || '';

        document.getElementById('manageContactEmail').value =
            event.contact_email || '';

        document.getElementById('manageWebsite').value =
            event.website || '';

        document.getElementById('manageTags').value =
            event.tags || '';

        document.getElementById('manageStatus').value =
            event.status === 'cancelled'
                ? 'cancelled'
                : 'active';

        document.getElementById('manageMessage').textContent =
            '';
    }

    async function updateEvent(event) {
        event.preventDefault();

        if (!selectedEvent) {
            return;
        }

        const eventId =
            selectedEvent.id;

        const payload = {
            name:
                document.getElementById('manageName').value.trim(),

            description:
                document.getElementById('manageDescription').value.trim(),

            category:
                document.getElementById('manageCategory').value.trim(),

            organizer:
                document.getElementById('manageOrganizer').value.trim(),

            startDate:
                document.getElementById('manageStartDate').value,

            startTime:
                document.getElementById('manageStartTime').value,

            endDate:
                document.getElementById('manageEndDate').value,

            endTime:
                document.getElementById('manageEndTime').value,

            venue:
                document.getElementById('manageVenue').value.trim(),

            city:
                document.getElementById('manageCity').value.trim(),

            address:
                document.getElementById('manageAddress').value.trim(),

            capacity:
                document.getElementById('manageCapacity').value,

            deadline:
                document.getElementById('manageDeadline').value,

            eventType:
                document.getElementById('manageEventType').value,

            price:
                document.getElementById('managePrice').value,

            contactEmail:
                document.getElementById('manageContactEmail').value.trim(),

            website:
                document.getElementById('manageWebsite').value.trim(),

            tags:
                document.getElementById('manageTags').value.trim(),

            status:
                document.getElementById('manageStatus').value
        };

        const message =
            document.getElementById('manageMessage');

        try {
            message.textContent =
                'Saving changes...';

            const response =
                await fetch(
                    `/api/admin/events/${encodeURIComponent(eventId)}`,
                    {
                        method: 'PUT',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    }
                );

            const data =
                await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    'Failed to update event.'
                );
            }

            message.textContent =
                'Event updated successfully.';

            await loadEvents();

            setTimeout(() => {
                closeManageModal();
            }, 700);

        } catch (error) {
            console.error(
                'UPDATE EVENT ERROR:',
                error
            );

            message.textContent =
                error.message ||
                'Failed to update event.';
        }
    }

    async function deleteEvent() {
        if (!selectedEvent) {
            return;
        }

        const eventId =
            selectedEvent.id;

        const eventName =
            selectedEvent.title ||
            'this event';

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${eventName}"? This action cannot be undone.`
            );

        if (!confirmed) {
            return;
        }

        const message =
            document.getElementById('manageMessage');

        try {
            message.textContent =
                'Deleting event...';

            const response =
                await fetch(
                    `/api/admin/events/${encodeURIComponent(eventId)}`,
                    {
                        method: 'DELETE',
                        credentials: 'include'
                    }
                );

            const data =
                await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    'Failed to delete event.'
                );
            }

            allEvents =
                allEvents.filter(
                    event =>
                        Number(event.id) !==
                        Number(eventId)
                );

            closeManageModal();

            populateCategoryFilter();
            renderEvents();

        } catch (error) {
            console.error(
                'DELETE EVENT ERROR:',
                error
            );

            message.textContent =
                error.message ||
                'Failed to delete event.';
        }
    }

    function closeManageModal() {
        const modal =
            document.getElementById('manageEventModal');

        if (modal) {
            modal.classList.remove('show');
        }

        document.body.style.overflow = '';

        selectedEvent = null;
    }

    function addModalStyles() {
        if (
            document.getElementById(
                'manageEventModalStyles'
            )
        ) {
            return;
        }

        const style =
            document.createElement('style');

        style.id =
            'manageEventModalStyles';

        style.textContent = `
            #manageEventModal {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            #manageEventModal.show {
                display: flex;
            }

            .manage-modal-overlay {
                position: absolute;
                inset: 0;
                background: rgba(15, 23, 42, 0.65);
                backdrop-filter: blur(4px);
            }

            .manage-modal {
                position: relative;
                z-index: 2;
                width: min(1000px, 100%);
                max-height: 92vh;
                overflow-y: auto;
                background: #ffffff;
                border-radius: 18px;
                box-shadow: 0 25px 70px rgba(0, 0, 0, 0.25);
            }

            .manage-modal-header {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 20px;
                padding: 24px 28px;
                border-bottom: 1px solid #e5e7eb;
            }

            .manage-modal-label {
                display: block;
                margin-bottom: 5px;
                color: #6366f1;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 1.5px;
            }

            .manage-modal-header h2 {
                margin: 0;
                color: #111827;
                font-size: 24px;
            }

            .manage-close {
                width: 38px;
                height: 38px;
                border: 0;
                border-radius: 50%;
                background: #f3f4f6;
                color: #374151;
                font-size: 28px;
                line-height: 1;
                cursor: pointer;
            }

            .manage-close:hover {
                background: #e5e7eb;
            }

            .manage-form-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 18px;
                padding: 28px;
            }

            .manage-form-group {
                display: flex;
                flex-direction: column;
                gap: 7px;
            }

            .manage-form-group.manage-full {
                grid-column: 1 / -1;
            }

            .manage-form-group label {
                color: #374151;
                font-size: 13px;
                font-weight: 600;
            }

            .manage-form-group input,
            .manage-form-group textarea,
            .manage-form-group select {
                width: 100%;
                box-sizing: border-box;
                border: 1px solid #d1d5db;
                border-radius: 9px;
                padding: 11px 12px;
                background: #ffffff;
                color: #111827;
                font-family: inherit;
                font-size: 14px;
                outline: none;
            }

            .manage-form-group textarea {
                resize: vertical;
            }

            .manage-form-group input:focus,
            .manage-form-group textarea:focus,
            .manage-form-group select:focus {
                border-color: #6366f1;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
            }

            .manage-message {
                min-height: 20px;
                padding: 0 28px 12px;
                color: #374151;
                font-size: 14px;
                font-weight: 500;
            }

            .manage-modal-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
                padding: 18px 28px;
                border-top: 1px solid #e5e7eb;
                background: #f9fafb;
                border-radius: 0 0 18px 18px;
            }

            .manage-footer-right {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .delete-event-btn,
            .cancel-manage-btn,
            .save-event-btn {
                border: 0;
                border-radius: 9px;
                padding: 11px 18px;
                font-family: inherit;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
            }

            .delete-event-btn {
                background: #fee2e2;
                color: #dc2626;
            }

            .delete-event-btn:hover {
                background: #fecaca;
            }

            .cancel-manage-btn {
                background: #e5e7eb;
                color: #374151;
            }

            .cancel-manage-btn:hover {
                background: #d1d5db;
            }

            .save-event-btn {
                background: #4f46e5;
                color: #ffffff;
            }

            .save-event-btn:hover {
                background: #4338ca;
            }

            @media (max-width: 700px) {
                #manageEventModal {
                    padding: 10px;
                }

                .manage-modal {
                    max-height: 96vh;
                }

                .manage-form-grid {
                    grid-template-columns: 1fr;
                    padding: 20px;
                }

                .manage-form-group.manage-full {
                    grid-column: auto;
                }

                .manage-modal-header {
                    padding: 20px;
                }

                .manage-modal-footer {
                    flex-direction: column;
                    align-items: stretch;
                    padding: 16px 20px;
                }

                .manage-footer-right {
                    justify-content: flex-end;
                }
            }
        `;

        document.head.appendChild(style);
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

        if (
            eventDate.getTime() ===
            today.getTime()
        ) {
            return 'active';
        }

        return 'upcoming';
    }

    function formatDate(dateString) {
        if (!dateString) {
            return '-';
        }

        const date =
            new Date(
                dateString + 'T00:00:00'
            );

        return date.toLocaleDateString(
            'en-US',
            {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }
        );
    }

    function capitalize(text) {
        if (!text) {
            return '';
        }

        return (
            text.charAt(0).toUpperCase() +
            text.slice(1)
        );
    }

    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    if (searchInput) {
        searchInput.addEventListener(
            'input',
            renderEvents
        );
    }

    if (categoryFilter) {
        categoryFilter.addEventListener(
            'change',
            renderEvents
        );
    }

    if (statusFilter) {
        statusFilter.addEventListener(
            'change',
            renderEvents
        );
    }

    if (dateFilter) {
        dateFilter.addEventListener(
            'change',
            renderEvents
        );
    }

    loadEvents();
});