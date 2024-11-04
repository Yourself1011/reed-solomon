import { GFNumber } from "./gf";

export const polyLongDiv = (dividend: GFNumber[], divisor: GFNumber[]) => {
    const steps: GFNumber[][] = [];
    const diffs: GFNumber[][] = [];
    const quotient = [];

    let multi = GFNumber.div(dividend[0], divisor[0]);
    quotient.push(multi);
    steps.push(
        [...divisor]
            .map((d) => d.mult(multi))
            .concat(Array(dividend.length - divisor.length).fill(new GFNumber(0)))
    );
    diffs.push([...dividend].map((n, i) => n.sub(steps[steps.length - 1][i])));

    for (let i = 1; i < dividend.length - (divisor.length - 1); i++) {
        multi = GFNumber.div(diffs[diffs.length - 1][i], divisor[0]);
        quotient.push(multi);
        steps.push(
            [...Array(i).fill(new GFNumber(0)), ...divisor]
                .map((d) => d.mult(multi))
                .concat(Array(dividend.length - divisor.length - i).fill(0))
        );
        diffs.push([...diffs[diffs.length - 1]].map((n, i) => n.sub(steps[steps.length - 1][i])));
    }

    return {
        steps,
        diffs,
        quotient,
        remainder: diffs[diffs.length - 1].slice(dividend.length - divisor.length + 1),
    };
};

export const polyMul = (a: GFNumber[], b: GFNumber[]) => {
    const res = Array(b.length - 1).fill(new GFNumber(0));
    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b.length; j++) {
            if (j == b.length - 1) res.push(a[i].mult(b[j]));
            else res[i + j] = res[i + j].add(a[i].mult(b[j]));
        }
    }

    return res;
};

export const polyText = (
    p: (GFNumber | string)[],
    options?: { sep?: string; start?: number; end?: number; skipZero?: boolean }
) => {
    const { sep, start, end, skipZero } = options ?? {};
    return p
        .map((n, i) =>
            (start && i < start) || (end && i >= end) || (skipZero && n.valueOf() == 0)
                ? ""
                : ((typeof n === "string" || n.valueOf() >= 0) && i != (start ?? 0) ? "+" : "") +
                  (i == p.length - 1
                      ? n
                      : `${n.valueOf() == 1 ? "" : n.valueOf() == -1 ? "-" : n}x^{${
                            i == p.length - 2 ? "" : p.length - 1 - i
                        }}`)
        )
        .join(sep ?? "");
};

// naive method
// export const evalPoly = (p: GFNumber[], x: GFNumber) => {
//     let sum = new GFNumber(0);
//     for (let i = 0; i < p.length; i++) {
//         sum = sum.add(GFNumber.mult(p[i], x.pow(p.length - i - 1)));
//     }

//     return sum;
// };

// horner's method
export const evalPoly = (p: GFNumber[], x: GFNumber) => {
    let sum = new GFNumber(0);
    for (let i = 0; i < p.length; i++) {
        sum = sum.mult(x).add(p[i]);
    }

    return sum;
};

export let g: GFNumber[] = [new GFNumber(1)];
export let gRoots: GFNumber[] = [];

export const generateG = (redundantCharacters: number) => {
    g = [new GFNumber(1)];
    gRoots = [];

    for (let i = 0; i < redundantCharacters; i++) {
        g.push(new GFNumber(0));
        const root = new GFNumber(2).pow(i);
        for (let j = g.length - 2; j >= 0; j--) {
            g[j + 1] = g[j + 1].add(g[j].mult(root));
        }
        gRoots.push(root);
    }
};
