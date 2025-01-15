export const calcularAmperagem = (potencia, voltagem) => {
    return Math.round((potencia / voltagem) * 100) / 100;
};
