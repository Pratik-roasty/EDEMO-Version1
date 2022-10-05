const userSchema=new mongoose.Schema({
    username: String,
    password: String,
    name: String,
    email: String,
});

userSchema.plugin(passportLocalMongoose);
const User=new mongoose.model("User",userSchema);
