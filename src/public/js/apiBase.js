(function() {
  const STATIC_PATTERNS = [/\.github\.io$/i];

  function isStaticHost() {
    const { protocol, hostname } = window.location;
    return protocol === 'file:' || STATIC_PATTERNS.some((pattern) => pattern.test(hostname));
  }

  function getConfiguredBase() {
    if (typeof window.NUTRITY_API_BASE_URL === 'string') {
      const trimmed = window.NUTRITY_API_BASE_URL.trim();
      if (trimmed.length > 0) {
        return trimmed.replace(/\/$/, '');
      }
    }
    return '';
  }

  const DEFAULT_WARNING = "Este recurso precisa de um backend ativo. Defina window.NUTRITY_API_BASE_URL com o endereço da API (ex.: https://seu-backend.com) quando estiver hospedando de forma estática.";

  window.isApiAvailable = function() {
    if (getConfiguredBase()) return true;
    return !isStaticHost();
  };

  window.resolveApiUrl = function(path) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const configured = getConfiguredBase();
    if (configured) {
      return `${configured}${cleanPath}`;
    }
    if (!isStaticHost()) {
      return cleanPath;
    }
    return null;
  };

  window.getApiUrlOrWarn = function(path, onMissing) {
    const url = window.resolveApiUrl(path);
    if (!url) {
      if (typeof onMissing === 'function') {
        onMissing();
      } else {
        alert(DEFAULT_WARNING);
      }
      return null;
    }
    return url;
  };

  window.getApiWarningMessage = function() {
    return DEFAULT_WARNING;
  };
})();
