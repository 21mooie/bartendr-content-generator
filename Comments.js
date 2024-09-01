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
        const statuses = await this.generateStatuses();
        const promises = [];
        statuses.forEach(status => {
            const user = users[getRandomInt(users.length)];
            promises.push(new Promise((resolveStatus, rejectStatus) => this.postStatus(user, status, resolveStatus, rejectStatus)));           
        });

        return Promise.allSettled(promises)
            .then(results => results.filter((result) => result.status === 'fulfilled' && result.value.success === 'SUCCESSFULLY_POST_COMMENTS').map((result) => result.value))
            .catch(err => debug(`Line: ${linenumber()}\nError creating statuses ${err}`));
    }

    async postStatus(user, status, resolveStatus, rejectStatus) {
        let data;
        try {
            const result = await axios.post(
                `${this.bartendrUrl}/users/status`,
                {
                    content: status,
                    replyTo: null,
                    uid: user.uid,
                    isBot: true,
                },
                {
                    params: { statusOwnerUid: user.uid },
                    headers: {...statusRequestConfig.headers},
                }
            );
            data = result.data;
        } catch (err) {
            debug(`Line: ${linenumber()}\nError adding status\n${err}\n Status: ${status}\nUser: ${JSON.stringify(user)}`);
            rejectStatus({});
        }
        resolveStatus(data);
    }

    async generateAndSaveContent(){
        async function generateContent() {
            // const prompt = "Give me one sentence a user may write on a social media app about cocktails and nightlife and don't use any phrases such as  [name of cocktail]";
            const prompt = "Write one comment a user may post about margaritas. The comment should be a story about their favorite time drinking this."
            // const prompt = "Give me a couple prompts I can use to ask gemini ai to generate comments for a social media application"
            // const prompt = `"I'm posting about [topic/event] on [social media platform].  Generate 5 comments that are [positive/negative/neutral] and focus on [specific aspect of the topic/event].  For example, use [keywords] and be [formal/informal/funny] in tone."`;
            // const prompt = 'Write one post of what a user may post on a social media app and do not include hashtags'

        }
    }

    async generateStatuses(){
        let responses = [];
        try {
            const prompts = [
                "Give me ten different statuses a user may write on a social media app and be specific about any names used in the status but do not use asterisks and it is ok to use emojis but not in every status. Make sure each status has a | after it except the last one and do not number the statuses.",
                "Give me ten different statuses a user may write on a social media app about nightlife and cocktails and be specific about any names of bars or names of drinks used in the status but do not use asterisks and it is ok to use emojis but not in every status. Make sure each status has a | after it except the last one and do not number the statuses."
            ];
            const prompt = prompts[getRandomInt(prompts.length)];
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            responses = text.split('|').map(val => val.trim());
        } catch (err) {
            debug(`Line: ${linenumber()}\nError generating status\n${err}`);
        }
        return responses;
    }
}

module.exports = new Comments();
