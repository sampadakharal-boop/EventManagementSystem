document.addEventListener('DOMContentLoaded', loadEvents);

async function loadEvents() {
    const grid = document.getElementById('eventsGrid');
    if (!grid) return;

    try {
        const res = await fetch('/api/events');
        const data = await res.json();

        if (!data.success || !data.events.length) {
            grid.innerHTML = '<p>No events found.</p>';
            return;
        }

        grid.innerHTML = data.events.map(createEventCardHTML).join('');

    } catch (err) {
        console.error('Failed to load events:', err);
        grid.innerHTML = '<p>Could not load events.</p>';
    }
}

function createEventCardHTML(event) {
    const dateStr = new Date(event.event_date).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
    });

    const isFree = event.event_type === 'free' || Number(event.price) === 0;
    const badgeClass = isFree ? 'featured' : 'paid';
    const badgeText = isFree ? 'Featured' : 'Paid';
    const priceHTML = isFree
        ? `<span class="price">FREE</span>`
        : `<span class="price paid-price">Rs.${event.price}</span>`;

    return `
    <div class="event-card">
        <div class="event-image">
            <img src="${event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900'}" alt="${event.title}">
            <span class="badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="event-content">
            <h3>${event.title}</h3>
            <div class="event-info">
                <span><i class="fa-solid fa-calendar"></i> ${dateStr}</span>
                <span><i class="fa-solid fa-location-dot"></i> ${event.city}</span>
            </div>
            <p>${event.description}</p>
            <div class="event-footer">
                ${priceHTML}
                <a href="event-registration.html" class="register-btn">Register Now</a>
            </div>
        </div>
    </div>`;
}