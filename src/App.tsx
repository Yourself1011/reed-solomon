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

    const encode = () => {
        const p = [];
        for (const char of message) {
            p.push(Math.max(char.charCodeAt(0) - 96, 0));
        }
        const pxs = [...p, 0, 0];

        const g = [1];
        const gRoots = [];
        for (let i = 0; i > -redundantCharacters; i--) {
            g.push(0);
            for (let j = g.length - 2; j >= 0; j--) {
                g[j + 1] += g[j] * (i - 1);
            }
            gRoots.push(-(i - 1));
        }

        const { steps, diffs, quotient, remainder } = polyLongDiv(pxs, g);

        let polyFormatted = "";
        for (let i = 0; i < steps.length; i++) {
            // steps[i] = steps[i].slice(i, p.length - g.length + i);
            // diffs[i] = diffs[i].slice(i, p.length - g.length + i);
            polyFormatted += `${polyText(steps[i], {
                start: i,
                end: pxs.length - g.length + i - 1,
                sep: "&",
            })}\\\\
            \\hline
            ${polyText(diffs[i], {
                start: i,
                end: pxs.length - g.length + i,
                sep: "&",
            })}\\\\`;
        }

        const f = [...pxs.slice(0, -2), ...[...remainder].map((n) => -n)];

        setSend(f);
        setOrigSend(f);

        setOut(`
            $$
            \\begin{align}
            \\require{enclose}
            &\\text{Message in numbers: }${p.join(", ")} \\\\
            &\\text{Create a polynomial with those numbers as coefficients} \\\\
            p(x) &= ${polyText(p)} \\\\
            p(x)x^2 &= ${polyText(pxs, { end: pxs.length - 2 })} \\\\
            &\\text{Create another polynomial with arbitrary, agreed upon roots of }${gRoots} \\\\
            g(x) &= ${gRoots.map((r) => (r == 0 ? "(x)" : `(x - ${r})`)).join("")} \\\\
                 &= ${polyText(g)} \\\\
                 \\\\
                 & \\text{Divide } p(x)x^2 \\text{ by } g(x)
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
            p(x)x^2 &= (${polyText(quotient)})(${polyText(g)}) + \\frac{${polyText(
            remainder
        )}}{${polyText(g)}}

            \\\\
            &\\text{let } f(x) \\text{ be the polynomial we send} \\\\
            f(x) &= p(x)x^2 - R \\\\
            &= (${polyText(pxs, { end: pxs.length - 2 })})-(${polyText(remainder)}) \\\\
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

    const polyText = (p: number[], options?: { sep?: string; start?: number; end?: number }) => {
        const { sep, start, end } = options ?? {};
        return p
            .map((n, i) =>
                (start && i < start) || (end && i >= end)
                    ? ""
                    : (n >= 0 && i != (start ?? 0) ? "+" : "") +
                      (i == p.length - 1
                          ? n
                          : `${n == 1 ? "" : n == -1 ? "-" : n}x^{${
                                i == p.length - 2 ? "" : p.length - 1 - i
                            }}`)
            )
            .join(sep ?? "");
    };

    return (
        <>
            <main className="p-8">
                <h1 className="mb-4">Reed Solomon Error Correction</h1>
                <p className="mb-4">
                    This is a simulation of the Reed Solomon error correction method. It uses
                    polynomial division, and is therefore a real-life example that relates to the
                    course content.
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
                        className="p-4 w-96 rounded-full"
                        placeholder="Message (only a-z, lowercase)"
                        value={message}
                        onChange={(e) =>
                            e.target.value.match("[^a-z ]") ? null : setMessage(e.target.value)
                        }
                    />
                    <input
                        className="p-4 w-64 rounded-full"
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
                            className="flex flex-row gap-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                setSent(true);
                            }}
                        >
                            {send.map((n, i) => (
                                <input
                                    className={`p-4 w-24 rounded-full ${
                                        n != origSend[i] ? "bg-red-600" : ""
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
                    </>
                ) : null}
            </main>
        </>
    );
}

export default App;
