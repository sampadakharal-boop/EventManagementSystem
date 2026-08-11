document.addEventListener("DOMContentLoaded", () => {

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("show");

        if (navLinks.classList.contains("show")) {
            menuBtn.textContent = "✕";
        } else {
            menuBtn.textContent = "☰";
        }
    });

    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("show");
            menuBtn.textContent = "☰";
        });
    });
}

const heartButtons = document.querySelectorAll(".heart-btn, .card-heart");

heartButtons.forEach(button => {
    button.addEventListener("click", () => {
        button.classList.toggle("liked");

        if (button.classList.contains("liked")) {
            button.textContent = "♥";
        } else {
            button.textContent = "♡";
        }
    });
});

const searchInput = document.getElementById("eventSearch");
const searchBtn = document.getElementById("searchBtn");
const searchMessage = document.getElementById("searchMessage");

function searchEvents() {
    const query = searchInput.value.trim();

    if (!query) {
        searchMessage.textContent = "Try searching for technology, concerts, workshops or startups.";
        searchInput.focus();
        return;
    }

    window.location.href = `events.html?search=${encodeURIComponent(query)}`;
}

if (searchBtn) {
    searchBtn.addEventListener("click", searchEvents);
}

if (searchInput) {
    searchInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            searchEvents();
        }
    });

    searchInput.addEventListener("input", () => {
        if (searchInput.value.trim()) {
            searchMessage.textContent = "";
        }
    });
}

const profileCircle = document.getElementById("profileCircle");

const storedUser = localStorage.getItem("user");

if (storedUser && profileCircle) {
    try {
        const user = JSON.parse(storedUser);

        const name =
            user.full_name ||
            user.fullName ||
            user.name ||
            "";

        if (name) {
            profileCircle.textContent = name.charAt(0).toUpperCase();
            profileCircle.title = name;
        }
    } catch (error) {
        console.log("Unable to load user profile.");
    }
}

const observer = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    },
    {
        threshold: 0.12
    }
);

document
    .querySelectorAll(".category-card, .event-card, .step")
    .forEach(element => {
        element.style.opacity = "0";
        element.style.transform = "translateY(20px)";
        element.style.transition = "opacity 0.6s ease, transform 0.6s ease";
        observer.observe(element);
    });

document.querySelectorAll(".category-card, .event-card, .step").forEach(element => {
    element.addEventListener("transitionend", () => {
        if (element.classList.contains("visible")) {
            element.style.opacity = "1";
            element.style.transform = "translateY(0)";
        }
    });
});

const animatedElements = document.querySelectorAll(
    ".category-card, .event-card, .step"
);

animatedElements.forEach(element => {
    const observerElement = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                    observerElement.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.1
        }
    );

    observerElement.observe(element);
});

});
