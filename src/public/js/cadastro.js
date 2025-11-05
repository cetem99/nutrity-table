document.addEventListener("DOMContentLoaded", () => {
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  const signupForm = document.getElementById("signupForm");

  let showPassword = false;

  // Alternar visibilidade da senha
  // Profile-style password toggle but using Lucide icons for login/cadastro pages.
  function registerInlinePasswordToggle(input, existingButton) {
    if (!input) return;
    let btn = existingButton;
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'toggle-password btn btn-sm btn-outline-secondary';
      btn.style.marginLeft = '8px';
      btn.innerHTML = '<i class="bi bi-eye"></i>';
      input.parentNode.appendChild(btn);
    } else {
      btn.type = 'button';
      btn.innerHTML = '<i class="bi bi-eye"></i>';
    }

    let visible = false;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      visible = !visible;
      input.type = visible ? 'text' : 'password';
      btn.innerHTML = visible ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
    });
  }

  registerInlinePasswordToggle(passwordInput, togglePassword);

  // Submissão do formulário
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value.trim();

    if (!name || !email || !password) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    try {
      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Erro ao cadastrar usuário.");
        return;
      }

      alert("Cadastro realizado com sucesso!");
      window.location.href = "/login.html";
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao conectar ao servidor.");
    }
  });
});
