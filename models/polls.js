const pollSchema=new mongoose.Schema({
    title: String,
    candidates: Array,
    publisher: String,
    pollID: String,
    votes: [Number]
});

const Poll=new mongoose.model("Poll",pollSchema);