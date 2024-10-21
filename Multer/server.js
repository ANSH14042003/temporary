const express = require("express");
const app = express();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const maxSize = 100* 1024 * 1024;
const session = require('express-session')



//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname,'public')))
app.use(session({
    saveUninitialized:true,
    resave:false,
    secret:'abc'
}))

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(file);
    cb(null, path.join(__dirname, "public/images"));
  },
  filename: (req, file, cb) => {
    const fileType = path.extname(file.originalname);
    var name = Date.now() + fileType;
    cb(null, name);
  },
});

const filter = (req, file, cb) => {
  var ext = file.mimetype.split("/")[1];
  if (ext === "jpeg" || ext == "jpg" || ext == "pdf") {
    cb(null, true);
  } else {
    cb(new Error("File Type not supported"));
  }
};
const upload = multer({
  storage: storage,
  fileFilter: filter,
  limits: { fileSize: maxSize },
});

function auth(req,res,next){
    if(req.session.user){
        console.log(req.session.user)
        next()
    }
    else{
        res.redirect('/login')
    }
   
}

function adminAuth(req,res,next){
  if(req.session.user && req.session.role=='admin'){
    next()
  }
  else{
    res.status(403).send('Access Denied');
  }
}

app.get('/home',auth,(req,res)=>{
    res.sendFile(path.join(__dirname,'./public/dashboard.html'))
})

app.get('/login',(req,res)=>{
    res.sendFile(path.join(__dirname,'./public/index.html'))
})

app.get('/public/admin',adminAuth,(req,res)=>{
  res.sendFile(path.join(__dirname,'./public/admin.html'))
})

app.get("/public/user",(req,res)=>{
  res.sendFile(path.join(__dirname,'./public/user.html'))
})

app.get('public/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/home')
})

app.get('/showUser',(req,res)=>{
  const filePath = path.join(__dirname,'users.json')
  const fileData = fs.readFileSync(filePath,'utf-8')
  // console.log(fileData)
  const userData = JSON.parse(fileData)
  res.json(userData)
  
})


app.get('/dashboard', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, './public/dashboard.html'));
    } else {
        res.redirect('/login');
    }
});

app.post('/Upload',upload.single('upload'),(req,res)=>{
    
   let {name,password} = req.body;
   fs.readFile(path.join(__dirname,'users.json'),'utf-8',(err,data)=>{
    if(err){
        console.log(err)
        return res.status(500).send('Error reading users file');
    }
     data = JSON.parse(data)
    let userData = data.filter(ele=>ele.name==name && ele.password==password)
    console.log(userData)
    if(userData.length>0){
        console.log('User Exists')
        req.session.user=name;
        req.session.role = userData[0].role;
        console.log(req.session.user)
      res.redirect('/home')
    }
    else{
        console.log('User Does not Exists')
        res.status(401).send('User does not exist')
    }
   })
    
})






app.listen(3000,(err,data)=>{
    console.log(`Server is running at PORT 3000`)
})
