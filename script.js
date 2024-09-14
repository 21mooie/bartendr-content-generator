const axios = require('axios');
const debug = require('debug')('app:script');

const Users = require('./Users');
const Interact = require("./Interact");
const { statusRequestConfig } = require("./utils");
const Comments = require("./Comments");
const bartendrUrl = process.env.BARTENDR_URL;

function run() {
    setInterval(async () => {
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
        const comments = await new Promise(resolve => {
            setTimeout(() => {
                Comments.getAllComments(users).then(result => resolve(result));
            }, time);
        });

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

        // interact with content
        await new Promise(resolve => {
            setTimeout(() => {
                Interact.makeUsersInteract(users, statuses);
                resolve();
            }, time)
        });


        // reply to some existing content
        await new Promise(resolve => {
            setTimeout(() => {
                Comments.makeUsersReplyToComments(users, statuses);
                resolve();
            }, time);
        });
    }, 1000);
}

const dryrun = process.argv[2] === '--dryrun';
if(dryrun){
    debug('Dryrun running...');
}
const time = +process.env.TIME_TO_WAIT;
run();

