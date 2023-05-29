const mongoose = require('mongoose')

const User = mongoose.model('User', {
  name: String,
  email: String,
  password: String,
  ponto: [{
    data: String,
    entrada: String,
    saida: String
  }],
  ferias:[{
    inicio: String,
    fim: String,
    status: Boolean,
    dias: Number,
  }]

})

module.exports = User