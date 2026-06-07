document.addEventListener('DOMContentLoaded', () => {
  // Limpiar credenciales antiguas inseguras de localStorage si aún persisten de versiones previas
  // (Se usan comparaciones de prefijos/IDs para evitar hardcodear el token completo y prevenir falsos positivos de GitHub Push Protection)
  const localAirtableToken = localStorage.getItem('airtable_token');
  if (localAirtableToken && localAirtableToken.startsWith('patcuGLoiwmCtLAPY')) {
    localStorage.removeItem('airtable_token');
    localStorage.removeItem('airtable_base_id');
    localStorage.removeItem('airtable_table_id');
  }
  
  const currentLocalN8nUrl = localStorage.getItem('n8n_email_webhook_url');
  if (currentLocalN8nUrl && currentLocalN8nUrl.includes('f51c6968-6e38-4cf2-b7ce-e7b61696cded')) {
    localStorage.removeItem('n8n_email_webhook_url');
  }


  // Constants for empty fallbacks (credentials are handled securely by backend server.js)
  const DEFAULT_AIRTABLE_TOKEN = '';
  const DEFAULT_AIRTABLE_BASE = '';
  const DEFAULT_AIRTABLE_TABLE = '';


  // Elements
  const surveyForm = document.getElementById('surveyForm');
  const surveyCard = document.getElementById('surveyCard');
  const successCard = document.getElementById('successCard');
  const submitBtn = document.getElementById('submitBtn');
  const resetBtn = document.getElementById('resetBtn');
  
  // Input fields
  const idEstudianteInput = document.getElementById('id_estudiante');
  const comentariosInput = document.getElementById('comentarios_adicionales');
  const charCounter = document.getElementById('charCounter');
  
  // Modal elements
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  
  // Modal Inputs
  const integrationTypeSelect = document.getElementById('integrationType');
  const airtableConfigSection = document.getElementById('airtableConfigSection');
  const webhookConfigSection = document.getElementById('webhookConfigSection');
  
  const airtableTokenInput = document.getElementById('airtableToken');
  const airtableBaseIdInput = document.getElementById('airtableBaseId');
  const airtableTableIdInput = document.getElementById('airtableTableId');
  const webhookUrlInput = document.getElementById('webhookUrl');
  
  const webhookStatusBadge = document.getElementById('webhookStatusBadge');
  const webhookStatusText = document.getElementById('webhookStatusText');
 
  // n8n email webhook modal refs
  const n8nEmailWebhookInput = document.getElementById('n8nEmailWebhookUrl');
  const n8nProdBtn = document.getElementById('n8nProdBtn');
  const n8nTestBtn = document.getElementById('n8nTestBtn');
  const n8nEnvBadge = document.getElementById('n8nEnvBadge');
  const n8nEnvText = document.getElementById('n8nEnvText');
 
  // Success view output elements
  const resId = document.getElementById('res-id');
  const resSat = document.getElementById('res-sat');
  const resClar = document.getElementById('res-clar');
  const resPr = document.getElementById('res-pr');
  const resWebhook = document.getElementById('res-webhook');
 
  // 1. Load active settings from LocalStorage or fallback to empty
  let activeIntegration = localStorage.getItem('active_integration') || 'airtable';
  
  let savedAirtableToken = localStorage.getItem('airtable_token') || '';
  let savedAirtableBase = localStorage.getItem('airtable_base_id') || '';
  let savedAirtableTable = localStorage.getItem('airtable_table_id') || '';
  let savedWebhookUrl = localStorage.getItem('n8n_webhook_url') || '';
 
  // n8n email webhook - load selected environment from localStorage
  let activeN8nEnv = localStorage.getItem('n8n_email_env') || 'prod';
  let activeN8nUrl = localStorage.getItem('n8n_email_webhook_url') || '';
 
  // Configuración del servidor (se verifica al cargar)
  let serverConfig = { airtableConfigured: false, n8nProdConfigured: false, n8nTestConfigured: false };
 
  // 2. Set initial values in inputs
  integrationTypeSelect.value = activeIntegration;
  airtableTokenInput.value = savedAirtableToken;
  airtableBaseIdInput.value = savedAirtableBase;
  airtableTableIdInput.value = savedAirtableTable;
  webhookUrlInput.value = savedWebhookUrl;
  n8nEmailWebhookInput.value = activeN8nUrl;
 
  // Render correct modal sections based on current select type
  toggleModalSections(activeIntegration);
  updateN8nEnvButtons(activeN8nEnv, activeN8nUrl);
  updateStatusDisplay();
  updatePlaceholders();

  // Verificar el estado de las credenciales en el backend
  async function checkServerConfig() {
    try {
      const res = await fetch('/api/config-status');
      if (res.ok) {
        serverConfig = await res.json();
        updateStatusDisplay();
        updateN8nEnvButtons(activeN8nEnv, activeN8nUrl);
        updatePlaceholders();
      }
    } catch (err) {
      console.warn('[Server Config] No se pudo conectar al backend proxy local. Se usará el modo cliente directo.', err);
    }
  }
  
  checkServerConfig();
 
  // Character counter for comments
  comentariosInput.addEventListener('input', () => {
    const count = comentariosInput.value.length;
    charCounter.textContent = `${count} / 1000`;
  });
 
  // Modal actions
  openSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('active');
    updatePlaceholders();
  });
 
  const closeModal = () => {
    settingsModal.classList.remove('active');
    // Restore values to saved states
    integrationTypeSelect.value = activeIntegration;
    airtableTokenInput.value = savedAirtableToken;
    airtableBaseIdInput.value = savedAirtableBase;
    airtableTableIdInput.value = savedAirtableTable;
    webhookUrlInput.value = savedWebhookUrl;
    n8nEmailWebhookInput.value = activeN8nUrl;
    toggleModalSections(activeIntegration);
    updateN8nEnvButtons(activeN8nEnv, activeN8nUrl);
    updatePlaceholders();
  };
 
  closeSettingsBtn.addEventListener('click', closeModal);
  cancelSettingsBtn.addEventListener('click', closeModal);
 
  // Toggle modal sections on change
  integrationTypeSelect.addEventListener('change', (e) => {
    toggleModalSections(e.target.value);
  });
 
  function toggleModalSections(type) {
    if (type === 'airtable') {
      airtableConfigSection.style.display = 'block';
      webhookConfigSection.style.display = 'none';
    } else if (type === 'webhook') {
      airtableConfigSection.style.display = 'none';
      webhookConfigSection.style.display = 'block';
    } else {
      airtableConfigSection.style.display = 'none';
      webhookConfigSection.style.display = 'none';
    }
  }
 
  // Save integration settings
  saveSettingsBtn.addEventListener('click', () => {
    const selectedType = integrationTypeSelect.value;
    
    if (selectedType === 'airtable') {
      const token = airtableTokenInput.value.trim();
      const base = airtableBaseIdInput.value.trim();
      const table = airtableTableIdInput.value.trim();
      
      // Permitir guardar vacío si el servidor ya tiene las claves correspondientes
      if (!serverConfig.airtableConfigured && (!token || !base || !table)) {
        alert('Por favor, rellena todos los campos de Airtable o configura las variables de entorno en el servidor.');
        return;
      }
      
      savedAirtableToken = token;
      savedAirtableBase = base;
      savedAirtableTable = table;
      
      if (token) localStorage.setItem('airtable_token', token);
      else localStorage.removeItem('airtable_token');

      if (base) localStorage.setItem('airtable_base_id', base);
      else localStorage.removeItem('airtable_base_id');

      if (table) localStorage.setItem('airtable_table_id', table);
      else localStorage.removeItem('airtable_table_id');
      
    } else if (selectedType === 'webhook') {
      const url = webhookUrlInput.value.trim();
      // Permitir guardar vacío si el servidor ya tiene un webhook configurado
      if (!serverConfig.n8nProdConfigured && !serverConfig.n8nTestConfigured && (!url || !isValidUrl(url))) {
        alert('Por favor, introduce una URL de webhook válida.');
        return;
      }
      
      savedWebhookUrl = url;
      if (url) localStorage.setItem('n8n_webhook_url', url);
      else localStorage.removeItem('n8n_webhook_url');
    }
 
    activeIntegration = selectedType;
    localStorage.setItem('active_integration', selectedType);
 
    // Guardar URL de email si se especificó una personalizada
    const newN8nUrl = n8nEmailWebhookInput.value.trim();
    if (newN8nUrl) {
      if (!isValidUrl(newN8nUrl)) {
        alert('Por favor, introduce una URL de webhook de email válida.');
        return;
      }
      activeN8nUrl = newN8nUrl;
      activeN8nEnv = 'custom';
      localStorage.setItem('n8n_email_webhook_url', newN8nUrl);
    } else {
      activeN8nUrl = '';
      localStorage.removeItem('n8n_email_webhook_url');
    }
    
    localStorage.setItem('n8n_email_env', activeN8nEnv);
 
    updateN8nEnvButtons(activeN8nEnv, activeN8nUrl);
    updateStatusDisplay();
    settingsModal.classList.remove('active');
  });
 
  // n8n Quick env buttons
  n8nProdBtn.addEventListener('click', () => {
    n8nEmailWebhookInput.value = '';
    activeN8nEnv = 'prod';
    updateN8nEnvButtons('prod', '');
    updatePlaceholders();
  });
 
  n8nTestBtn.addEventListener('click', () => {
    n8nEmailWebhookInput.value = '';
    activeN8nEnv = 'test';
    updateN8nEnvButtons('test', '');
    updatePlaceholders();
  });

  n8nEmailWebhookInput.addEventListener('input', () => {
    const val = n8nEmailWebhookInput.value.trim();
    if (val) {
      activeN8nEnv = 'custom';
      updateN8nEnvButtons('custom', val);
    } else {
      activeN8nEnv = 'prod';
      updateN8nEnvButtons('prod', '');
    }
  });
 
  function updateN8nEnvButtons(env, url) {
    const isProd = env === 'prod';
    const isTest = env === 'test';
 
    n8nProdBtn.classList.toggle('active-prod', isProd);
    n8nTestBtn.classList.toggle('active-test', isTest);
 
    if (n8nEnvBadge && n8nEnvText) {
      if (isProd) {
        n8nEnvBadge.classList.add('connected');
        n8nEnvText.style.color = '';
        n8nEnvText.textContent = serverConfig.n8nProdConfigured
          ? '🚀 Producción activa (Servidor seguro)'
          : '🚀 Producción activa (Sin configurar)';
      } else if (isTest) {
        n8nEnvBadge.classList.remove('connected');
        n8nEnvText.style.color = '#fbbf24';
        n8nEnvText.textContent = serverConfig.n8nTestConfigured
          ? '🧪 Test activo (Servidor seguro, n8n en escucha)'
          : '🧪 Test activo (Sin configurar)';
      } else {
        n8nEnvBadge.classList.remove('connected');
        n8nEnvText.style.color = '';
        n8nEnvText.textContent = url ? 'URL personalizada cliente' : 'URL personalizada';
      }
    }
  }
 
  // Close modal when clicking outside of the card
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeModal();
    }
  });
 
  // Remove error class on focus/input/change
  const formGroups = document.querySelectorAll('.form-group');
  formGroups.forEach(group => {
    const inputs = group.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('input', () => group.classList.remove('has-error'));
      input.addEventListener('change', () => group.classList.remove('has-error'));
    });
  });
 
  // Form submission handler
  surveyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
 
    // Prepare data variables
    const id_estudiante = idEstudianteInput.value.trim();
    const nivel_satisfaccion = document.querySelector('input[name="nivel_satisfaccion"]:checked').value;
    const claridad_contenido = document.querySelector('input[name="claridad_contenido"]:checked').value;
    const aplicabilidad_practica = document.querySelector('input[name="aplicabilidad_practica"]:checked').value;
    const comentarios_adicionales = comentariosInput.value.trim();
    const submitted_at = new Date().toISOString();
 
    const satisfactionInt = parseInt(nivel_satisfaccion, 10);
    const clarityInt = parseInt(claridad_contenido, 10);
    const practicalInt = parseInt(aplicabilidad_practica, 10);
 
    // UI state: loading
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    // Preparar el payload de envío al backend proxy
    const payload = {
      id_estudiante,
      nivel_satisfaccion: satisfactionInt,
      claridad_contenido: clarityInt,
      aplicabilidad_practica: practicalInt,
      comentarios_adicionales,
      submitted_at,
      activeIntegration,
      n8nEnv: activeN8nEnv,
      // Si el cliente tiene credenciales locales personalizadas, se envían para anular las del servidor
      customAirtable: (savedAirtableToken || savedAirtableBase || savedAirtableTable) ? {
        token: savedAirtableToken,
        baseId: savedAirtableBase,
        tableId: savedAirtableTable
      } : undefined,
      customWebhook: (savedWebhookUrl || activeN8nUrl) ? {
        url: savedWebhookUrl,
        n8nEmailUrl: activeN8nUrl
      } : undefined
    };
 
    try {
      // Petición unificada a la API segura del Servidor Proxy
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || `El Proxy respondió con código: ${response.status}`);
      }
 
      // Populate success card
      resId.textContent = id_estudiante;
      resSat.textContent = `${satisfactionInt} / 5 (${getSatLabel(satisfactionInt)})`;
      resClar.textContent = `${clarityInt} / 5`;
      resPr.textContent = `${practicalInt} / 5`;
      resWebhook.textContent = result.destination || 'Servidor Seguro';
 
      // Transition to success card
      surveyForm.style.display = 'none';
      successCard.style.display = 'block';
 
    } catch (error) {
      console.error('Submission failed:', error);
      alert(`No se pudo enviar la encuesta.\nError: ${error.message}\n\nNota: Abre los ajustes (arriba a la derecha) para verificar las credenciales y el estado de la conexión.`);
    } finally {
      // Restore UI state
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
    }
  });
 
  // Reset form to start a new submission
  resetBtn.addEventListener('click', () => {
    surveyForm.reset();
    charCounter.textContent = '0 / 1000';
    
    // Transition back to form
    successCard.style.display = 'none';
    surveyForm.style.display = 'block';
    
    // Scroll back to top and focus student ID
    idEstudianteInput.focus();
  });
 
  // Form Validation Logic
  function validateForm() {
    let isValid = true;
    
    // Check Student ID
    if (!idEstudianteInput.value.trim()) {
      showError('group-id-estudiante');
      isValid = false;
    }
 
    // Check Satisfaction Scale
    if (!document.querySelector('input[name="nivel_satisfaccion"]:checked')) {
      showError('group-nivel-satisfaccion');
      isValid = false;
    }
 
    // Check Content Clarity Scale
    if (!document.querySelector('input[name="claridad_contenido"]:checked')) {
      showError('group-claridad-contenido');
      isValid = false;
    }
 
    // Check Practical Applicability Scale
    if (!document.querySelector('input[name="aplicabilidad_practica"]:checked')) {
      showError('group-aplicabilidad-practica');
      isValid = false;
    }
 
    return isValid;
  }
 
  function showError(groupId) {
    const group = document.getElementById(groupId);
    if (group) {
      group.classList.add('has-error');
      // Scroll to the first error element
      group.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
 
  function updateStatusDisplay() {
    const hasCustomAirtable = savedAirtableToken && savedAirtableBase && savedAirtableTable;
    
    if (activeIntegration === 'airtable') {
      if (hasCustomAirtable) {
        webhookStatusBadge.classList.add('connected');
        const truncatedTable = savedAirtableTable.length > 15 ? savedAirtableTable.substring(0, 12) + '...' : savedAirtableTable;
        webhookStatusText.textContent = `Airtable activo (Manual): Tabla "${truncatedTable}"`;
      } else if (serverConfig.airtableConfigured) {
        webhookStatusBadge.classList.add('connected');
        webhookStatusText.textContent = `Airtable activo (Servidor seguro)`;
      } else {
        webhookStatusBadge.classList.remove('connected');
        webhookStatusText.textContent = `Airtable inactivo (Falta configuración)`;
      }
    } else if (activeIntegration === 'webhook') {
      if (savedWebhookUrl) {
        webhookStatusBadge.classList.add('connected');
        const truncatedUrl = savedWebhookUrl.length > 25 ? savedWebhookUrl.substring(0, 22) + '...' : savedWebhookUrl;
        webhookStatusText.textContent = `n8n activo (Manual): ${truncatedUrl}`;
      } else if (serverConfig.n8nProdConfigured || serverConfig.n8nTestConfigured) {
        webhookStatusBadge.classList.add('connected');
        webhookStatusText.textContent = `n8n activo (Servidor seguro)`;
      } else {
        webhookStatusBadge.classList.remove('connected');
        webhookStatusText.textContent = 'n8n inactivo (Falta configuración)';
      }
    } else {
      webhookStatusBadge.classList.remove('connected');
      webhookStatusText.textContent = 'Desconectado (Modo simulación)';
    }
  }

  function updatePlaceholders() {
    if (serverConfig.airtableConfigured) {
      airtableTokenInput.placeholder = '•••••••••••••••• (Configurado en servidor)';
      airtableBaseIdInput.placeholder = 'Configurado en servidor (.env)';
      airtableTableIdInput.placeholder = 'Configurado en servidor (.env)';
    } else {
      airtableTokenInput.placeholder = 'pat...';
      airtableBaseIdInput.placeholder = 'app...';
      airtableTableIdInput.placeholder = 'tbl... o Nombre';
    }

    if (activeN8nEnv === 'prod') {
      n8nEmailWebhookInput.placeholder = serverConfig.n8nProdConfigured 
        ? 'URL de Producción oculta en el servidor' 
        : 'https://n8n-servidor.host/webhook/...';
    } else if (activeN8nEnv === 'test') {
      n8nEmailWebhookInput.placeholder = serverConfig.n8nTestConfigured 
        ? 'URL de Test oculta en el servidor' 
        : 'https://n8n-servidor.host/webhook-test/...';
    } else {
      n8nEmailWebhookInput.placeholder = 'https://n8n-servidor.host/webhook/...';
    }
  }
 
  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
 
  function getSatLabel(val) {
    const labels = {
      1: 'Muy Insatisfecho',
      2: 'Insatisfecho',
      3: 'Neutral',
      4: 'Satisfecho',
      5: 'Muy Satisfecho'
    };
    return labels[val] || '';
  }
});
