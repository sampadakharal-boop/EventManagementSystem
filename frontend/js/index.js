document.addEventListener("DOMContentLoaded", async () => {

    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const nameInfo = document.getElementById("nameInfo");
    const emailInfo = document.getElementById("emailInfo");
    const roleInfo = document.getElementById("roleInfo");
    const profileAvatar = document.getElementById("profileAvatar");
    const logoutBtn = document.getElementById("logoutBtn");

    try {

        const response = await fetch("/api/me", {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (!data.success || !data.user) {
            window.location.href = "login.html";
            return;
        }

        const user = data.user;

        profileName.textContent = user.name;
        profileEmail.textContent = user.email;

        nameInfo.textContent = user.name;
        emailInfo.textContent = user.email;

        roleInfo.textContent =
            user.role === "admin" ? "Administrator" : "User";

        profileAvatar.textContent =
            user.name.charAt(0).toUpperCase();

    } catch (error) {

        console.error("Unable to load profile:", error);
        window.location.href = "login.html";

    }

    logoutBtn.addEventListener("click", async () => {

        try {

            const response = await fetch("/api/logout", {
                method: "POST",
                credentials: "include"
            });

            const data = await response.json();

            if (data.success) {
                window.location.href = "login.html";
            } else {
                alert(data.message || "Logout failed.");
            }

        } catch (error) {

            console.error("Logout error:", error);
            alert("Could not log out. Please try again.");

        }

    });

});