document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('createEventForm');
    const eventTypeSelect = document.querySelector('select[name="eventType"]');
    const priceInput = document.querySelector('input[name="price"]');

    function togglePriceField() {
        if (!eventTypeSelect || !priceInput) return;

        if (eventTypeSelect.value === 'free') {
            priceInput.value = 0;
            priceInput.disabled = true;
        } else {
            priceInput.disabled = false;
        }
    }

    if (eventTypeSelect) {
        eventTypeSelect.addEventListener('change', togglePriceField);
        togglePriceField();
    }

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);

        const eventData = {
            name: formData.get('name')?.trim(),
            description: formData.get('description')?.trim(),
            category: formData.get('category'),
            organizer: formData.get('organizer')?.trim(),
            startDate: formData.get('startDate'),
            startTime: formData.get('startTime'),
            endDate: formData.get('endDate'),
            endTime: formData.get('endTime'),
            venue: formData.get('venue')?.trim(),
            city: formData.get('city')?.trim(),
            address: formData.get('address')?.trim(),
            capacity: formData.get('capacity'),
            deadline: formData.get('deadline'),
            eventType: formData.get('eventType'),
            price: formData.get('price') || 0,
            contactEmail: formData.get('contactEmail')?.trim(),
            website: formData.get('website')?.trim(),
            tags: formData.get('tags')?.trim()
        };

        if (
            !eventData.name ||
            !eventData.description ||
            !eventData.category ||
            !eventData.startDate ||
            !eventData.startTime ||
            !eventData.venue ||
            !eventData.city
        ) {
            alert('Please fill in all required fields.');
            return;
        }

        const publishButton = form.querySelector('.btn-primary');

        if (publishButton) {
            publishButton.disabled = true;
            publishButton.textContent = 'Publishing...';
        }

        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(eventData)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to create event.');
            }

            alert('Event published successfully!');

            form.reset();

            if (eventTypeSelect) {
                eventTypeSelect.value = 'free';
            }

            togglePriceField();

        } catch (error) {
            console.error('Create event error:', error);
            alert(error.message || 'Could not publish the event.');
        } finally {
            if (publishButton) {
                publishButton.disabled = false;
                publishButton.textContent = 'Publish Event';
            }
        }
    });
});