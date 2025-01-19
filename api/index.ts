import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { calcularAmperagem } from './lib/calculaAmperagem.js'
import { calculaCapacidadeAjustada } from './lib/calculaCapacidadeAjustada.js'
import { calculaFatorCorrecaoFinal } from './lib/calculaFatorCorrecaoFinal.js'
import { dijuntores } from './lib/dijuntores.js'
import { getFatorCorrecaoAgrupamentoByCircuito } from './lib/getFatorCorrecaoAgrupamento.js'
import { getFatorCorrecaoTemperaturaByTemperaturaAmbiente } from './lib/getFatorCorrecaoTemperatura.js'
import { getSessaoNominalbyAperes } from './lib/getSessaoNominalbyAperes.js'
import { cors } from 'hono/cors'

interface CalcularRequestBody {
  metodo: string
  potencia: number
  voltagem: number
  temperaturaAmbiente: number
  numeroCircuitos: number
  proximoCabo: number
}

const app = new Hono()

app.use(
  '*',
  cors({
    origin: 'http://localhost:3000',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: false,
  })
)
app.get('/', c => {
  return c.json({
    mensaguem: 'Exemplo do para chuveiro de 7500 POST no post_exemple',
    post_exemple: {
      metodo: 'B1',
      potencia: 7500,
      voltagem: 220,
      temperaturaAmbiente: 40,
      numeroCircuitos: 1,
      proximoCabo: 0,
    },
  })
})

app.post('/calcular', async ctx => {
  const {
    metodo,
    potencia,
    voltagem,
    temperaturaAmbiente,
    numeroCircuitos,
    proximoCabo,
  } = (await ctx.req.json()) as CalcularRequestBody

  try {
    const title = `Potência: ${potencia}W a ${voltagem}V`
    const amperagem = calcularAmperagem(potencia, voltagem)

    const cabo = getSessaoNominalbyAperes(amperagem, Number(proximoCabo))
    if (!cabo) {
      throw new Error(
        'Nenhum cabo nominal encontrado para a corrente fornecida.'
      )
    }

    const fatorTemperatura =
      getFatorCorrecaoTemperaturaByTemperaturaAmbiente(temperaturaAmbiente)
    if (!fatorTemperatura) {
      throw new Error(
        'Nenhum fator de correção encontrado para a temperatura ambiente fornecida.'
      )
    }

    const fatorAgrupamento =
      getFatorCorrecaoAgrupamentoByCircuito(numeroCircuitos)
    if (!fatorAgrupamento) {
      throw new Error('Nenhum fator de agrupamento encontrado.')
    }

    const fatorCorrecaoFinal = calculaFatorCorrecaoFinal(
      fatorTemperatura.pvc,
      fatorAgrupamento.fator
    )
    const capacidadeAjustada = calculaCapacidadeAjustada(
      fatorCorrecaoFinal,
      cabo.a
    )

    const dijuntor = dijuntores(amperagem, capacidadeAjustada)

    const response = {
      title,
      metodo,
      amperagem,
      cabo: {
        mm: cabo.mm,
        capacidadeOriginal: cabo.a,
        capacidadeAjustada,
      },
      fatorTemperatura: fatorTemperatura.pvc,
      fatorAgrupamento: fatorAgrupamento.fator,
      fatorCorrecaoFinal,
      recomendacoes: {
        disjuntor:
          dijuntor || 'Nenhum disjuntor encontrado: mude para o próximo cabo.',
        mensagemCabo:
          capacidadeAjustada >= amperagem
            ? `Cabo adequado: Suporta até ${capacidadeAjustada.toFixed(2)}A, necessário: ${amperagem}A.`
            : `Cabo inadequado: Suporta até ${capacidadeAjustada.toFixed(2)}A, necessário: ${amperagem}A.`,
      },
    }

    return ctx.json(response)
  } catch (error) {
    return ctx.json({ error: error }, 400)
  }
})

const port = 3333
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
