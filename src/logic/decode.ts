import { evalPoly, gRoots, polyText } from "./polyUtils";

export const decode = (send: number[], redundantCharacters: number) => {
    const gAtF = [];
    const maxErrs = Math.floor(redundantCharacters / 2);
    const guessedPos: number[] = [];
    const outs: string[] = [];

    for (const root of gRoots) {
        gAtF.push(evalPoly(send, root));
    }

    for (let i = 0; i < maxErrs; i++) {
        guessedPos.push(i);
    }

    let pos: number[] = [];
    let corrections: number[] = [];
    if (gAtF.filter((x) => x != 0).length) {
        while (guessedPos[0] <= send.length - maxErrs) {
            let out = "";
            const lEqns = [];
            const unknownPoly = [...send];
            const unknownPolyText: (string | number)[] = [...send];
            const unknowns: string[] = [];

            for (const i of guessedPos) {
                unknownPoly[i] = 0;
                unknownPolyText[i] = `c_{${i}}`;
                unknowns.push(`c_{${i}}`);
            }
            out += `
                &\\text{Guessing positions } ${guessedPos}\\\\
                f'(x) &= ${polyText(unknownPolyText)}\\\\
            `;

            const c: number[][] = [];
            const r: number[] = [];

            for (const root of gRoots) {
                const result = evalPoly(unknownPoly, root);
                const coefficients = unknowns.map(
                    (_, i) => root ** (send.length - guessedPos[i] - 1)
                );

                c.push(coefficients);
                r.push(-result);

                const unknownCoefficient = coefficients.map(
                    (x, i) => `${x == 1 ? "" : x}${unknowns[i]}`
                );

                lEqns.push(-result);
                out += `
                    f'(${root}) &= ${unknownCoefficient.join("+")} ${
                    result >= 0 ? "+" : ""
                } ${result}\\\\
                    0 &= ${unknownCoefficient.join("+")} ${result >= 0 ? "+" : ""} ${result}\\\\
                    ${unknownCoefficient.join("+")} &= ${-result}\\\\
                `;
            }

            const gj = c.slice(0, maxErrs);

            // Gauss-Jordan elimination
            out += `
                &\\text{Gauss-Jordan elimination on the first ${maxErrs} equations}\\\\
                &\\left[ \\begin{array}{${"c".repeat(maxErrs)}|r} 
                    ${gj.map((x, j) => x.join("&") + "&" + r[j]).join("\\\\")}
                \\end{array} \\right]\\\\
            `;

            // going down
            for (let i = 0; i < maxErrs; i++) {
                let div = 0;
                for (let j = 0; j < gj[i].length; j++) {
                    if (gj[i][j] != 0) {
                        div = gj[i][j];
                        break;
                    }
                }

                gj[i] = gj[i].map((x) => x / div);
                r[i] /= div;
                out += `
                    \\sim&\\left[ \\begin{array}{${"c".repeat(maxErrs)}|r} 
                        ${gj.map((x, j) => x.join("&") + "&" + r[j]).join("\\\\")}
                    \\end{array} \\right]\\\\
                `;

                for (let j = i + 1; j < gj.length; j++) {
                    const multi = gj[j][i];
                    gj[j] = gj[j].map((x, k) => x - gj[i][k] * multi);
                    r[j] -= r[i] * multi;
                }

                out += `
                    \\sim&\\left[ \\begin{array}{${"c".repeat(maxErrs)}|r} 
                        ${gj.map((x, j) => x.join("&") + "&" + r[j]).join("\\\\")}
                    \\end{array} \\right]\\\\
                `;
            }

            // going up
            for (let i = maxErrs - 1; i > 0; i--) {
                for (let j = i - 1; j >= 0; j--) {
                    const multi = gj[j][i];
                    gj[j] = gj[j].map((x, k) => x - gj[i][k] * multi);
                    r[j] -= r[i] * multi;
                }

                out += `
                    \\sim&\\left[ \\begin{array}{${"c".repeat(maxErrs)}|r} 
                        ${gj.map((x, j) => x.join("&") + "&" + r[j]).join("\\\\")}
                    \\end{array} \\right]\\\\
                `;
            }

            out += `&\\text{Check with the other ${maxErrs} equations}\\\\`;
            let works = true;

            for (let i = maxErrs; i < gRoots.length; i++) {
                const res = c[i].reduce((a, b, i) => a + b * r[i], 0);
                const eq = res == r[i];
                if (!eq) works = false;
                out +=
                    c[i].map((x, j) => `(${x})(${r[j]})`).join("+") +
                    "&" +
                    (eq ? "=" : "\\neq") +
                    r[i] +
                    "\\\\" +
                    res +
                    "&" +
                    (eq ? "=" : "\\neq") +
                    r[i] +
                    "\\\\";
            }

            out += works
                ? `
                &\\text{Those ${maxErrs} equations agree, so these are the correct coefficients!} \\\\
            `
                : `&\\text{Those don't agree, so these aren't the coefficients}`;

            outs.push(out);

            if (works) {
                pos = [...guessedPos];
                corrections = r.slice(0, maxErrs);
                break;
            }

            const toMove = [];
            let j = send.length - 1;
            let i = guessedPos.length - 1;
            for (; i >= 0; i--) {
                if (guessedPos[i] === j) {
                    toMove.push(i);
                    j--;
                } else {
                    break;
                }
            }
            guessedPos[i]++;
            for (let k = 0; k < toMove.length; k++) {
                guessedPos[toMove[k]] = guessedPos[i] + k + 1;
            }
        }
    }

    const corrected = [...send];
    for (let i = 0; i < pos.length; i++) {
        corrected[pos[i]] = corrections[i];
    }

    return (
        `
        \\begin{align}
            &\\text{Received message} \\\\
            f'(x) &= ${polyText(send)} \\\\
            &\\text{If we received everything correctly, the roots } ${gRoots} \\text{ of } g(x) \\text{ should still be roots in our polynomial} \\\\
            ${gAtF.map((n, i) => `g(${gRoots[i]}) &= ${n}`).join("\\\\")} \\\\
    ` +
        (gAtF.filter((x) => x != 0).length
            ? `&\\text{Our message was tampered with! Let's try fixing it.}\\\\
                    &\\text{There are efficient algorithms for this, but those are outside the scope of this course,}\\\\ 
                    &\\text{so I'll just be using a simple trial-and-error method.}\\\\
                    &\\text{There are ${redundantCharacters} redundant characters, so we can fix at most ${maxErrs} errors.}\\\\
                    &\\text{We'll go through every possible combination of corrupted characters, and make them unknown.}\\\\
                    &\\text{Then, we'll substitute each of our roots into the function, and we want the result of those to be 0.}\\\\
                    &\\text{This will give us ${gRoots.length} linear equations.}\\\\
                    &\\text{We'll use Gauss-Jordan elimination with ${maxErrs} of them to get values for our unknowns.}\\\\
                    &\\text{We'll substitute those values in the remaining polynomials and see if it works}\\\\
                    &\\text{If it does, we've fixed our message!}\\\\\\\\
                    ${outs.join("\\\\\\\\")}\\\\\\\\
                    ` +
              (pos.length > 0
                  ? `
                            &\\text{So the errors were at positions } ${pos} \\text{, which we'll correct to } ${corrections}\\\\
                            &\\text{So we should have received } ${corrected} \\text{,}\\\\
                            &\\text{which translates to the message “${corrected
                                .slice(0, -redundantCharacters)
                                .map((x) => (x == 0 ? " " : String.fromCharCode(x + 96)))
                                .join("")}”}.
                        `
                  : "&\\text{We couldn't values for any coefficient, so there were more errors than we could handle}\\\\&\\text{We'll just have to scrap this message}")
            : "&\\text{That seems to be true, so we can just use the received message as is!}") +
        `\\end{align}`
    );
};
