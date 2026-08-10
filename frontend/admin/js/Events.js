document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('.filters-bar input[type="text"]');
  const rows = document.querySelectorAll('tbody tr');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const term = searchInput.value.toLowerCase();
      rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
      });
    });
  }

  // Delete confirmation modal
  const confirmModal = document.getElementById('confirmDeleteModal');
  let rowToDelete = null;

  document.querySelectorAll('.action-btn.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      rowToDelete = e.target.closest('tr');
      if (confirmModal) confirmModal.classList.add('active');
    });
  });

  const cancelDelete = document.getElementById('cancelDelete');
  const confirmDelete = document.getElementById('confirmDelete');

  if (cancelDelete) {
    cancelDelete.addEventListener('click', () => confirmModal.classList.remove('active'));
  }
  if (confirmDelete) {
    confirmDelete.addEventListener('click', () => {
      if (rowToDelete) rowToDelete.remove();
      confirmModal.classList.remove('active');
    });
  }
});