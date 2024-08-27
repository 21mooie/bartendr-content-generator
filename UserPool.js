const { CognitoUserPool } = require('amazon-cognito-identity-js');

const poolData = {
    UserPoolId: 'us-east-1_18vXdNjYT',
    ClientId: '39prti75ukn9no85f7n1i1l34c'
};

const UserPool = new CognitoUserPool(poolData);
module.exports = UserPool;