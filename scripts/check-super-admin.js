const mongoose = require("mongoose");
mongoose.connect("mongodb://webfaisalbd:R6fVp4V9hV33kYdZ@127.0.0.1:27017/cws?authSource=admin").then(async () => {
  const users = await mongoose.connection.db.collection("users").find({role: "super_admin"}).toArray();
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
