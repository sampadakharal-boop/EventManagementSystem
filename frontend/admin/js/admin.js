document.addEventListener('DOMContentLoaded', async () => {
  // Guard: verify this user is actually an admin
  try {
    const res = await fetch('/api/admin/verify', { credentials: 'include' });
    if (!res.ok) {
      window.location.href = '../login.html';
      return;
    }
  } catch (err) {
    window.location.href = '../login.html';
    return;
  }

  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '../login.html';
  });
});