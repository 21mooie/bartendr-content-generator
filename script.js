const debug = require('debug')('app:script');

const Users = require('./Users');
const Interact = require('./Interact');
const Comments = require("./Comments");

async function run() {
    // pick some existing users/new users
    const users = await new Promise((resolve) => {
        setTimeout(() => {
            Users.getUsers(10, 'random', 'isBot').then(result => resolve(result));
        }, time);
    });
    // create some new users
    // if(!dryrun) {
    //     const newUsers = await new Promise((resolve) => {
    //         setTimeout(() => {
    //             Users.createNewUsers(3).then(result => resolve(result));
    //         }, time);
    //     });
    //     users.push(...newUsers);    
    // }

    // create content to post for cocktail comments
    const comments = await new Promise(resolve => {
        setTimeout(() => {
            Comments.getAllComments(users).then(result => resolve(result));
        }, time);
    });

    // if(!dryrun) {
    //     const newComments = await new Promise(resolve => {
    //         setTimeout(() => {
    //             Comments.makeUsersPostComments(users).then(result => resolve(result));
    //         }, time)
    //     });
    //     comments.push(...newComments);
    // }
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
    if(!dryrun) {
        await new Promise(resolve => {
            setTimeout(() => {
                Interact.makeUsersInteract(users, statuses).then(() => resolve());
            }, time)
        });

        await new Promise(resolve => {
            setTimeout(() => {
                Interact.makeUsersInteract(users, comments).then(() => resolve());
            }, time)
        });
    }


    // reply to some existing content
    if(!dryrun) {
        await new Promise(resolve => {
            setTimeout(() => {
                Comments.makeUsersReplyToComments(users, statuses);
                resolve();
            }, time);
        });

        // await new Promise(resolve => {
        //     setTimeout(() => {
        //         Comments.makeUsersReplyToComments(users, comments);
        //         resolve();
        //     }, time);
        // });
    }
    debug('Waiting 1 hour until next run');
    //1 hour in MS
    setTimeout(run, 3600000);
}

const dryrun = process.argv[2] === '--dryrun';
if(dryrun){
    debug('Dryrun running...');
}
const time = +process.env.TIME_TO_WAIT;
run();

