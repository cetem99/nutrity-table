document.addEventListener("DOMContentLoaded", () => {
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const rememberMeCheckbox = document.getElementById("rememberMe");

  // Verificar se há credenciais salvas
  function checkSavedCredentials() {
    const savedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      emailInput.value = user.email || '';
      // Não preenchemos a senha por segurança
      rememberMeCheckbox.checked = !!localStorage.getItem("user");
    }
  }

  // Chamar a verificação ao carregar a página
  checkSavedCredentials();

  let showPassword = false;

  // Alternar visibilidade da senha
  // Profile-style password toggle but using Lucide icons for login/cadastro pages.
  // This appends a small toggle button after the input if one isn't present,
  // and avoids submitting the form by setting button.type='button'.
  // Use same style as profile: small outline button with Bootstrap Icons
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

  // Enviar formulário de login
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value.trim();
    const rememberMe = document.getElementById("rememberMe").checked;

    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Erro ao fazer login.");
        return;
      }

      // Guarda token + ID + nome do usuário
      const userData = {
        token: data.token,
        userId: data.user._id,
        name: data.user.name,
        email: data.user.email,
      };

      if (rememberMe) {
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        sessionStorage.setItem("user", JSON.stringify(userData));
      }

      alert(`Bem-vindo, ${data.user.name}!`);
      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao conectar ao servidor.");
    }
  });
});
