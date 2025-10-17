document.addEventListener("DOMContentLoaded", () => {
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  const loginForm = document.getElementById("loginForm");

  let showPassword = false;

  togglePassword.addEventListener("click", () => {
    showPassword = !showPassword;
    passwordInput.type = showPassword ? "text" : "password";
    togglePassword.innerHTML = `<i data-lucide="${showPassword ? "eye-off" : "eye"}"></i>`;
    lucide.createIcons();
  });

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = passwordInput.value;
    const rememberMe = document.getElementById("rememberMe").checked;

    console.log("Login:", { email, password, rememberMe });
    alert("Login enviado! Veja o console para os dados.");
  });
});
