import { GFNumber } from "./gf";
import { g, gRoots, polyLongDiv, polyText } from "./polyUtils";

export const encode = (
    message: string,
    redundantCharacters: number,
): [number[], string] => {
    const p = [];
    for (const char of message) {
        p.push(new GFNumber(char.charCodeAt(0)));
    }
    const pxs = [...p, ...Array(redundantCharacters).fill(new GFNumber(0))];

    const { steps, diffs, quotient, remainder } = polyLongDiv(pxs, g);

    let polyFormatted = "";
    for (let i = 0; i < steps.length; i++) {
        // steps[i] = steps[i].slice(i, p.length - g.length + i);
        // diffs[i] = diffs[i].slice(i, p.length - g.length + i);
        polyFormatted += `${polyText(steps[i], {
            start: i,
            end: g.length + i,
            // end: pxs.length,
            sep: "&",
        })}\\\\
        \\hline
        ${polyText(diffs[i], {
            start: i,
            end: g.length + i + 1,
            // end: pxs.length,
            sep: "&",
        })}\\\\`;
    }

    const f = [
        ...pxs.slice(0, -redundantCharacters),
        ...[...remainder].map((n) => -n),
    ];

    return [
        f,
        `
        \\begin{align}
        \\require{enclose}
        &\\text{Message in numbers: }${p.join(", ")} \\\\
        &\\text{Create a polynomial with those numbers as coefficients} \\\\
        p(x) &= ${polyText(p)} \\\\
        p(x)x^{${redundantCharacters}} &= ${polyText(pxs, {
            end: pxs.length - redundantCharacters,
        })} \\\\
        &\\text{Create another polynomial with predetermined power of two roots }${gRoots} \\\\
        g(x) &= ${gRoots.map((r) => (r.value == 0 ? "(x)" : `(x - ${r})`)).join("")} \\\\
             &= ${polyText(g)} \\\\
             \\\\
             & \\text{Divide } p(x)x^{${redundantCharacters}} \\text{ by } g(x)
             \\\\

        \\begin{split}
            ${polyText(g)} ) 
            ${"\\\\".repeat(steps.length * 2.4)}
        \\end{split}&
        \\begin{split}
            \\begin{array}{@{}r}
            ${"&".repeat(g.length - 1) + polyText(quotient, { sep: "&" })} \\\\
            \\hline
            ${polyText(pxs, { sep: "&" })} \\\\
            ${polyFormatted}
            \\end{array}
        \\end{split}
        
        \\\\\\\\
        p(x)x^{${redundantCharacters}} &= (${polyText(quotient)})(${polyText(
            g,
        )}) + \\frac{${polyText(remainder)}}{${polyText(g)}}

        \\\\
        &\\text{If we subtract the remainder from } p(x)x^{${redundantCharacters}} \\text{,} \\\\
        &\\text{then that will be divisible by } g(x) \\text{, and thus will contain all roots of } g(x) \\\\
        &\\text{let } f(x) \\text{ be the polynomial we send} \\\\
        f(x) &= p(x)x^{${redundantCharacters}} - R \\\\
        &= (${polyText(pxs, { end: pxs.length - redundantCharacters })})-(${polyText(
            remainder,
        )}) \\\\
        &= ${polyText(f)}
        \\end{align}
    `,
    ];
};
