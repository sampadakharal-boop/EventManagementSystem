const form = document.getElementById("loginForm");

const email = document.getElementById("email");

const password = document.getElementById("password");

const emailError = document.getElementById("emailError");

const passwordError = document.getElementById("passwordError");

const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", function(){

    if(password.type === "password"){

        password.type = "text";

        togglePassword.textContent = "visibility_off";

    }

    else{

        password.type = "password";

        togglePassword.textContent = "visibility";

    }

});

form.addEventListener("submit", function(event){

    event.preventDefault();

    emailError.textContent = "";

    passwordError.textContent = "";

    let valid = true;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(email.value.trim() === ""){

        emailError.textContent = "Email is required.";

        valid = false;

    }

    else if(!emailPattern.test(email.value.trim())){

        emailError.textContent = "Enter a valid email address.";

        valid = false;

    }

    if(password.value.trim() === ""){

        passwordError.textContent = "Password is required.";

        valid = false;

    }

    else if(password.value.length < 6){

        passwordError.textContent = "Password must be at least 6 characters.";

        valid = false;

    }

    if(valid){

        alert("Login Successful!");

        window.location.href = "index.html";

    }

});