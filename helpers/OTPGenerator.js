class OTPGenerator {
    #length = 4;
    constructor(_length) {
        this.#length = _length;
    };
    generateOTP() {
        return Math.floor(Math.pow(10, this.#length - 1) + Math.random() * 9 * Math.pow(10, this.#length - 1));
    };
}

module.exports = OTPGenerator;