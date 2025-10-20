document.addEventListener('DOMContentLoaded', function() {
  // --- CONTROLE DA SIDEBAR ---
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarClose = document.getElementById('sidebar-close');
  const overlay = document.getElementById('sidebar-overlay');

  function openSidebar() {
    if (sidebar && overlay) {
      sidebar.classList.add('is-open');
      overlay.classList.add('is-visible');
    }
  }
  function closeSidebar() {
    if (sidebar && overlay) {
      sidebar.classList.remove('is-open');
      overlay.classList.remove('is-visible');
    }
  }
  if(sidebarToggle) sidebarToggle.addEventListener('click', openSidebar);
  if(sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
  if(overlay) overlay.addEventListener('click', closeSidebar);


  // --- LÓGICA DA FOTO DE PERFIL ---
  const changePhotoButton = document.getElementById('changePhotoButton');
  const photoUploadInput = document.getElementById('photoUpload');
  const sidebarUserImage = document.getElementById('sidebarUserImage');
  const profilePageUserImage = document.getElementById('profilePageUserImage');

  // Ao clicar no botão "Alterar Foto", aciona o input de arquivo escondido
  if (changePhotoButton) {
    changePhotoButton.addEventListener('click', () => {
      photoUploadInput.click();
    });
  }

  // Quando um arquivo for selecionado, atualiza as imagens
  if (photoUploadInput) {
    photoUploadInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          // Atualiza a imagem da sidebar e da página de perfil
          if (sidebarUserImage) {
            sidebarUserImage.src = e.target.result;
          }
          if (profilePageUserImage) {
            profilePageUserImage.src = e.target.result;
          }
        }
        reader.readAsDataURL(file);
      }
    });
  }
});