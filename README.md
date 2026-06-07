# Encuesta del Curso Antigravity | Opinión de Estudiantes

Este proyecto es una aplicación web interactiva y moderna diseñada para recolectar feedback de estudiantes de forma rápida, estética y **100% segura**.

## 🛡️ Arquitectura de Seguridad (Backend Proxy)
A diferencia de los formularios estáticos tradicionales, esta aplicación implementa un servidor backend intermedio (**Node.js + Express**):
1. **Ocultamiento de Credenciales**: Los tokens de API de Airtable y las URLs de los webhooks de n8n se almacenan de forma segura en el servidor mediante variables de entorno (`.env`), de modo que el navegador del cliente nunca tiene acceso a ellos ni los expone en la pestaña de red (Network).
2. **Protección contra XSS/CORS**: Se utiliza el middleware de seguridad **Helmet** para proteger las cabeceras HTTP de la aplicación y prevenir ataques comunes.
3. **Simultaneidad Eficiente**: El backend gestiona el guardado en Airtable y el envío del correo por webhook de n8n de forma paralela en el servidor, agilizando el tiempo de respuesta del cliente.

---

## 🛠️ Tecnologías Utilizadas
- **Frontend**: HTML5, Vanilla CSS (diseño premium, animaciones dinámicas), Javascript ES6.
- **Backend**: Node.js, Express, Helmet, Dotenv.
- **Integraciones**: Airtable API, n8n Webhooks.

---

## 📂 Estructura del Proyecto
- `server.js`: Código del servidor backend que expone la API proxy segura (`/api/submit` y `/api/config-status`).
- `app.js`: Script del lado del cliente que maneja la validación y el envío asíncrono al proxy local.
- `index.html`: Maquetación de la encuesta y del modal de configuración dinámica.
- `style.css`: Hojas de estilo personalizadas con un diseño moderno.
- `.env.example`: Plantilla de variables de entorno recomendadas.

---

## 🚀 Instalación y Despliegue Local

### Requisitos Previos
- Tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).
- Tener instalado [Git](https://git-scm.com/).

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/adsmovilcell/encuestaonline.git
cd encuestaonline
```

### Paso 2: Configurar las Variables de Entorno
Copia el archivo de plantilla `.env.example` y renómbralo a `.env`:
```bash
cp .env.example .env
```
Abre el archivo `.env` y rellena las credenciales con tus propios tokens:
```env
PORT=8085
AIRTABLE_TOKEN=tu_token_pat_de_airtable
AIRTABLE_BASE_ID=tu_base_id
AIRTABLE_TABLE_ID=tu_table_id
N8N_PROD_WEBHOOK_URL=https://tu-n8n.host/webhook/...
N8N_TEST_WEBHOOK_URL=https://tu-n8n.host/webhook-test/...
```

### Paso 3: Instalar Dependencias
```bash
npm install
```

### Paso 4: Iniciar el Servidor
- **Modo Desarrollo (con reinicio automático)**:
  ```bash
  npm run dev
  ```
- **Modo Producción**:
  ```bash
  npm start
  ```

Una vez iniciado, abre tu navegador en [http://127.0.0.1:8085](http://127.0.0.1:8085) para ver la encuesta en funcionamiento.
