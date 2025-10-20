document.addEventListener("DOMContentLoaded", () => {
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  const signupForm = document.getElementById("signupForm");

  let showPassword = false;

  togglePassword.addEventListener("click", () => {
    showPassword = !showPassword;
    passwordInput.type = showPassword ? "text" : "password";
    togglePassword.innerHTML = `<i data-lucide="${showPassword ? "eye-off" : "eye"}"></i>`;
    lucide.createIcons();
  });

  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = passwordInput.value;

    console.log("Cadastro:", { name, email, password });
    alert("Cadastro enviado! Veja o console para os dados.");
  });
});
