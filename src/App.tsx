import { useEffect, useState } from "react";
import "./App.css";
import { MathJax } from "better-react-mathjax";
import { encode } from "./logic/encode";
import { decode } from "./logic/decode";
import { generateG } from "./logic/polyUtils";
import GFCalc from "./components/GFCalc";

function App() {
    const [on, setOn] = useState(false);
    const [message, setMessage] = useState("");
    const [redundantCharacters, setRedundantCharacters] = useState(0);
    const [out, setOut] = useState("");
    const [send, setSend] = useState<number[]>([]);
    const [origSend, setOrigSend] = useState<number[]>([]);
    const [sent, setSent] = useState(false);
    const [decOut, setDecOut] = useState("");
    const [loadingDecoder, setLoadingDecoder] = useState(false);
    const [loadingEncoder, setLoadingEncoder] = useState(false);

    useEffect(() => {
        if (loadingEncoder) {
            generateG(redundantCharacters);
            const [f, out] = encode(message, redundantCharacters);
            setSend(f);
            setOrigSend(f);
            setOut(out);
            setOn(true);
            setSent(false);
        }
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadingEncoder]);

    useEffect(() => {
        if (loadingDecoder) {
            setDecOut(
                decode(
                    send.map((x) => (isNaN(x) ? 32 : x)), // 32 is space
                    redundantCharacters
                )
            );
            setSent(true);
        }
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadingDecoder]);

    return (
        <>
            <main className="p-8">
                <h1 className="mb-4">Reed Solomon Error Correction</h1>
                <p className="mb-4">
                    This is a simulation of the Reed Solomon error correction method.
                </p>
                <p className="mb-4">
                    Problem: How can we add things to a wireless message, such that, if it gets
                    tampered with, through, for example, interference, we can detect and correct
                    those errors, without needing to send a copy of the message? We'll achieve this
                    by adding some amount of redundant characters to the message. This number is set
                    in advance for both the encoding and decoding side. This algorithm can correct 1
                    error for every 2 redundant characters. Since I don't use a very optimized
                    method, I recommend keeping this number small (2 or 4). Positions are 0-indexed
                    (start at 0).
                </p>
                <p className="mb-4">
                    Because we're working with computers, we don't want our numbers to get too
                    large, since that means we need to send more data unnecessarily. To accomplish
                    this, we will use a number system known as{" "}
                    <MathJax inline>{"\\(GF(2^8)\\)"}</MathJax>, which keeps the results of all
                    arithmetic operations between 0 and 256, meaning we can store it in a byte,
                    while still following the basic rules of each operation. Here is a calculator
                    for this number system.
                </p>
                <GFCalc />
                <p className="mb-4">
                    Note that addition and subtraction do the same thing, and are therefore
                    interchangeable
                </p>
                <form
                    className="flex flex-row gap-4 items-center"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setLoadingEncoder(true);
                    }}
                >
                    <input
                        className="p-4 w-96 rounded-full bg-gray-950"
                        placeholder="Message (only a-z, lowercase)"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
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
                    <div
                        className={`size-8 rounded-full border-gray-500 border-t-transparent border-4 animate-spin ${
                            loadingEncoder ? "" : "hidden"
                        }`}
                    />
                </form>

                {on ? (
                    <>
                        <h2>Encoding</h2>
                        <MathJax
                            dynamic
                            className="mt-8 max-w-full"
                            onTypeset={() => setLoadingEncoder(false)}
                            renderMode="pre"
                            typesettingOptions={{ fn: "tex2chtml" }}
                            text={out}
                        />

                        <h2>Message to send:</h2>
                        <p className="mb-2">
                            Corrupt some of these numbers, but keep them below 256. Since there are{" "}
                            {redundantCharacters} redundant characters, our algorithm can fix up to{" "}
                            {Math.floor(redundantCharacters / 2)} errors.
                        </p>
                        <form
                            className="flex flex-row flex-wrap gap-4 items-center"
                            onSubmit={(e) => {
                                e.preventDefault();
                                setLoadingDecoder(true);
                            }}
                        >
                            {send.map((n, i) => (
                                <input
                                    className={`p-4 w-24 rounded-full ${
                                        n != origSend[i] ? "bg-red-600" : "bg-gray-950"
                                    }`}
                                    key={i}
                                    value={n}
                                    onChange={(e) => {
                                        if (e.target.value == "" || parseInt(e.target.value) < 256)
                                            setSend([
                                                ...send.slice(0, i),
                                                parseInt(e.target.value),
                                                ...send.slice(i + 1),
                                            ]);
                                    }}
                                    type="number"
                                ></input>
                            ))}

                            <button className="bg-blue-950 p-4 rounded-full" type="submit">
                                Send!
                            </button>
                            <div
                                className={`size-8 rounded-full border-gray-500 border-t-transparent border-4 animate-spin ${
                                    loadingDecoder ? "" : "hidden"
                                }`}
                            />
                        </form>
                        <p className="my-4">
                            Which translates to "
                            {send.map((x) => String.fromCharCode(isNaN(x) ? 32 : x))}"
                        </p>
                    </>
                ) : null}

                {sent ? (
                    <>
                        <h2>Decoding</h2>
                        <MathJax
                            dynamic
                            className="mt-8 max-w-full"
                            onTypeset={() => setLoadingDecoder(false)}
                            renderMode="pre"
                            typesettingOptions={{ fn: "tex2chtml" }}
                            text={decOut}
                        />
                    </>
                ) : null}
                <a
                    href="https://github.com/Yourself1011/reed-solomon"
                    className="mt-8 block underline text-blue-600"
                >
                    Source
                </a>
            </main>
        </>
    );
}

export default App;
