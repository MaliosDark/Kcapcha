// saveUserInfo.js
const fs = require('fs');

function saveUserInfo(ip, userAgent) {
  return new Promise((resolve, reject) => {
    // Guardar la información del usuario en visitors.js
    const visitor = {
      ip: ip,
      userAgent: userAgent
    };
    fs.appendFile('./data/visitors.js', `module.exports = ${JSON.stringify(visitor)};\n`, (err) => {
      if (err) {
        reject(err);
      } else {
        // Guardar la dirección IP en alert.js
        fs.appendFile('./data/alert.js', `module.exports = '${ip}';\n`, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }
    });
  });
}

module.exports = saveUserInfo;
