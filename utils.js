const statusRequestConfig = { 
    headers: {
        origin: 'https://bartender-dev.com',
        bypass: 'true',
    }
};

// max exclusive
const getRandomInt = (max) => Math.floor(Math.random() * max);
const getRandomBoolean = () => Math.random() < 0.5;

exports.statusRequestConfig = statusRequestConfig;
exports.getRandomInt = getRandomInt;
exports.getRandomBoolean = getRandomBoolean;
