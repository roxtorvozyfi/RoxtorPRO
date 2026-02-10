
# 🎙️ Roxtor Vozify (NVO)

**Gestión Textil Inteligente con Gemini AI**

Roxtor Vozify es una aplicación diseñada para Inversiones Roxtor C.A. que permite gestionar catálogos, pedidos y responder consultas de clientes mediante inteligencia artificial de voz.

## 🚀 Despliegue Rápido

### 1. Requisitos
- Una cuenta en **GitHub**.
- Una cuenta en **Netlify** o **Vercel**.
- Una **Gemini API Key** (Obtenla en [Google AI Studio](https://aistudio.google.com/)).

### 2. Configuración de Variables de Entorno
Para que la aplicación funcione, **DEBES** configurar la siguiente variable en tu panel de Netlify/Vercel (Site Settings > Environment Variables):

| Variable | Valor |
|----------|-------|
| `API_KEY` | *Tu_Clave_De_Gemini_Aquí* |

### 3. Instalación Local
Si deseas probarla en tu computadora:
```bash
npm install
npm run dev
```

## 📱 Instalación como App (PWA)
Una vez desplegada, abre la URL en tu móvil:
- **iOS:** Compartir > "Agregar a Inicio".
- **Android:** Tres puntos > "Instalar Aplicación".

## 🛠️ Tecnologías
- **Frontend:** React 19 + Tailwind CSS.
- **IA:** Google Gemini API (Modelos Flash & TTS).
- **Iconos:** Lucide React.
- **Sincronización:** Cloud Sync mediante código de equipo.

---
*Desarrollado para Inversiones Roxtor, C.A - Soluciones Creativas.*
