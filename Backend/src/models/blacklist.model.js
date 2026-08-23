const mongoose = require("mongoose")


const blacklistTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "token is required to be added in blacklist"]
    },
    createdAt: {
        type: Date,
        default: Date.now,
        // TTL index — auto-purges blacklisted tokens after 7 days, matching
        // the JWT expiry, so this collection doesn't grow forever.
        expires: 60 * 60 * 24 * 7,
    }
});

const tokenBlackListModel =mongoose.model("blacklistTokens",blacklistTokenSchema)

module.exports = tokenBlackListModel