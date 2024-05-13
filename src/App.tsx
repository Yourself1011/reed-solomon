import { useState } from "react";
import "./App.css";
import { MathJax } from "better-react-mathjax";

function App() {
    const [on, setOn] = useState(false);
    const [message, setMessage] = useState("");
    const [redundantCharacters, setRedundantCharacters] = useState(0);
    const [out, setOut] = useState("");
    const [send, setSend] = useState<number[]>([]);
    const [origSend, setOrigSend] = useState<number[]>([]);
    const [sent, setSent] = useState(false);
    const [decOut, setDecOut] = useState("");
    const [gRoots, setGRoots] = useState<number[]>([]);

    const encode = () => {
        const p = [];
        for (const char of message) {
            p.push(Math.max(char.charCodeAt(0) - 96, 0));
        }
        const pxs = [...p, ...Array(redundantCharacters).fill(0)];

        const g = [1];
        const gRoots = [];
        for (let i = 0; i > -redundantCharacters; i--) {
            g.push(0);
            for (let j = g.length - 2; j >= 0; j--) {
                g[j + 1] += g[j] * (i - 1);
            }
            gRoots.push(-(i - 1));
        }
        setGRoots(gRoots);

        const { steps, diffs, quotient, remainder } = polyLongDiv(pxs, g);

        let polyFormatted = "";
        for (let i = 0; i < steps.length; i++) {
            // steps[i] = steps[i].slice(i, p.length - g.length + i);
            // diffs[i] = diffs[i].slice(i, p.length - g.length + i);
            polyFormatted += `${polyText(steps[i], {
                start: i,
                end: g.length + i,
                sep: "&",
            })}\\\\
            \\hline
            ${polyText(diffs[i], {
                start: i,
                end: g.length + i + 1,
                sep: "&",
            })}\\\\`;
        }

        const f = [...pxs.slice(0, -redundantCharacters), ...[...remainder].map((n) => -n)];

        setSend(f);
        setOrigSend(f);

        setOut(`
            $$
            \\begin{align}
            \\require{enclose}
            &\\text{Message in numbers: }${p.join(", ")} \\\\
            &\\text{Create a polynomial with those numbers as coefficients} \\\\
            p(x) &= ${polyText(p)} \\\\
            p(x)x^${redundantCharacters} &= ${polyText(pxs, {
            end: pxs.length - redundantCharacters,
        })} \\\\
            &\\text{Create another polynomial with arbitrary, predetermined roots of }${gRoots} \\\\
            g(x) &= ${gRoots.map((r) => (r == 0 ? "(x)" : `(x - ${r})`)).join("")} \\\\
                 &= ${polyText(g)} \\\\
                 \\\\
                 & \\text{Divide } p(x)x^${redundantCharacters} \\text{ by } g(x)
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
            p(x)x^${redundantCharacters} &= (${polyText(quotient)})(${polyText(
            g
        )}) + \\frac{${polyText(remainder)}}{${polyText(g)}}

            \\\\
            &\\text{If we subtract the remainder from } p(x)x^${redundantCharacters} \\text{,} \\\\
            &\\text{then that will be divisible by } g(x) \\text{, and thus will contain all roots of } g(x) \\\\
            &\\text{let } f(x) \\text{ be the polynomial we send} \\\\
            f(x) &= p(x)x^${redundantCharacters} - R \\\\
            &= (${polyText(pxs, { end: pxs.length - redundantCharacters })})-(${polyText(
            remainder
        )}) \\\\
            &= ${polyText(f)}
            \\end{align}
            $$
        `);
    };

    const polyLongDiv = (dividend: number[], divisor: number[]) => {
        const steps: number[][] = [];
        const diffs: number[][] = [];
        const quotient = [];

        let multi = Math.floor(dividend[0] / divisor[0]);
        quotient.push(multi);
        steps.push(
            [...divisor]
                .map((d) => d * multi)
                .concat(Array(dividend.length - divisor.length).fill(0))
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

    const polyText = (
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

    const decode = () => {
        const gAtF = [];
        const maxErrs = Math.floor(redundantCharacters / 2);
        const guessedPos: number[] = [];
        const outs = [];

        for (const root of gRoots) {
            gAtF.push(evalPoly(send, root));
        }

        for (let i = 0; i < maxErrs; i++) {
            guessedPos.push(i);
        }

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

                for (const root of gRoots) {
                    const result = evalPoly(unknownPoly, root);
                    const coefficients = unknowns.map(
                        (_, i) => root ** (send.length - guessedPos[i] - 1)
                    );

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

                // Gauss-Jordan elimination

                outs.push(out);

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

        setDecOut(
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
                        &\\text{Then, we'll substitute each of our roots into the function, and we want the result to be 0.}\\\\
                        &\\text{This will give us ${gRoots.length} linear equations.}\\\\
                        &\\text{We'll use Gauss-Jordan elimination with ${maxErrs} of them to get values for our unknowns.}\\\\
                        &\\text{We'll substitute those values in the remaining polynomials and see if it works}\\\\
                        &\\text{If it does, we've fixed our message!}\\\\\\\\
                        ${outs.join("\\\\\\\\")}
                        `
                    : "&\\text{That seems to be true, so we can just use the received message as is!}") +
                `\\end{align}`
        );
    };

    const evalPoly = (p: number[], x: number) => {
        let sum = 0;
        for (let i = 0; i < p.length; i++) {
            sum += p[i] * x ** (p.length - i - 1);
        }

        return sum;
    };

    return (
        <>
            <main className="p-8">
                <h1 className="mb-4">Reed Solomon Error Correction</h1>
                <p className="mb-4">
                    This is a simulation of the Reed Solomon error correction method. It uses
                    polynomials, and polynomial division, and is therefore a real-life example that
                    relates to the course content.
                </p>
                <p className="mb-4">
                    Problem: How can we add things to a wireless message, such that, if it gets
                    tampered with, through, for example, interference, we can detect and correct
                    those errors, without needing to send a copy of the message? We'll achieve this
                    by adding some amount of redundant characters to the message. This number is set
                    in advance for both the encoding and decoding side. This algorithm can correct 1
                    error for every 2 redundant characters. Since I don't use a very optimized
                    method, I recommend keeping this number small (2 or 4)
                </p>
                <form
                    className="flex flex-row gap-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        encode();
                        setOn(true);
                        setSent(false);
                    }}
                >
                    <input
                        className="p-4 w-96 rounded-full bg-gray-950"
                        placeholder="Message (only a-z, lowercase)"
                        value={message}
                        onChange={(e) =>
                            e.target.value.match("[^a-z ]") ? null : setMessage(e.target.value)
                        }
                    />
                    <input
                        className="p-4 w-64 rounded-full bg-gray-950"
                        placeholder="# of redundant characters"
                        value={redundantCharacters == 0 ? "" : redundantCharacters}
                        onChange={(e) => setRedundantCharacters(parseInt(e.target.value))}
                        type="number"
                    />
                    <button className="bg-blue-950 p-4 rounded-full" type="submit">
                        Go!
                    </button>
                </form>

                {on ? (
                    <>
                        <h2>Encoding</h2>
                        <MathJax className="mt-8 max-w-full">{out}</MathJax>

                        <h2>Message to send:</h2>
                        <p className="mb-2">Corrupt some of these numbers</p>
                        <form
                            className="flex flex-row flex-wrap gap-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                decode();
                                setSent(true);
                            }}
                        >
                            {send.map((n, i) => (
                                <input
                                    className={`p-4 w-24 rounded-full ${
                                        n != origSend[i] ? "bg-red-600" : "bg-gray-950"
                                    }`}
                                    key={i}
                                    value={n}
                                    onChange={(e) =>
                                        setSend([
                                            ...send.slice(0, i),
                                            parseInt(e.target.value),
                                            ...send.slice(i + 1),
                                        ])
                                    }
                                    type="number"
                                ></input>
                            ))}

                            <button className="bg-blue-950 p-4 rounded-full" type="submit">
                                Send!
                            </button>
                        </form>
                    </>
                ) : null}

                {sent ? (
                    <>
                        <h2>Decoding</h2>
                        <MathJax className="mt-8 max-w-full">{decOut}</MathJax>
                    </>
                ) : null}
            </main>
        </>
    );
}

export default App;
