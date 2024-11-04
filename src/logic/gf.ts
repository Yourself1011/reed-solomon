const gf = 255;
// const gf = 15;
export class GFNumber {
    public value: number;
    public static expTable = new Uint8Array(gf * 2).fill(0);
    public static logTable = new Uint8Array(gf + 1).fill(0);

    constructor(n: number) {
        this.value = n;
    }

    valueOf() {
        return this.value;
    }

    toString() {
        return this.value.toString();
    }

    add(x: GFNumber) {
        return GFNumber.add(this, x);
    }

    static add(a: GFNumber, b: GFNumber) {
        return new GFNumber(a.value ^ b.value);
    }

    sub(x: GFNumber) {
        return GFNumber.sub(this, x);
    }

    static sub(a: GFNumber, b: GFNumber) {
        return new GFNumber(a.value ^ b.value);
    }

    mult(x: GFNumber) {
        return GFNumber.mult(this, x);
    }

    static mult(a: GFNumber, b: GFNumber) {
        if (a.value == 0 || b.value == 0) return new GFNumber(0);
        return new GFNumber(this.expTable[this.logTable[a.value] + this.logTable[b.value]]);
    }

    div(x: GFNumber) {
        return GFNumber.div(this, x);
    }

    static div(a: GFNumber, b: GFNumber) {
        if (a.value == 0) return new GFNumber(0);
        if (b.value == 0) throw new RangeError("Division by zero");
        return new GFNumber(this.expTable[gf + this.logTable[a.value] - this.logTable[b.value]]); // + gf to stay within 0-gf * 2 + 1)
    }

    pow(x: number) {
        return GFNumber.pow(this, x);
    }

    static pow(b: GFNumber, x: number) {
        return new GFNumber(this.expTable[(((this.logTable[b.value] * x) % gf) + gf) % gf]);
    }
}

function expLogInit() {
    const primePoly = 0b100011101;
    // const primePoly = 0b10011;

    GFNumber.expTable[0] = 1;
    GFNumber.expTable[gf] = 1;

    for (let i = 1; i < gf; i++) {
        GFNumber.expTable[i] = GFNumber.expTable[i - 1] << 1;

        if (GFNumber.expTable[i - 1] & ((gf + 1) / 2)) {
            GFNumber.expTable[i] ^= primePoly;
        }

        GFNumber.logTable[GFNumber.expTable[i]] = i;
        GFNumber.expTable[i + gf] = GFNumber.expTable[i];
    }
}

expLogInit();
