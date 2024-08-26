const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
const OpenAI = require("openai");

const interact = require("./interact");
const { statusRequestConfig } = require("./utils");

const openai = new OpenAI(process.env.OPENAI_API_KEY);
const bartendrUrl = process.env.BARTENDR_URL;

async function run() {


    async function generateAndSaveContent(){
        async function generateContent() {
            const prompt = "Give me one post a user may write on a social media app about cocktails and nightlife";
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            return text;


            // const completion = await openai.chat.completions.create({
            //     messages: [{ role: "system", content: "You are a helpful assistant." }],
            //     model: "gpt-4o-mini",
            // });

            // console.log(completion.choices[0]);
        }
        
        const content = await generateContent();
        console.log(content);
        // const uid = 'f4f85803-e187-4270-8323-42bc69410cca';

        // const statusRequestBody = {
        //     "content": "Here's a new status again again",
        //     "replyTo": null,
        //     "uid": uid,
        // };
        // const response = await axios.post(`${bartendrUrl}/users/status?statusOwnerUid=${uid}`, statusRequestBody, statusRequestConfig);
    }

    while (true) {
        // create some new users

        // pick some existing users/new users
        const uids = ['f4f85803-e187-4270-8323-42bc69410cca'];
        
        // create content with users
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

