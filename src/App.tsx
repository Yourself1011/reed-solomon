import { useState } from "react";
import "./App.css";
import { MathJax } from "better-react-mathjax";

function App() {
    const [on, setOn] = useState(false);
    const [message, messageBuffer] = useState("");
    const [redundantCharacters, setRedundantCharacters] = useState<number>(0);
    const [out, setOut] = useState("");

    const calculate = () => {
        const p = [];
        for (const char of message) {
            p.push(Math.max(char.charCodeAt(0) - 96, 0));
        }

        const g = [redundantCharacters == 0 ? 0 : 1];
        const gRoots = [];
        for (let i = 0; i > -redundantCharacters; i--) {
            g.push(0);
            for (let j = g.length - 2; j >= 0; j--) {
                g[j + 1] += g[j] * i;
            }
            gRoots.push(i * -1);
        }

        const { steps, diffs, quotient } = polyLongDiv(p, g);

        let polyFormatted = "";
        for (let i = 0; i < steps.length; i++) {
            polyFormatted += `${polyText(steps[i], {
                sup: true,
                sep: "&",
            })}\\\\
            \\hline
            ${polyText(diffs[i], {
                sup: true,
                sep: "&",
            })}\\\\`;
        }

        setOut(`
            Encoding:
            $$
            \\begin{align}
            \\require{enclose}
            &\\text{Message in numbers: }${p.join(", ")} \\\\
            p(x) &= ${polyText(
                p
            )} && \\text{Create a polynomial with those numbers as coefficients} \\\\
            g(x) &= ${gRoots
                .map((r) => (r == 0 ? "(x)" : `(x - ${r})`))
                .join(
                    ""
                )} && \\text{Create another polynomial with arbitrary, agreed upon roots of }${gRoots} \\\\
                 &= ${polyText(g)} \\\\
                 \\\\
                 & && \\text{Divide } p(x) \\text{by } g(x)
                 \\\\

            \\begin{split}
                ${polyText(g)} ) 
                ${"\\\\".repeat(steps.length * 2 + 1)}
            \\end{split}&
            \\begin{split}
                \\begin{array}{r@{}l}
                ${polyText(quotient, { sep: "&" })} \\\\
                \\hline
                ${polyText(p, { sep: "&" })} \\\\
                ${polyFormatted}
                \\end{array}
            \\end{split}
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

        return { steps, diffs, quotient };
    };

    const polyText = (p: number[], options?: { sep?: string; sup?: boolean }) => {
        const { sep, sup } = options ?? {};
        return p
            .map((n, i) =>
                n == 0 && sup
                    ? "\\phantom{0}"
                    : (n >= 0 && i != 0 ? "+" : "") +
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
                        calculate();
                        setOn(true);
                    }}
                >
                    <input
                        className="p-4 w-96 rounded-full"
                        placeholder="Message (only a-z, lowercase)"
                        value={message}
                        onChange={(e) =>
                            e.target.value.match("[^a-z ]") ? null : messageBuffer(e.target.value)
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

                <MathJax className="mt-8 max-w-full">{on ? out : null}</MathJax>
            </main>
        </>
    );
}

export default App;
