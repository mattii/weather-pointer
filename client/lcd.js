const jsupm = require('jsupm_i2clcd');
const oled = new jsupm.EBOLED();


exports.writeText = function(text) {
    oled.clearScreenBuffer();
    oled.setCursor(1, 1);
    oled.setTextWrap(1);
    oled.write(text);
    oled.refresh();
}

exports.clearText = function() {
    oled.clearScreenBuffer();
    oled.refresh();
}
