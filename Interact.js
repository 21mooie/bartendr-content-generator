const axios                = require("axios");
const debug                = require('debug')('app:Interact');
const { linenumber }       = require('@everymundo/linenumber');

const {
    statusRequestConfig,
    getRandomInt,
    getRandomBoolean
}                          = require("./utils");

class Interact {
    constructor() {
        this.bartendrUrl = process.env.BARTENDR_URL;
    }

    async makeUsersInteract(users, comments) {
        const promises = [];
        comments.forEach(comment => {
            const user = users[getRandomInt(users.length)];
            promises.push(new Promise((resolveStatus, rejectStatus) => this.postInteraction(user, comment, 'RANDOM', resolveStatus, rejectStatus)));
        });

        return Promise.allSettled(promises)
            .then(results => results.filter(result => result.status === 'fulfilled' && result.value.status === 'SUCCESSFULLY_POST_INTERACTIONS').map(result => result.value))
            .catch(err => debug(`Line: ${linenumber()}\nError creating interactions ${err}`))
    }

    async postInteraction(user, comment, interactionToMake, resolveStatus, rejectStatus){
        const requestBody = {
            type: comment.idDrink ? "IDDRINK_COMMENT" : "STATUS_COMMENT",
            uid: user.uid,
        };

        switch(requestBody.type) {
            case 'IDDRINK_COMMENT': {
                requestBody.idDrink = comment.idDrink;
                requestBody.commentId = comment.commentId;
                break;
            }
            case 'STATUS_COMMENT': {
                requestBody.statusId = comment.statusId;
                requestBody.statusOwnerUid = comment.statusOwnerUid;
                requestBody.statusId = comment.statusId;
                requestBody.id = comment.statusId;
                break;
            }
            default: {
                rejectStatus(new Error(`Invalid comment type ${requestBody.type}`));
                break;
            }
        }

        requestBody.interaction = interactionToMake === 'RANDOM' ? getRandomBoolean() ? 'LIKE' : 'DISLIKE' : interactionToMake;
        let data;
        try {
            const response = await axios.post(`${this.bartendrUrl}/interactions`, requestBody, statusRequestConfig);
            data = response.data;
        } catch(err) {
            debug(`Line: ${linenumber()}\nError adding interaction\n${err}\n Comment: ${JSON.stringify(comment)}\nUser: ${JSON.stringify(user)}`);
            rejectStatus(err);
        }
        resolveStatus(data);
    }

    async getCollectionName(collectionInfo) {
        try {
            const response = await axios.get(
                `${this.bartendrUrl}/interactions/collectionName${collectionInfo}`,
                {
                    headers: { ...statusRequestConfig.headers },
                });
            return response.data;
        } catch (err) {
            debug(`Error:\n${err}`);
            return 'unknown';
        }
    }

    async logCollectionNameForStatusInteractions(statusInteractions) {
        statusInteractions.forEach(async(statusInteraction) => {
            delete statusInteraction.status;
            debug({
                statusId: statusInteraction.statusId,
                statusOwnerid: statusInteraction.statusOwnerUid,
                interactorUid: statusInteraction.uid,
                collectionName: await this.getCollectionName(`?type=STATUS_COMMENT&uid=${statusInteraction.statusOwnerUid}`),
                ...statusInteraction,
            });
        });
    }

    async logCollectionNameForCommentInteractions(commentInteractions) {
        commentInteractions.forEach(async(commentInteraction) => {
            delete commentInteraction.status;
            debug({
                ...commentInteraction,
                collectionName: await this.getCollectionName(`?type=IDDRINK_COMMENT&idDrink=${commentInteraction.idDrink}`),
            });
        });
    }
}

module.exports = new Interact();
