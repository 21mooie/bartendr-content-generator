const axios = require('axios');
const debug = require('debug')('app:script');

const Users = require('./Users');
const interact = require("./interact");
const { statusRequestConfig } = require("./utils");
const Comments = require("./Comments");
const bartendrUrl = process.env.BARTENDR_URL;

async function run() {
    while (true) {

        // pick some existing users/new users
        const users = await new Promise((resolve) => {
            setTimeout(() => {
                Users.getUsers(10, 'random', 'isBot').then(result => resolve(result));
            }, time);
        });

        // create some new users
        if(!dryrun) {
            const newUsers = await new Promise((resolve) => {
                setTimeout(() => {
                    Users.createNewUsers(3).then(result => resolve(result));
                }, time);
            });
            users.push(...newUsers);    
        }

        // create content to post for cocktail comments
        const comments = [];

        // create statuses with users
        const statuses = await new Promise(resolve => {
            setTimeout(() => {
                Comments.getAllStatuses(users).then(result => resolve(result));
            }, time);
        })

        if(!dryrun) {
            const newStatuses = await new Promise(resolve => {
                setTimeout(() => {
                    Comments.makeUsersPostStatuses(users).then(result => resolve(result));
                }, time)
            });
            statuses.push(...newStatuses);
        }
        debug(statuses);


        // interact with content
        // await new Promise(resolve => {
        //     setTimeout(() => {
        //         interact(uids, comments);
        //         resolve();
        //     }, 5000)
        // });






        // reply to some existing content
    }
}

const dryrun = process.argv[2] === '--dryrun';
if(dryrun){
    debug('Dryrun running...');
}
const time = +process.env.TIME_TO_WAIT;
run();

