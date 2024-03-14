// Requerimientos de módulos
const http = require('http');
const fs = require('fs');
const url = require('url');
const saveUserInfo = require('./saveUserInfo');


// Constantes de configuración
const MAX_REQUESTS_PER_MINUTE = 10;
const BLOCK_DURATION = 60 * 1000; // 1 minuto en milisegundos

// Variables de seguimiento
const requestLog = {}; // Registro de solicitudes por IP
const blockList = {}; // Lista de IPs bloqueadas temporalmente

// Función principal para verificar usuarios
function verifyUser(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if (!ip) {
    console.log('Error: No se pudo detectar la dirección IP del usuario.');
    captchaFailure(res, ip);
    return;
  }

  if (blockList[ip]) {
    console.log(`IP bloqueada temporalmente: ${ip}`);
    captchaFailure(res, ip);
    return;
  }

  // Registrar la solicitud y verificar el límite de solicitudes
  registerRequest(ip);
  if (requestLog[ip].count > MAX_REQUESTS_PER_MINUTE) {
    console.log(`Exceso de solicitudes de la IP ${ip}. Bloqueando temporalmente.`);
    blockList[ip] = true;
    setTimeout(() => {
      delete blockList[ip];
    }, BLOCK_DURATION);
    captchaFailure(res, ip);
    return;
  }

  const userAgent = req.headers['user-agent'];
  if (!userAgent) {
    console.log('Error: No se pudo detectar el agente de usuario del usuario.');
    captchaFailure(res, ip);
    return;
  }

  saveUserInfo(ip, userAgent)
    .then(() => {
      const verificationResult = performVerification(ip, userAgent);
      if (verificationResult.success) {
        verificationSuccess(res);
      } else {
        verificationFailure(res, ip);
      }
    })
    .catch(error => {
      console.error('Error al guardar la información del usuario:', error);
      captchaFailure(res, ip);
    });
}

// Función para registrar solicitudes por IP
function registerRequest(ip) {
  if (!requestLog[ip]) {
    requestLog[ip] = { count: 1, timestamp: Date.now() };
  } else {
    const now = Date.now();
    if (now - requestLog[ip].timestamp > 60000) { // Si ha pasado más de 1 minuto, reiniciar el contador
      requestLog[ip] = { count: 1, timestamp: now };
    } else {
      requestLog[ip].count++;
    }
  }
}

// Función para realizar una verificación más robusta
function performVerification(ip, userAgent) {
  // Implementa una lógica de verificación más robusta aquí
  const success = Math.random() < 0.1; // 80% de probabilidad de éxito
  return { success };
}

// Función para manejar una verificación exitosa
function verificationSuccess(res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Verificación exitosa. ¡Bienvenido!');
}

// Función para manejar una verificación fallida
function verificationFailure(res, ip) {
  console.log(`Verificación fallida para la IP: ${ip}`);
  const redirectUrl = 'http://example.com/failure'; // URL de redirección para verificaciones fallidas
  res.writeHead(302, { 'Location': redirectUrl });
  res.end();
}

// Función para manejar la solicitud de guardar información del usuario
function saveUserData(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    const { ip, userAgent } = JSON.parse(body);
    saveUserInfo(ip, userAgent)
      .then(() => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Información del usuario guardada correctamente.');
      })
      .catch(error => {
        console.error('Error al guardar la información del usuario:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error al guardar la información del usuario.');
      });
  });
}

// Función para manejar el fallo del captcha
function captchaFailure(res, ip) {
  res.writeHead(302, { 'Location': 'http://localhost:3000/captcha-failure' });
  res.end();
  fs.appendFileSync('./data/alert.js', `module.exports = '${ip}';\n`);
}

const server = http.createServer((req, res) => {
  const reqUrl = url.parse(req.url, true);
  if (reqUrl.pathname === '/') {
    const html = fs.readFileSync('./public/index.html', 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else if (reqUrl.pathname === '/verify') {
    verifyUser(req, res);
  } else if (reqUrl.pathname === '/saveUserInfo' && req.method === 'POST') {
    saveUserData(req, res);
  } else if (reqUrl.pathname === '/grafy') { // Ruta para grafy.html
    const grafyHtml = fs.readFileSync('./public/grafy.html', 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(grafyHtml);
  } else if (reqUrl.pathname === '/data/alert.js') { // Ruta para alert.js
    const alertJs = fs.readFileSync('./data/alert.js', 'utf8'); // Lee el contenido del archivo alert.js
    res.writeHead(200, { 'Content-Type': 'text/javascript' }); // Establece el tipo de contenido como JavaScript
    res.end(alertJs); // Envía el contenido del archivo alert.js en la respuesta
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});


// Iniciar el servidor en el puerto 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
