//Imports
require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const { ObjectId } = require('mongodb');
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const cors = require('cors');

const app = express()

//Accept JSON response 
app.use(express.json())
app.use(cors());
//Models 
const User = require("./models/User")

//Public Route 
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Success" })
})

app.get("/users", async (req, res) => {

  const users = await User.find({})

  if (!users || users.length == 0) {
    res.status(404).json({ msg: 'Algo deu errado' })
  }

  res.status(200).json(users)

})

//Private Route
app.get('/user/:id', checkToken, async (req, res) => {
  const id = req.params.id

  // check if user exists 
  const user = await User.findById(id, '-password')

  if (!user) {
    return res.status(404).json({ msg: 'Usurio não encontrado' })
  }

  res.status(200).json({ msg: user })
})

//update entrada
app.put('/user/:id/updatePoint', checkToken, async (req, res) => {
  const id = req.params.id
  const { ponto: { data, entrada, saida } } = req.body

  const updateUser = await User.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $push: { ponto: { data, entrada, saida } } },
    { new: true }
  );

  if (updateUser) {
    res.status(200).json({ msg: 'Ponto cadastrado' })
  } else {
    res.status(404).json({ msg: 'Ponto não cadastrado' })
  }
})

//update saida
app.put('/user/:id/updateLastPoint', checkToken, async (req, res) => {
  const id = req.params.id;
  const { saida } = req.body;

  try {
    const updateUser = await User.findById(id);
    if (!updateUser) {
      return res.status(404).json({ msg: 'Usuario não encontrado' });
    }

    const lastPointIndex = updateUser.ponto.length - 1;
    updateUser.ponto[lastPointIndex].saida = saida;

    await updateUser.save();

    res.status(200).json({ msg: 'Campo "saida" atualizado' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Erro ao atualizar o campo "saida"' });
  }
});

//middleware token
function checkToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(403).json({ msg: 'Acesso negado!' })
  }

  try {

    const secret = process.env.SECRET

    jwt.verify(token, secret)

    next()
  } catch (err) {
    console.log(err)
    res.status(500).json({ msg: 'Token invalido' })
  }
}

//Register User 
app.post("/auth/register", async (req, res) => {

  const { name, email, password, confirmpassword, ponto: [{ data, entrada, saida }],
    ferias: [{ inicio, fim, status, dias }] } = req.body

  //validate

  if (!name) {
    return res.status(422).json({ msg: "O nome deve ser informado" })
  }

  if (!email) {
    return res.status(422).json({ msg: "O email deve ser informado" })
  }

  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatoria" })
  }

  if (password != confirmpassword) {
    return res.status(422).json({ msg: "As senhas estão diferentes" })
  }

  //check if user is already registered
  const userExist = await User.findOne({ email: email })

  if (userExist) {
    return res.status(422).json({ msg: "Esse email já existe" })
  }

  //create password
  const salt = await bcrypt.genSalt(12)
  const passwordHash = await bcrypt.hash(password, salt)


  //create user 

  const user = new User({
    name,
    password: passwordHash,
    email,
    ferias: [{ inicio, fim, status, dias }],
    ponto: [{ data, entrada, saida }]
  })

  try {

    await user.save()

    res.status(201).json({ msg: 'usuario criado com sucesso' })


  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: 'aconteceu um erro, tente novamente mais tarde' })
  }

})

//Login user 

app.post('/auth/user', async (req, res) => {
  const { email, password } = req.body

  //Validate

  if (!email) {
    return res.status(422).json({ msg: 'Email é obrigatorio' })
  }

  if (!password) {
    return res.status(422).json({ msg: 'Senha é obrigatorio' })
  }

  //User exist

  const user = await User.findOne({ email: email })

  if (!user) {
    return res.status(404).json({ msg: 'O usuario não existe' })
  }

  //Compare password

  const checkPassword = bcrypt.compare(password, user.password)

  if (!checkPassword) {
    return res.status(422).json({ msg: 'Senha invalida' })
  }


  try {

    const secret = process.env.SECRET

    const token = jwt.sign({
      id: user.id,

    }, secret)

    res.status(200).json({ msg: 'Autenticação com sucesso', token })

  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: 'Algo de errado' })
  }
})


//Credentials
const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS


mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.q3weozz.mongodb.net/?retryWrites=true&w=majority`).then(
  app.listen(3000),
  console.log("Banco Conectado!")
).catch((err) => { console.error(err) })


