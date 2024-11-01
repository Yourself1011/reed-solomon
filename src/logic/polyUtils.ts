export const polyLongDiv = (dividend: number[], divisor: number[]) => {
    const steps: number[][] = [];
    const diffs: number[][] = [];
    const quotient = [];

    let multi = Math.floor(dividend[0] / divisor[0]);
    quotient.push(multi);
    steps.push(
        [...divisor].map((d) => d * multi).concat(Array(dividend.length - divisor.length).fill(0))
    );
    diffs.push([...dividend].map((n, i) => n - steps[steps.length - 1][i]));

    for (let i = 1; i < dividend.length - (divisor.length - 1); i++) {
        multi = Math.floor(diffs[diffs.length - 1][i] / divisor[0]);
        quotient.push(multi);
        steps.push(
            [...Array(i).fill(0), ...divisor]
                .map((d) => d * multi)
                .concat(Array(dividend.length - divisor.length - i).fill(0))
        );
        diffs.push([...diffs[diffs.length - 1]].map((n, i) => n - steps[steps.length - 1][i]));
    }

    return {
        steps,
        diffs,
        quotient,
        remainder: diffs[diffs.length - 1].slice(dividend.length - divisor.length + 1),
    };
};

export const polyText = (
    p: (number | string)[],
    options?: { sep?: string; start?: number; end?: number }
) => {
    const { sep, start, end } = options ?? {};
    return p
        .map((n, i) =>
            (start && i < start) || (end && i >= end)
                ? ""
                : ((typeof n === "string" || n >= 0) && i != (start ?? 0) ? "+" : "") +
                  (i == p.length - 1
                      ? n
                      : `${n == 1 ? "" : n == -1 ? "-" : n}x^{${
                            i == p.length - 2 ? "" : p.length - 1 - i
                        }}`)
        )
        .join(sep ?? "");
};

export const evalPoly = (p: number[], x: number) => {
    let sum = 0;
    for (let i = 0; i < p.length; i++) {
        sum += p[i] * x ** (p.length - i - 1);
    }

    return sum;
};

export let g = [1];
export let gRoots: number[] = [];

export const generateG = (redundantCharacters: number) => {
    g = [1];
    gRoots = [];

    for (let i = 0; i < redundantCharacters; i++) {
        g.push(0);
        for (let j = g.length - 2; j >= 0; j--) {
            g[j + 1] += g[j] * -(2 ** i);
        }
        gRoots.push(2 ** i);
    }
};
