const debug = require('debug')('app:script');

const Users = require('./Users');
const Interact = require('./Interact');
const Comments = require("./Comments");

async function run() {
    // pick some existing users/new users
    const users = await new Promise((resolve) => {
        setTimeout(() => {
            debug('Requesting Users...');
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
            debug('Requesting comments...');
            Comments.getAllComments().then(result => resolve(result));
        }, time);
    });

    if(!dryrun) {
        const newComments = await new Promise(resolve => {
            setTimeout(() => {
                debug('Generating comments...');
                Comments.makeUsersPostComments(users).then(result => resolve(result));
            }, time)
        });
        comments.push(...newComments);
    }

    // log collection names for discovery
    await new Promise(resolve => {
        debug('Logging comments being used...')
        Comments.logCollectionNameForComment(comments).then(resolve());
    });

    // create statuses with users
    const statuses = await new Promise(resolve => {
        setTimeout(() => {
            debug('Requesting Statuses...');
            Comments.getAllStatuses(users).then(result => resolve(result));
        }, time);
    })

    if(!dryrun) {
        const newStatuses = await new Promise(resolve => {
            setTimeout(() => {
                debug('Generating Statuses...');
                Comments.makeUsersPostStatuses(users).then(result => resolve(result));
            }, time)
        });
        statuses.push(...newStatuses);
    }

    // log collection names for discovery
    await new Promise(resolve => {
        debug('Logging statuses being used...')
        Comments.logCollectionNameForStatuses(statuses).then(() => {
            if (dryrun) {
                setTimeout(() => {
                    debug('Waiting 1 hour until next run...');
                    resolve();
                }, 1000);
            } else {
                resolve();
            }
        });
    });

    // interact with content
    if(!dryrun) {
        await new Promise(resolve => {
            setTimeout(() => {
                debug('Users interacting with comments...');
                Interact.makeUsersInteract(users, comments).then((results) => {
                    Interact.logCollectionNameForCommentInteractions(results).then(() => resolve());
                });
            }, time)
        });

        await new Promise(resolve => {
            setTimeout(() => {
                debug('Users interacting with statuses...');
                Interact.makeUsersInteract(users, statuses).then((results) => {
                    Interact.logCollectionNameForStatusInteractions(results).then(() => resolve());
                });
            }, time)
        });
    }


    // reply to some existing content
    if(!dryrun) {

        await new Promise(resolve => {
            setTimeout(() => {
                debug('Users replying to comments...');
                Comments.makeUsersReplyToComments(users, comments).then(results => {
                    Comments.logCollectionNameForCommentReplies(results).then(() => resolve());
                });
            }, time);
        });

        await new Promise(resolve => {
            setTimeout(() => {
                debug('Users replying to statuses...');
                Comments.makeUsersReplyToComments(users, statuses).then(results => {
                    Comments.logCollectionNameForStatusRelies(results).then(() => {
                        setTimeout(() => {
                            debug('Waiting 1 hour until next run...');
                            resolve();
                        }, 1000);
                    });
                });
                resolve();
            }, time);
        });
    }
    //1 hour in MS
    setTimeout(run, 3600000);
}

const dryrun = process.argv[2] === '--dryrun';
if(dryrun){
    debug('Dryrun running...');
}
const time = +process.env.TIME_TO_WAIT;
run();

