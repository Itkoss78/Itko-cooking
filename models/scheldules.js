const mongoose = require("mongoose");

const schelduleSchema = new mongoose.Schema(
    {
        receipeName: String,
        schelduleDate: {
            type: Date
        },
        user: String,
        time: Number,
        date: {
            type: Date,
            default: Date.now()
        }

    }
);


module.exports = mongoose.model("Scheldule",schelduleSchema)