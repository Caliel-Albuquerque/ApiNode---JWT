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
  const { ponto: { data, entrada, intervalo, volta, saida } } = req.body

  const updateUser = await User.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $push: { ponto: { data, entrada, intervalo, volta, saida } } },
    { new: true }
  );

  if (!data || !entrada || !intervalo || !volta || !saida) {
    return res.status(404).json({ msg: 'Erro ao cadastrar ponto' })
  }


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

//update intervalo
app.put('/user/:id/updateBreak', checkToken, async (req, res) => {
  const id = req.params.id;
  const { intervalo } = req.body;

  try {
    const updateUser = await User.findById(id);
    if (!updateUser) {
      return res.status(404).json({ msg: 'Usuario não encontrado' });
    }

    const lastPointIndex = updateUser.ponto.length - 1;
    updateUser.ponto[lastPointIndex].intervalo = intervalo;

    await updateUser.save();

    res.status(200).json({ msg: 'Campo "intervalo" atualizado' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Erro ao atualizar o campo "intervalo"' });
  }
});

//update volta do intervalo
app.put('/user/:id/updateBreakLast', checkToken, async (req, res) => {
  const id = req.params.id;
  const { volta } = req.body;

  try {
    const updateUser = await User.findById(id);
    if (!updateUser) {
      return res.status(404).json({ msg: 'Usuario não encontrado' });
    }

    const lastPointIndex = updateUser.ponto.length - 1;
    updateUser.ponto[lastPointIndex].volta = volta;

    await updateUser.save();

    res.status(200).json({ msg: 'Campo "volta" atualizado' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Erro ao atualizar o campo "volta"' });
  }
});

//Adicionar ausencia
app.post('/user/:id/ausencia', checkToken, async (req, res) => {
  const id = req.params.id;
  const { ausencia: { dia, motivo, explicacao, arquivo, statusAusencia } } = req.body;

  const updateAusencia = await User.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $push: { ausencia: { dia, motivo, explicacao, arquivo, statusAusencia } } },
    { new: true }
  );

  if (!dia) {
    return res.status(404).json({ msg: 'O dia não foi imformado' })
  }
  if (!motivo) {
    return res.status(404).json({ msg: 'O motivo não foi imformado' })
  }
  if (!explicacao) {
    return res.status(404).json({ msg: 'a EXPLICAÇÃO não foi imformado' })
  }
  if (!dia) {
    return res.status(404).json({ msg: 'O dia não foi imformado' })
  }
  if (!arquivo) {
    return res.status(404).json({ msg: 'O arquivo não foi imformado' })
  }


  if (updateAusencia) {
    res.status(200).json({ msg: 'Ausência cadastrado' })
  } else {
    res.status(404).json({ msg: 'Ausência não cadastrado' })
  }
})

//Mudar status Ausencia
app.put('/user/:id/updateStatusAusencia', async (req, res) => {
  const id = req.params.id;
  const { statusAusencia } = req.body;

  try {
    const updateUser = await User.findById(id);
    if (!updateUser) {
      return res.status(404).json({ msg: 'Usuario não encontrado' });
    }

    const lastAusenciaIndex = updateUser.ausencia.length - 1;
    updateUser.ausencia[lastAusenciaIndex].statusAusencia = statusAusencia;

    await updateUser.save();

    res.status(200).json({ msg: 'Campo "status" atualizado' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Erro ao atualizar o campo "status"' });
  }
})

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

//Create Ferias
app.put('/user/:id/updateFerias', async (req, res) => {
  const id = req.params.id
  const { ferias: { inicio, fim, status, dias } } = req.body

  const updateUser = await User.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $push: { ferias: { inicio, fim, status, dias } } },
    { new: true }
  );

  if (!inicio || !fim || !status || !dias) {
    return res.status(404).json({ msg: 'Erro ao cadastrar ferias' })
  }


  if (updateUser) {
    res.status(200).json({ msg: 'Ferias cadastrada' })
  } else {
    res.status(404).json({ msg: 'Ferias não cadastrada' })
  }
})


//update ContraCheque 
app.put('/user/:id/updateFinanceiro', async (req, res) => {
  const id = req.params.id
  const { contracheque: { diaArquivo, arquivoContracheque } } = req.body

  const updateUser = await User.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $push: { contracheque: { diaArquivo, arquivoContracheque } } },
    { new: true }
  );

  if (!diaArquivo || !arquivoContracheque) {
    return res.status(404).json({ msg: 'Erro ao cadastrar contracheque' })
  }


  if (updateUser) {
    res.status(200).json({ msg: 'contracheque cadastrado' })
  } else {
    res.status(404).json({ msg: 'contracheque não cadastrado' })
  }
})



//Register User 
app.post("/auth/register", async (req, res) => {

  const { name, email, password, confirmpassword, ponto: [{ data, entrada, intervalo, volta, saida }],
    ferias: [{ inicio, fim, status, dias }], ausencia: [{ dia, motivo, explicacao, arquivo, statusAusencia }], contracheque: [{ diaAquivo, arquivoContracheque }] } = req.body

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
    ponto: [{ data, entrada, intervalo, volta, saida }],
    ausencia: [{ dia, motivo, explicacao, arquivo, statusAusencia }],
    contracheque: [{ diaAquivo, arquivoContracheque }]
  })

  try {

    await user.save()

    res.status(201).json({ msg: 'usuario criado com sucesso' })


  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: 'aconteceu um erro, tente novamente mais tarde' })
  }

})

//upate user
app.put('/user/update/:id', async (req, res) => {
  User.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .then(usuarioAtualizado => res.json(usuarioAtualizado))
    .catch(err => res.status(500).json({ error: err.message }))
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
    const idUser = user.id
    const token = jwt.sign({
      id: user.id,

    }, secret)

    res.status(200).json({ msg: 'Autenticação com sucesso', token, idUser })

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


