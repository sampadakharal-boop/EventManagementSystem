document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('createEventForm');
  const eventTypeSelect = document.querySelector('select[name="eventType"]');
  const priceInput = document.querySelector('input[name="price"]');

  // Disable price field when event is free
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

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = form.querySelector('[name="name"]').value.trim();
      const category = form.querySelector('[name="category"]').value;
      const startDate = form.querySelector('[name="startDate"]').value;

      if (!name || !category || !startDate) {
        alert('Please fill in all required fields.');
        return;
      }

      // TODO: connect to your backend event-creation API here
      alert('Event created! (connect this to your backend API)');
      form.reset();
    });
  }
});