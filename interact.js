
const axios = require("axios");
const { statusRequestConfig } = require("./utils");

const interact = async (uids, comments) => {
    // find comments to interact with
    const bartendrUrl = process.env.BARTENDR_URL;
    uids.forEach((uid) => {
        comments.forEach((comment) => {
            // in api, add logic to add interaction type

            // decide what type of comment and apply the interaction appropriately
            const interactionBody = {
                "type": "IDDRINK_COMMENT",
                "idDrink": comment.idDrink,
                "interaction": Math.random() < 0.5 ? 'LIKE' : 'DISLIKE',
                "commentId": comment.commentId,
                "uid": uid
            }
            setTimeout(async () => {
                try {
                    const response = await axios.post(`${bartendrUrl}/interactions`, interactionBody, statusRequestConfig);
                    console.log(response.data.results);
                } catch(err) {
                    console.error(err);
                }
            }, 1000)
        });
    });
};

module.exports = interact;
