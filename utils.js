const statusRequestConfig = { 
    headers: {
        origin: 'https://bartender-dev.com',
        bypass: 'true',
    }
};

// max exclusive
const getRandomInt = (max) => Math.floor(Math.random() * max);

exports.statusRequestConfig = statusRequestConfig;
exports.getRandomInt = getRandomInt;
