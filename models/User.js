const mongoose = require('mongoose')

const User = mongoose.model('User', {
  name: String,
  email: String,
  password: String,
  ponto: [{
    data: String,
    entrada: String,
    intervalo: String,
    volta: String,
    saida: String
  }],
  ferias:[{
    inicio: String,
    fim: String,
    status: Boolean,
    dias: Number,
  }],
  ausencia:[
    {
      dia: String,
      motivo: String,
      explicacao: String,
      arquivo: String,
      statusAusencia: Boolean
    }
  ],
  contracheque:[
    {
      diaArquivo: String,
      arquivoContracheque: String,
    }
  ]

})

module.exports = User