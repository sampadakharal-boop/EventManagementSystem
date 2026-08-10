document.addEventListener('DOMContentLoaded', () => {
  const cells = document.querySelectorAll('.calendar-cell:not(.empty)');
  const modal = document.getElementById('eventModal');
  const modalTitle = document.getElementById('eventModalTitle');
  const modalBody = document.getElementById('eventModalBody');
  const modalClose = document.getElementById('eventModalClose');

  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      const day = cell.textContent.trim();
      if (modal) {
        modalTitle.textContent = `August ${day}, 2026`;
        modalBody.textContent = cell.querySelector('.calendar-dot')
          ? 'This day has an event scheduled.'
          : 'No events on this day.';
        modal.classList.add('active');
      }
    });
  });

  if (modalClose) {
    modalClose.addEventListener('click', () => modal.classList.remove('active'));
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }
});