const axios = require('axios');
const { CognitoUserAttribute } = require('amazon-cognito-identity-js');
const { generateUsername } = require("unique-username-generator");
const debug = require('debug')('app:Users');
const { linenumber } = require('@everymundo/linenumber');

const UserPool = require("./UserPool");
const { statusRequestConfig } = require('./utils');


class Users {
    constructor() {
        this.cognitoUserPool = UserPool;
        this.bartendrUrl = process.env.BARTENDR_URL;
    }

    async createNewUsers(numUsers){
        const promises = [];
        for (let i=0; i<numUsers; i++){
            // TODO: set timeout so each one isn't created right after another
            promises.push(new Promise((resolveUser, rejectUser) => {
                this.createUser(resolveUser, rejectUser);
            }));
        }

        return Promise.allSettled(promises)
            .then(results => {
                return results.filter((result) => result.status === 'fulfilled').map((result) => result.value);
            }).catch(err => debug(`Line: ${linenumber()}\nError creating users ${err}`));
    }

    createUser(resolveUser, rejectUser){
        const registerUser = async (username, email) => {
            let data;
            try {
                let response = await axios.post(
                    `${this.bartendrUrl}/register`,
                    {
                        registration: {
                            username,
                            email,
                            first_name: "Bob",
                            middle_name: "Martinez",
                            last_name: "Lopez",
                            gender: Math.random() < 0.5 ? 'MALE' : 'FEMALE',
                            isBot: true,
                        }
                    },
                    statusRequestConfig
                );
                data = response.data;
            } catch (err) {
                debug(`Line: ${linenumber()}\nError registering user\n${err}`);
                throw err;
            }
            return data;
        }

        const createAWSCognitoUser = () => {
            const attributeList = [];
            const email = 'user@example.com';
            const dataEmail = {
                Name : 'email',
                Value : email,
            };

            const attributeEmail = new CognitoUserAttribute(dataEmail);

            attributeList.push(attributeEmail);
            
            // TODO: generage better usernames
            const username = generateUsername("",3,20);
            
            this.cognitoUserPool.signUp(username, 'Password1!', attributeList, null, async (err, result) => {
                if (err) {
                    debug(`Line: ${linenumber()}\nError signing up user to cognito\n${err}`);
                    rejectUser(err);
                    return;
                }
                const cognitoUser = result.user;
                debug('User signed to cognito' + cognitoUser.getUsername());
                const response = await registerUser(cognitoUser.getUsername(), email);
                resolveUser(response.state);
            });
        };

        createAWSCognitoUser();
    }
}

module.exports = new Users();