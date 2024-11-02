import { useState } from "react";
import { GFNumber } from "../logic/gf";

export default function GFCalc() {
    const [a, setA] = useState<number | null>(null);
    const [opp, setOpp] = useState("+");
    const [b, setB] = useState<number | null>(null);

    return (
        <form
            className="flex flex-row gap-4 items-center my-8"
            onSubmit={(e) => e.preventDefault()}
        >
            <input
                className="p-4 w-24 rounded-full bg-gray-950"
                value={a?.toString() ?? ""}
                onChange={(e) =>
                    setA(
                        e.target.value == ""
                            ? null
                            : parseInt(e.target.value) < 256
                            ? parseInt(e.target.value)
                            : a
                    )
                }
                type="number"
            />
            <select
                className="border-[1rem] border-transparent w-16 rounded-full bg-gray-950"
                value={opp}
                onChange={(e) => setOpp(e.target.value)}
            >
                <option>+</option>
                <option>-</option>
                <option>*</option>
                <option>/</option>
                <option>^</option>
            </select>
            <input
                className="p-4 w-24 rounded-full bg-gray-950"
                value={b?.toString() ?? ""}
                onChange={(e) =>
                    setB(
                        e.target.value == ""
                            ? null
                            : parseInt(e.target.value) < 256
                            ? parseInt(e.target.value)
                            : b
                    )
                }
                type="number"
            />
            <p>
                {a !== null && b !== null
                    ? "= " +
                      (() => {
                          const gfA = new GFNumber(a);
                          const gfB = new GFNumber(b);
                          switch (opp) {
                              case "+":
                                  return GFNumber.add(gfA, gfB);
                              case "-":
                                  return GFNumber.sub(gfA, gfB);
                              case "*":
                                  return GFNumber.mult(gfA, gfB);
                              case "/":
                                  try {
                                      return GFNumber.div(gfA, gfB);
                                  } catch (e) {
                                      if (e instanceof RangeError) return "div by zero error";
                                      throw e;
                                  }
                              case "^":
                                  return GFNumber.pow(gfA, b);
                          }
                      })()
                    : ""}
            </p>
        </form>
    );
}
