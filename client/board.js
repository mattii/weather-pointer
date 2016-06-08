const fs = require('fs');

exports.getSerialNumber = function() {
    return fs.readFileSync('/factory/serial_number', 'utf8').replace(/\n$/, '');
}
