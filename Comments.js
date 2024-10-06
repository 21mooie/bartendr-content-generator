const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getRandomInt, statusRequestConfig } = require("./utils");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
const debug = require('debug')('app:Comments');
const { linenumber } = require('@everymundo/linenumber');

class Comments {
    constructor() {
        this.bartendrUrl = process.env.BARTENDR_URL;
    }

    async makeUsersPostStatuses(users) {
        debug('Making users post statuses...');
        const statuses = await this.generateStatuses();
        if (!statuses || statuses.length === 0)
            return [];
        const promises = [];
        statuses.forEach(status => {
            const user = users[getRandomInt(users.length)];
            promises.push(new Promise((resolveStatus, rejectStatus) => this.postStatus(user, status, null, null, user.uid, resolveStatus, rejectStatus)));           
        });

        return Promise.allSettled(promises)
            .then(results => results.filter((result) => result.status === 'fulfilled' && result.value.success === 'SUCCESSFULLY_POST_COMMENTS').map((result) => result.value.comment))
            .catch(err => {
                debug(`Line: ${linenumber()}\nError creating statuses ${err}`);
                return [];
            });
    }

    async postStatus(user, status, replyTo, statusId, statusOwnerUid, resolveStatus, rejectStatus) {
        let data;
        const params = {
            statusOwnerUid,
        };
        if (statusId){
            params.statusId = statusId;
        }
        try {
            const result = await axios.post(
                `${this.bartendrUrl}/users/status`,
                {
                    content: status,
                    replyTo,
                    uid: user.uid,
                    isBot: true,
                },
                {
                    params,
                    headers: {...statusRequestConfig.headers},
                }
            );
            data = result.data;
        } catch (err) {
            const message = replyTo ? 'Error adding status reply' : 'Error adding status';
            debug(`Line: ${linenumber()}\n${message}\n${err}\n Status: ${status}\nUser: ${JSON.stringify(user)}`);
            rejectStatus({});
        }
        resolveStatus(data);
    }

    async makeUsersPostComments(users) {
        const promises = [];
        for (let i=0; i<10; i++){
            promises.push(new Promise((resolveStatus) => {
                setTimeout(async () => {
                    const drink = await this.findDrink()
                    const comments = await this.postAllComments(users, getRandomInt(users.length), drink, null);
                    resolveStatus(comments);
                }, 5000);
            }));
        }
        return Promise.allSettled(promises)
            .then(results => {
                const data = results.filter((result) => result.status === 'fulfilled' && result.value.length > 0).map(result => result.value.comment);
                const comments = data.map(value => value[getRandomInt(value.length)]);
                return comments;
            })
            .catch(err => {
                debug(`Line: ${linenumber()}\nError getting comments ${err}`);
                return [];
            });
    }

    async postComment(user, drink, content, replyTo) {
        try {
            const result = await axios.post(
                `${this.bartendrUrl}/cocktail/${drink.idDrink}/comment`,
                {
                    content,
                    replyTo,
                    uid: user.uid,
                },
                statusRequestConfig,
            );
            return result.data;
        } catch (err) {
            debug(`Line: ${linenumber()}\nError posting comment\n${err}`);
        }
    }

    async postAllComments(users, randomNumUsersToComment, drink, replyTo) {
        try {
            const comments = await this.generateComments(drink, randomNumUsersToComment);
            if (!comments || comments.length === 0)
                return [];
            const promises = [];
            for(let i=0; i<randomNumUsersToComment; i++) {
                const user = users[i];
                promises.push(new Promise((resolve) => this.postComment(user, drink, comments[i], replyTo).then(result => resolve(result)).catch(err => resolve({}))));
            }
            return Promise.allSettled(promises)
                .then(results => results.filter((result) => result.status === 'fulfilled' && result.value.success === 'SUCCESSFULLY_POST_COMMENTS').map((result) => result.value.comment)
                ).catch(err => debug(`Line: ${linenumber()}\nError posting all comments\n${err}`));
        } catch (err) {
            debug(`Line: ${linenumber()}\nError posting all comments\n${err}`);
        }
    }

    async generateStatuses(){
        try {
            const prompts = [
                "Give me ten different statuses a user may write on a social media app and be specific about any names used in the status but do not use asterisks and it is ok to use emojis but not in every status. Make sure each status has a | after it except the last one and do not number the statuses.",
                "Give me ten different statuses a user may write on a social media app about nightlife and cocktails and be specific about any names of bars or names of drinks used in the status but do not use asterisks and it is ok to use emojis but not in every status. Make sure each status has a | after it except the last one and do not number the statuses."
            ];
            const prompt = prompts[getRandomInt(prompts.length)];
            debug('Generating statuses');
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const responses = text.split('|').map(val => val.trim());
            return responses;
        } catch (err) {
            debug(`Line: ${linenumber()}\nError generating status\n${err}`);
        }
    }

    async generateComments(drink, numComments) {
        try {
            const prompt = `Generate ${numComments} different social media users may have to say about the drink ${drink.strDrink} such as how much they like it, the first time they tasted it, different ways they like to make it, or a funny story they have where they were drinking it but do not use asterisks and it is ok to use emojis but not in every status. Make sure each comment has a | after it except the last one and do not number the comments.`;
            debug('Generating comments');
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            return text.split('|').filter(val => val !== '').map(val => val.trim());
        } catch (err) {
            debug(`Line: ${linenumber()}\nError generating comments\n${err}`);
        } 
    }

    async generateReplies(comments) {
        try {
            let prompt = `Generate one reply a user may have to each to the following comments without asterisks and without stating the initial comment again and do not number the statuses:\n`;
            comments.forEach(comment => prompt += `${comment.content}\n`);
            debug('Generating replies');
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            let responses = text.split('\n').map(val => val.trim());
            responses.pop();
            return responses;
        } catch(err){
            debug(`Line: ${linenumber()}\nError generating reply\n${err}`);
        }
    }

    async getAllComments(users) {
        debug('Requesting comments...')
        const promises = [];
        for (let i=0; i<10; i++){
            promises.push(new Promise((resolveStatus) => {
                setTimeout(async () => {
                    const drink = await this.findDrink()
                    let comments = await this.getComments(drink);
                    resolveStatus(comments);
                }, 5000);
            }));
        }
        return Promise.allSettled(promises)
            .then(results => {
                const data = results.filter((result) => result.status === 'fulfilled' && result.value.length > 0).map(result => result.value);
                const comments = data.map(value => value[getRandomInt(value.length)]);
                return comments;
            })
            .catch(err => {
                debug(`Line: ${linenumber()}\nError getting comments ${err}`);
                return [];
            });
    }

    async getComments(drink) {
        try {
            const result = await axios.get(
                `${this.bartendrUrl}/cocktail/${drink.idDrink}/comment`,
                {
                    params: {
                        offset: 0,
                        limit: 10,
                    },
                    headers: { ...statusRequestConfig.headers },
                }
            );
            return result.data.results;
        } catch (err) {
            debug(`Line: ${linenumber()}\nError getting comments\n${err}`);
        }
    }

    async findDrink() {
        try {
            const response = await axios.get(
                `${this.bartendrUrl}/cocktail`,
                { headers: { ...statusRequestConfig.headers }, }
            );
            return response.data.drinks[0];
        } catch (err){
            debug(`Line: ${linenumber()}\nError getting drink\n${err}`);
        }
    }

    async getAllStatuses(users) {
        debug('Requesting Statuses...');
        const promises = [];
        users.forEach((user) => {
            promises.push(new Promise((resolveStatus) => {
                this.getStatuses(user, resolveStatus);
            }));
        });
        return Promise.allSettled(promises)
            .then(results => {
                const data = results.filter((result) => result.status === 'fulfilled' && result.value.statuses.length > 0).map(result => result.value);
                const statuses = data.map(value => value.statuses[getRandomInt(value.statuses.length)]);
                return statuses;
            })
            .catch(err => {
                debug(`Line: ${linenumber()}\nError getting statuses ${err}`);
                return [];
            })
    }

    async getStatuses(user, resolveStatus) {
        let data;
        try {
            const response = await axios.get(
                `${this.bartendrUrl}/users/statuses`,
                {
                    params: {
                        statusOwnerUid: user.uid,
                        offset: 0,
                        limit: 10,
                    },
                    headers: { ...statusRequestConfig.headers },
                });
            data = response.data;
        } catch (err) {
            debug(`Line: ${linenumber()}\nError getting status\n${err}\nUser: ${JSON.stringify(user)}`);
            data = { status: [], endOfData: true };
        }
        resolveStatus(data);
    }

    async makeUsersReplyToComments(users, statuses) {
        const replies = await this.generateReplies(statuses);
        if (!replies || replies.length === 0)
            return [];
        const promises = [];
        replies.forEach((reply, idx) => {
            const user = users[getRandomInt(users.length)];
            promises.push(new Promise((resolveStatus, rejectStatus) => this.postStatus(user, reply, statuses[idx].statusId, statuses[idx].statusId, statuses[idx].statusOwnerUid, resolveStatus, rejectStatus)));           
        });

        return Promise.allSettled(promises)
            .then(results => results.filter((result) => result.status === 'fulfilled' && result.value.success === 'SUCCESSFULLY_POST_COMMENTS').map((result) => result.value))
            .catch(err => debug(`Line: ${linenumber()}\nError creating statuses ${err}`));
    }
}

module.exports = new Comments();
