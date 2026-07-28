# 🚰 Control de Pipas

Sistema para controlar el despacho de pipas de agua:
- **Clientes con contrato**: tienen una credencial con código QR (nombre + placas). Al llegar a llenar, se escanea y se registra solo: hora, nombre y placas.
- **Venta directa**: pipas sin contrato, registradas manualmente por el encargado.
- **Reportes**: corte por rango de fechas con el total de cada tipo, listo para imprimir.

## 1. Requisitos

- Cuenta gratis en [MongoDB Atlas](https://www.mongodb.com/atlas) (para guardar los datos en la nube).
- Cuenta gratis en [Render](https://render.com) (para publicar la app, igual que tu otro proyecto).
- Node.js instalado si quieres probarlo en tu computadora primero.

## 2. Configurar MongoDB Atlas

1. Crea un cluster gratuito (M0).
2. En "Database Access" crea un usuario y contraseña.
3. En "Network Access" agrega `0.0.0.0/0` (permitir desde cualquier lugar) para que Render pueda conectarse.
4. Copia tu cadena de conexión ("Connect" → "Drivers"), se ve así:
   ```
   mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/pipas?retryWrites=true&w=majority
   ```

## 3. Probar en tu computadora (opcional)

```bash
npm install
cp .env.example .env
```

Edita `.env` y pon tu `MONGODB_URI` real y una `ADMIN_KEY` (la clave que usarás para dar de alta clientes).

```bash
npm start
```

Abre `http://localhost:3000` en el navegador.

## 4. Publicar en Render

1. Sube este proyecto a un repositorio de GitHub.
2. En Render: **New → Web Service** → conecta el repositorio.
3. Configuración:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. En **Environment Variables** agrega:
   - `MONGODB_URI` → tu cadena de conexión de Atlas
   - `ADMIN_KEY` → la clave que quieras usar para el panel de clientes
5. Deploy. Render te da una URL pública (algo como `https://control-pipas.onrender.com`).

## 5. Cómo usarlo en el día a día

1. Entra a **Clientes** desde el celular, mete tu `ADMIN_KEY` una vez (se queda guardada en ese dispositivo).
2. Da de alta a cada operador con contrato: nombre + placas → se genera su QR. Imprímelo y pégalo en su credencial/gafete.
3. Cuando lleguen a llenar: entra a **Escanear**, apunta la cámara al QR. Se guarda solo la hora, nombre y placas.
4. Cuando llegue alguien sin contrato: entra a **Venta directa** y anótalo a mano (nombre/placas son opcionales).
5. Para el corte de la semana: entra a **Reportes**, elige el rango de fechas y genera. Puedes imprimirlo o guardarlo como PDF desde el botón de imprimir.

## Notas

- El QR solo guarda un código único (no el nombre directo), así que si alguien cambia de placas puedes actualizar sus datos en el panel de Clientes sin tener que reimprimir la credencial.
- Si un cliente deja el contrato, puedes desactivarlo en vez de borrarlo (para no perder su historial).
- La `ADMIN_KEY` es una protección simple para que no cualquiera pueda dar de alta clientes falsos. Si el negocio crece, se puede reforzar con login real de usuarios.
