export class GFNumber {
    public value: number;
    public static expTable = new Uint8Array(255 * 2 + 1).fill(0);
    public static logTable = new Uint8Array(256).fill(0);

    constructor(n: number) {
        this.value = n;
    }

    valueOf() {
        return this.value;
    }

    add(x: GFNumber) {
        this.value = GFNumber.add(this, x);
        return this;
    }

    static add(a: GFNumber, b: GFNumber) {
        return a.value ^ b.value;
    }

    sub(x: GFNumber) {
        this.value = GFNumber.sub(this, x);
        return this;
    }

    static sub(a: GFNumber, b: GFNumber) {
        return a.value ^ b.value;
    }

    mult(x: GFNumber) {
        this.value = GFNumber.mult(this, x);
        return this;
    }

    static mult(a: GFNumber, b: GFNumber) {
        if (a.value == 0 || b.value == 0) return 0;
        return this.expTable[this.logTable[a.value] + this.logTable[b.value]];
    }

    div(x: GFNumber) {
        this.value = GFNumber.div(this, x);
        return this;
    }

    static div(a: GFNumber, b: GFNumber) {
        if (a.value == 0) return 0;
        if (b.value == 0) throw new RangeError("Division by zero");
        return this.expTable[255 + this.logTable[a.value] - this.logTable[b.value]]; // + 255 to stay within 0-512
    }

    pow(x: number) {
        this.value = GFNumber.pow(this, x);
        return this;
    }

    static pow(b: GFNumber, x: number) {
        return this.expTable[(this.logTable[b.value] * x + 255) % 255];
    }
}

function expLogInit() {
    const primePoly = 0b00011101;

    GFNumber.expTable[0] = 1;

    for (let i = 1; i < 256; i++) {
        GFNumber.expTable[i] = GFNumber.expTable[i - 1] << 1;

        if (GFNumber.expTable[i - 1] & 0b10000000) {
            GFNumber.expTable[i] ^= primePoly;
        }

        GFNumber.logTable[GFNumber.expTable[i]] = i;
        GFNumber.expTable[i + 255] = GFNumber.expTable[i];
    }
}

expLogInit();
