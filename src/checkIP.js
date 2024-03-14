// checkIP.js
function checkIP(ip) {
    // Ejemplo de lista de IPs permitidas
    const allowedIPs = ['192.168.0.1', '127.0.0.1'];
  
    // Verificar si la IP está en la lista de IPs permitidas
    return allowedIPs.includes(ip);
  }
  
  module.exports = checkIP;
  