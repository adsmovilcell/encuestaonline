const express = require('express');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8085;

// Middleware de seguridad básica (desactivamos CSP para no romper estilos inline del frontend)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Parsear JSON
app.use(express.json());

// Servir estáticos
app.use(express.static(path.join(__dirname)));

// Endpoint para verificar estado de variables de entorno
app.get('/api/config-status', (req, res) => {
  res.json({
    airtableConfigured: !!(process.env.AIRTABLE_TOKEN && process.env.AIRTABLE_BASE_ID && process.env.AIRTABLE_TABLE_ID),
    n8nProdConfigured: !!process.env.N8N_PROD_WEBHOOK_URL,
    n8nTestConfigured: !!process.env.N8N_TEST_WEBHOOK_URL
  });
});

// Endpoint proxy para enviar encuesta
app.post('/api/submit', async (req, res) => {
  try {
    const { 
      id_estudiante, 
      nivel_satisfaccion, 
      claridad_contenido, 
      aplicabilidad_practica, 
      comentarios_adicionales,
      submitted_at,
      customAirtable,
      customWebhook,
      activeIntegration,
      n8nEnv // 'prod', 'test', o 'custom'
    } = req.body;

    const satisfactionInt = parseInt(nivel_satisfaccion, 10);
    const clarityInt = parseInt(claridad_contenido, 10);
    const practicalInt = parseInt(aplicabilidad_practica, 10);

    const integration = activeIntegration || 'airtable';

    if (integration === 'simulation') {
      await new Promise(resolve => setTimeout(resolve, 800));
      return res.json({ 
        success: true, 
        message: 'Simulación exitosa', 
        destination: 'Simulación local (Servidor)' 
      });
    }

    // Determinar la URL del webhook de n8n desde el backend o manual
    let n8nUrl = '';
    if (n8nEnv === 'prod') {
      n8nUrl = process.env.N8N_PROD_WEBHOOK_URL || '';
    } else if (n8nEnv === 'test') {
      n8nUrl = process.env.N8N_TEST_WEBHOOK_URL || '';
    } else if (customWebhook?.n8nEmailUrl) {
      n8nUrl = customWebhook.n8nEmailUrl;
    } else {
      n8nUrl = process.env.N8N_PROD_WEBHOOK_URL || '';
    }

    // Payload para el webhook de email (n8n)
    const emailPayload = {
      id_estudiante,
      nivel_satisfaccion: satisfactionInt,
      claridad_contenido: clarityInt,
      aplicabilidad_practica: practicalInt,
      comentarios_adicionales,
      submitted_at
    };

    if (integration === 'airtable') {
      const token = customAirtable?.token || process.env.AIRTABLE_TOKEN;
      const base = customAirtable?.baseId || process.env.AIRTABLE_BASE_ID;
      const table = customAirtable?.tableId || process.env.AIRTABLE_TABLE_ID;

      if (!token || !base || !table) {
        return res.status(400).json({ 
          success: false, 
          message: 'Error de configuración: Faltan credenciales de Airtable en el servidor y no se proporcionaron credenciales manuales.' 
        });
      }

      // Payload para Airtable
      const airtablePayload = {
        records: [
          {
            fields: {
              IDEstudiante: id_estudiante,
              NivelSatisfaccion: satisfactionInt,
              ClaridadContenido: clarityInt,
              AplicabilidadPractica: practicalInt,
              ComentariosAdicionales: comentarios_adicionales
            }
          }
        ]
      };

      // Ejecutar peticiones
      const airtablePromise = fetch(`https://api.airtable.com/v0/${base}/${table}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(airtablePayload)
      });

      let n8nPromise = Promise.resolve(null);
      if (n8nUrl) {
        n8nPromise = fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        }).catch(err => {
          console.warn('[n8n webhook proxy] Error al disparar webhook de n8n:', err.message);
          return { ok: false, error: err.message };
        });
      }

      const [airtableRes] = await Promise.all([airtablePromise, n8nPromise]);

      if (!airtableRes.ok) {
        const errorData = await airtableRes.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `Airtable respondió con código: ${airtableRes.status}`;
        throw new Error(errMsg);
      }

      return res.json({ 
        success: true, 
        message: 'Datos guardados en Airtable y notificados por email.',
        destination: n8nUrl ? `Airtable + Email (${n8nEnv === 'custom' ? 'Webhook personalizado' : n8nEnv})` : 'Airtable'
      });

    } else if (integration === 'webhook') {
      const webhookUrl = customWebhook?.url || process.env.N8N_PROD_WEBHOOK_URL;

      if (!webhookUrl) {
        return res.status(400).json({ 
          success: false, 
          message: 'Error de configuración: No se ha configurado ninguna URL de Webhook en el servidor ni en el cliente.' 
        });
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });

      if (!response.ok) {
        throw new Error(`El Webhook respondió con código: ${response.status}`);
      }

      return res.json({ 
        success: true, 
        message: 'Datos enviados correctamente al Webhook personalizado.',
        destination: 'Webhook / n8n'
      });
    }

    res.status(400).json({ success: false, message: 'Integración no soportada' });

  } catch (error) {
    console.error('[Submit Proxy Error]:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error en el servidor al procesar la encuesta.' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Servidor Proxy Seguro de Encuestas en ejecución`);
  console.log(` URL local: http://127.0.0.1:${PORT}`);
  console.log(`====================================================`);
});
