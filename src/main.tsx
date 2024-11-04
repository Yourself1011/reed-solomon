import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { MathJax3Config, MathJaxContext } from "better-react-mathjax";

const config: MathJax3Config = {
    "HTML-CSS": {
        linebreaks: {
            automatic: true,
            width: "container",
        },
    },
    loader: { load: ["[tex]/cancel"] },
    tex: {
        packages: { "[+]": ["cancel"] },
        maxBuffer: 64 * 1024,
    },
};

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <MathJaxContext config={config} hideUntilTypeset="first">
            <App />
        </MathJaxContext>
    </React.StrictMode>
);
