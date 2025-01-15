//tabela 36
const B1 = [
    {
        numeroCondutores: 2,
        Amperes: [
            { a: 14, mm: 1 },
            { a: 17.5, mm: 1.5 },
            { a: 24, mm: 2.5 },
            { a: 32, mm: 4 },
            { a: 41, mm: 6 },
            { a: 57, mm: 10 },
            { a: 76, mm: 16 },
        ],
    },
    {
        numeroCondutores: 3,
        Amperes: [
            { a: 12, mm: 1 },
            { a: 15.5, mm: 1.5 },
        ],
    },
];
// numeroCondutores geralmente é 2 na mono fase e neutro,
// quando bifasico é 3 fase, fase, neutro
export function getSessaoNominalbyAperes(amper, proximo, numeroCondutores = 2) {
    // Encontra o condutor correspondente ao número de condutores
    const condutor = B1.find(c => c.numeroCondutores === numeroCondutores);
    if (!condutor) {
        console.warn(`Nenhum condutor encontrado para ${numeroCondutores} condutores.`);
        return null;
    }
    // Encontra a seção com corrente maior que o valor fornecido
    const achou = condutor?.Amperes.find(item => item.a > amper);
    if (!achou) {
        console.warn(`Nenhuma seção encontrada para corrente maior que ${amper}A.`);
        return null;
    }
    // Encontra a posição do item encontrado
    const posicao = condutor?.Amperes.findIndex(item => item.mm === achou?.mm);
    if (posicao < 0 || posicao + proximo >= condutor.Amperes.length) {
        console.warn('Posição fora do intervalo permitido.');
        return null;
    }
    // Retorna o item correspondente ao deslocamento
    return condutor?.Amperes[posicao + proximo];
}
