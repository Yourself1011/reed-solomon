import { GFNumber } from "./gf";
import { evalPoly, gRoots, polyLongDiv, polyMul, polyText } from "./polyUtils";

export const decode = (send: number[], redundantCharacters: number) => {
    const rec = send.map((x) => new GFNumber(x));
    const syndromes = [];
    let out = "";

    for (const root of gRoots) {
        syndromes.push(evalPoly(rec, root));
    }

    const synPoly = [...syndromes];
    synPoly.reverse();

    if (!syndromes.filter((x) => x.value != 0).length)
        out += "&\\text{That seems to be true, so we can just use the received message as is!}";
    else {
        out += `
            &\\text{Our message was tampered with! Let's try fixing it.}\\\\
            \\\\
            &\\text{We can write} \\\\
            f'(x) &= f(x) + E(x) \\\\
            &\\text{where } E(x) \\text{ is the error polynomial, such that} \\\\
            E(x) &= Y_1x^{e_1}+Y_2x^{e_2}+\\dots+Y_vx^{e_v} \\\\
            &\\text{where } Y_v \\text{ is how big the error at location } e_v \\text{ is and } v \\text{ is the number of errors} \\\\
            &\\text{substituting roots of } g(x) \\text{ or } 2^i \\text{ yields} \\\\
            f'(2^i) &= \\cancel{f(2^i)} 0 + E(2^i) \\\\
            &=Y_12^{ie_1}+Y_22^{ie_2}+\\dots+Y_v2^{ie_v} \\\\
            &=Y_1X_1^{i}+Y_2X_2^{i}+\\dots+Y_vX_3^{i} \\\\
            &\\text{where } X_v = 2^{e_v} \\\\
            \\\\
            &\\text{We can convert the results of } f'(2^i) \\text{ to a polynomial}\\\\
            S(x) &= ${polyText(synPoly)} \\\\
            &\\text{Let's define 2 more polynomials} \\\\
            \\Lambda(x) &= (1+2^{e_1}x)(1+2^{e_2}x)\\dots(1+2^{e_v}x) \\\\
            &= (1+X_1x)(1+X_2x)\\dots(1+X_vx) \\\\
            &= 1+\\Lambda_1x + \\dots + \\Lambda_vx^v \\\\
            &\\text{Finding the roots } X_v^{-1} \\text{ of this will tell us where our errors are} \\\\
            &\\text{and} \\\\
            \\Omega(x) &= S(x)\\Lambda(x) \\mod x^{${redundantCharacters}} \\\\
            &= S(x)\\Lambda(x) - Q(x)x^{${redundantCharacters}} \\\\
            &\\text{giving us a polynomial no greater than degree } ${redundantCharacters} \\\\
            \\\\
            cQ(x)x^{${redundantCharacters}} + c\\Lambda(x)S(x) &= c\\Omega(x) \\\\
            &\\text{where } c \\text{ is some arbitrary coefficient, is of the form} \\\\
            ua + vb &= d \\\\
            &\\text{so we can use the extended Euclidian algorithm that finds the greatest common divisor} \\\\\\\\
        `;

        let a = [new GFNumber(1), ...Array(redundantCharacters).fill(new GFNumber(0))],
            b = [...synPoly],
            remainder,
            v2 = [new GFNumber(0)],
            v1 = [new GFNumber(1)],
            v = [new GFNumber(1)];

        do {
            while (b[0].value == 0) b.shift();
            const res = polyLongDiv(a, b);
            remainder = res.remainder;
            while (remainder[0].value == 0) remainder.shift();
            const { steps, diffs, quotient } = res;

            let polyFormatted = "";
            for (let i = 0; i < steps.length; i++) {
                polyFormatted += `${polyText(steps[i], {
                    start: i,
                    end: b.length + i,
                    sep: "&",
                })}\\\\
                \\hline
                ${polyText(diffs[i], {
                    start: i,
                    end: b.length + i + 1,
                    sep: "&",
                })}\\\\`;
            }

            v = polyMul(quotient, v1).map((x, i, a) =>
                x.add(v2[v2.length - (a.length - i)] ?? new GFNumber(0))
            );

            out += `
                \\begin{split}
                    ${polyText(b)} ) 
                    ${"\\\\".repeat(steps.length * 2.4)}
                \\end{split}&
                \\begin{split}
                    \\begin{array}{@{}r}
                    ${"&".repeat(b.length - 1) + polyText(quotient, { sep: "&" })} \\\\
                    \\hline
                    ${polyText(a, { sep: "&" })} \\\\
                    ${polyFormatted}
                    \\end{array}
                \\end{split} \\\\
                r &= ${polyText(remainder)} \\\\
                v &= ${polyText(v2)} - (${polyText(v1)})(${polyText(quotient)}) \\\\
                &= ${polyText(v)} \\\\\\\\
            `;

            v2 = [...v1];
            v1 = [...v];

            a = [...b];
            b = [...remainder];
        } while (remainder.length > redundantCharacters / 2);

        const errMag = remainder.map((x) => x.div(v[v.length - 1])),
            errLoc = v.map((x) => x.div(v[v.length - 1]));

        out += `
            c\\Omega(x) &= ${polyText(remainder)} \\\\
            c\\Lambda(x) &= ${polyText(v)} \\\\
            &\\text{since we know the constant term of } \\Lambda(x) \\text{ is } 1\\\\
            c &= ${v[v.length - 1]} \\\\
            \\Omega(x) &= ${polyText(errMag)} \\\\
            \\Lambda(x) &= ${polyText(errLoc)} \\\\
            \\\\
            &\\text{Now that we know } \\Lambda(x) \\text{, we can find the values of } X_v \\\\
            &\\text{Since } \\Lambda(X_v^{-1})=0 \\\\
            &\\text{We can just brute-force (it had to happen somewhere) all possible values of } X_v^{-1}=2^{-e_v} \\\\
            \\\\
        `;

        const locations = [],
            locationsInv = [],
            magnitudes = [],
            terms = [];
        for (let i = 0; i < rec.length; i++) {
            const exp = new GFNumber(2).pow(-i);
            const res = evalPoly(errLoc, exp);

            if (res.value != 0) {
                out += `\\Lambda(2^{-${i}}) = \\Lambda(${exp}) &= ${res}\\\\`;
            } else {
                const x = exp.pow(-1);
                locations.push(x);
                locationsInv.push(exp);
                terms.push(i);
                out += `
                    \\Lambda(2^{-${i}}) = \\Lambda(${exp}) &= ${res} \\\\
                    2^{-${i}} = X_{${locations.length}}^{-1} &= ${exp} \\\\
                    2^{${i}} = X_{${locations.length}} &= ${x} \\\\
                    &\\text{there is an error at term } ${i} \\\\
                `;
            }
        }

        if (locations.length == 0)
            out +=
                "&\\text{We couldn't find the error locations, which means there were more errors than we could handle. We have to scrap this message}";
        else {
            while (b[0].value == 0) b.shift();
            const dErrLoc = errLoc.map((x, i) => ((errLoc.length - i) % 2 ? new GFNumber(0) : x));
            dErrLoc.pop();
            while (dErrLoc[0].value == 0) dErrLoc.shift();

            out += `
                \\\\
                &\\text{Now we use the formula}\\\\
                Y_v &= X_v \\frac{\\Omega(X_v^{-1})}{\\Lambda'(X_v^{-1})}\\\\
                &\\text{where} \\\\
                \\Lambda'(x) &= \\left( 1+\\Lambda_1x + \\dots + \\Lambda_vx^v \\right)' \\\\
                &= \\Lambda_1 + 2 \\cdot \\Lambda_2x + \\dots + v \\cdot \\Lambda_vx^{v-1} \\\\
                &\\text{Note that this is integer multiplication, instead of Galois Field multiplication,} \\\\
                &\\text{so it's repeated Galois Field addition, and since addition and subtraction are the same in our Galois Field,} \\\\
                &\\text{all even terms cancel out, and all odd terms get a coefficient of } 1 \\\\
                \\Lambda'(x) &= \\Lambda_1 + \\Lambda_3x^2 + \\Lambda_5x^4 + \\dots \\\\
                &= ${polyText(dErrLoc, { skipZero: true })} \\\\
                \\\\
            `;

            const corrected = [...rec];
            for (let i = 0; i < locations.length; i++) {
                const mag = locations[i]
                    .mult(evalPoly(errMag, locationsInv[i]))
                    .div(evalPoly(dErrLoc, locationsInv[i]));
                magnitudes.push(mag);
                const index = corrected.length - terms[i] - 1;
                corrected[index] = corrected[index].add(mag);

                out += `
                    Y_{${i + 1}} &= ${locations[i]} \\left( \\frac{${evalPoly(
                    errMag,
                    locationsInv[i]
                )}}{${evalPoly(dErrLoc, locationsInv[i])}} \\right) \\\\
                    &= ${mag} \\\\
                `;
            }

            out += `
                \\\\
                &\\text{So the coefficients of terms } ${terms.join(", ")} \\\\
                &\\text{ are off by } ${magnitudes.join(", ")} \\\\
                &\\text{So the polynomial we should have received is } \\\\
                f(x) &= ${polyText(corrected)} \\\\
                &\\text{which translates to the message “${corrected
                    .slice(0, -redundantCharacters)
                    .map((x) => String.fromCharCode(x.value))
                    .join("")}”}.
            `;
        }
    }

    return (
        `
        \\begin{align}
            &\\text{Received message} \\\\
            f'(x) &= ${polyText(rec)} \\\\
            &\\text{If we received everything correctly, the roots } ${gRoots} \\text{ of } g(x) \\text{ should still be roots in our polynomial} \\\\
            ${syndromes.map((n, i) => `f'(${gRoots[i]}) &= ${n}`).join("\\\\")} \\\\
    ` +
        out +
        `\\end{align}`
    );
};
