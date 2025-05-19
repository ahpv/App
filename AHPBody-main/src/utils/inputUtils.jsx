export const formatValue = (value) => {
    if (value === 1) return "1";
    const fractionPairs = [
        { fraction: "1/9", value: 1 / 9 },
        { fraction: "1/8", value: 1 / 8 },
        { fraction: "1/7", value: 1 / 7 },
        { fraction: "1/6", value: 1 / 6 },
        { fraction: "1/5", value: 1 / 5 },
        { fraction: "1/4", value: 1 / 4 },
        { fraction: "1/3", value: 1 / 3 },
        { fraction: "1/2", value: 1 / 2 },
        { fraction: "2", value: 2 },
        { fraction: "3", value: 3 },
        { fraction: "4", value: 4 },
        { fraction: "5", value: 5 },
        { fraction: "6", value: 6 },
        { fraction: "7", value: 7 },
        { fraction: "8", value: 8 },
        { fraction: "9", value: 9 },
    ];
    for (const pair of fractionPairs) {
        if (Math.abs(value - pair.value) < 0.01) return pair.fraction;
    }
    return value.toFixed(4);
};

export const parseInput = (input) => {
    if (!input) return null;
    input = input.trim();
    if (input.includes('/')) {
        const [numerator, denominator] = input.split('/').map(Number);
        if (denominator === 0 || isNaN(numerator) || isNaN(denominator)) return null;
        return numerator / denominator;
    }
    const value = parseFloat(input);
    return isNaN(value) ? null : value;
};