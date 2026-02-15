
# 🦖 ROXTOR Intelligent ERP v1.5

Sistema de gestión operativa de alto rendimiento para la industria textil. Incluye inteligencia artificial para ventas y sincronización en la nube.

## 🚀 Guía de Activación en Netlify + Supabase

### PASO 1: Base de Datos (Supabase)
1. Crea un proyecto en [Supabase](https://supabase.com).
2. En el **SQL Editor**, ejecuta este comando para crear la tabla de sincronización:
   ```sql
   create table roxtor_sync (
     store_id text primary key,
     last_sync timestamp with time zone default now(),
     payload jsonb
   );
   ```
3. Copia la `Project URL` y la `anon key` desde **Settings > API**.

### PASO 2: Despliegue (Netlify)
1. Sube tu código a un repositorio de **GitHub**.
2. Entra en [Netlify](https://app.netlify.com) y haz clic en **"Add new site" > "Import an existing project"**.
3. Conecta con GitHub y selecciona tu repositorio `roxtor-erp`.
4. En **Site configuration > Environment variables**, haz clic en **"Add a variable"**:
   - **Key:** `API_KEY`
   - **Value:** Tu clave de Google Gemini ([Obtenla aquí](https://aistudio.google.com)).
5. Haz clic en **"Deploy site"**.

### PASO 3: Configuración Final
1. Abre la URL que te asignó Netlify (ej: `roxtor-erp.netlify.app`).
2. Entra a **Gerencia > Ajustes de Marca > Conexión Nube**.
3. Pega los datos de Supabase (URL y API Key) y activa el interruptor.

---

## 🔒 Credenciales Maestras
- **PIN Acceso App:** `0000`
- **PIN Gerencia:** `1234`
*(Cámbialos en el panel de Ajustes tras el primer inicio)*

## 🛠️ Funciones Principales
- **Radar AI:** Procesa textos de WhatsApp y genera órdenes automáticas.
- **Vozify:** Entrena a tu equipo con audios de respuesta con el tono de tu marca.
- **Flujo de Taller:** Control de tareas, transferencias y espera de confección externa.
- **Cierre Consolidado:** Métricas financieras por sede en tiempo real.
