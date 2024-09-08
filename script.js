const axios = require('axios');
const debug = require('debug')('app:script');

const Users = require('./Users');
const interact = require("./interact");
const { statusRequestConfig } = require("./utils");
const Comments = require("./Comments");
const bartendrUrl = process.env.BARTENDR_URL;

async function run() {
    while (true) {
        const time = +process.env.TIME_TO_WAIT;

        // create some new users
        const newUsers = await new Promise((resolve) => {
            setTimeout(() => {
                Users.createNewUsers(3).then(result => resolve(result));
            }, time);
        });

        // pick some existing users/new users
        const users = await new Promise((resolve) => {
            setTimeout(() => {
                Users.getUsers(10, 'random', 'isBot').then(result => resolve(result));
            }, time);
        });

        users.push(...newUsers);

        
        // create content with users
        const statuses = await new Promise(resolve => {
            setTimeout(() => {
                Comments.makeUsersPostStatuses(users).then(result => resolve(result));
            }, time)
        });

        const statuses = await new Promise(resolve => {
            setTimeout(() => {
                Comments.getAllStatuses(users).then(result => resolve(result));
            }, time);
        })

        // await new Promise(resolve => {
        //     setTimeout(() => {
        //         generateAndSaveContent();
        //         resolve();
        //     }, 5000)
        // });

        // pick some new content and some existing content
        const cocktailCommentsResponse = await axios.get(`${bartendrUrl}/cocktail/178332/comment/?offset=0&limit=10`, statusRequestConfig);
        const comments = cocktailCommentsResponse.data.results;

        // interact with content
        await new Promise(resolve => {
            setTimeout(() => {
                interact(uids, comments);
                resolve();
            }, 5000)
        });

        // reply to some existing content
    }
}


run();

