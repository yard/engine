pc.extend(pc, (function () {
    'use strict';

    var typeNumber = 'number';

    /**
    * @name pc.Mat3
    * @class A 3x3 matrix.
    * @description Creates a new Mat3 object
    */
    var Mat3 = function (v0, v1, v2, v3, v4, v5, v6, v7, v8) {
        this.data = new Float32Array(9);

        if (typeof(v0) === typeNumber) {
            this.data[0] = v0;
            this.data[1] = v1;
            this.data[2] = v2;
            this.data[3] = v3;
            this.data[4] = v4;
            this.data[5] = v5;
            this.data[6] = v6;
            this.data[7] = v7;
            this.data[8] = v8;
        } else {
            this.setInitial();
        }
    };

    Mat3.prototype = {
        /**
         * @function
         * @name pc.Mat3#clone
         * @description Creates a duplicate of the specified matrix.
         * @returns {pc.Mat3} A duplicate matrix.
         * @example
         * var src = new pc.Mat3().translate(10, 20, 30);
         * var dst = new pc.Mat3();
         * dst.copy(src);
         * console.log("The two matrices are " + (src.equal(dst) ? "equal" : "different"));
         */
        clone: function () {
            return new pc.Mat3().copy(this);
        },

        /**
         * @function
         * @name pc.Mat3#copy
         * @description Copies the contents of a source 3x3 matrix to a destination 3x3 matrix.
         * @param {pc.Mat3} src A 3x3 matrix to be copied.
         * @returns {pc.Mat3} Self for chaining
         * @example
         * var src = new pc.Mat3().translate(10, 20, 30);
         * var dst = new pc.Mat3();
         * dst.copy(src);
         * console.log("The two matrices are " + (src.equal(dst) ? "equal" : "different"));
         */
        copy: function (rhs) {
            var src = rhs.data;
            var dst = this.data;

            dst[0] = src[0];
            dst[1] = src[1];
            dst[2] = src[2];
            dst[3] = src[3];
            dst[4] = src[4];
            dst[5] = src[5];
            dst[6] = src[6];
            dst[7] = src[7];
            dst[8] = src[8];

            return this;
        },

        fromQuat: function( q ) {
            var x2 = q.x + q.x,
                y2 = q.y + q.y,
                z2 = q.z + q.z,

                xx = q.x * x2,
                xy = q.x * y2,
                xz = q.x * z2,
                yy = q.y * y2,
                yz = q.y * z2,
                zz = q.z * z2,
                wx = q.w * x2,
                wy = q.w * y2,
                wz = q.w * z2,
                dst = this.data;

            dst[0] = 1 - (yy + zz);
            dst[3] = xy + wz;
            dst[6] = xz - wy;

            dst[1] = xy - wz;
            dst[4] = 1 - (xx + zz);
            dst[7] = yz + wx;

            dst[2] = xz + wy;
            dst[5] = yz - wx;
            dst[8] = 1 - (xx + yy);

            return this;
        },

        fromMatrix4: function (m) {
            var n = this.data;
            m = m.data;
            n[0] = m[0];
            n[1] = m[1];
            n[2] = m[2];

            n[3] = m[4];
            n[4] = m[5];
            n[5] = m[6];

            n[6] = m[8];
            n[7] = m[9];
            n[8] = m[10];

            return this;
        },

        /**
         * @function
         * @name pc.Mat3#equals
         * @param {pc.Mat3} rhs The other matrix.
         * @description Reports whether two matrices are equal.
         * @returns {Boolean} true if the matrices are equal and false otherwise.
         * @example
         * var a = new pc.Mat3().translate(10, 20, 30);
         * var b = new pc.Mat3();
         * console.log("The two matrices are " + (a.equals(b) ? "equal" : "different"));
         */
        equals: function (rhs) {
            var l = this.data;
            var r = rhs.data;

            return ((l[0] === r[0]) &&
                    (l[1] === r[1]) &&
                    (l[2] === r[2]) &&
                    (l[3] === r[3]) &&
                    (l[4] === r[4]) &&
                    (l[5] === r[5]) &&
                    (l[6] === r[6]) &&
                    (l[7] === r[7]) &&
                    (l[8] === r[8]));
        },

        /**
         * @function
         * @name pc.Mat3#isIdentity
         * @description Reports whether the specified matrix is the identity matrix.
         * @returns {Boolean} true if the matrix is identity and false otherwise.
         * @example
         * var m = new pc.Mat3();
         * console.log("The matrix is " + (m.isIdentity() ? "identity" : "not identity"));
         */
        isIdentity: function () {
            var m = this.data;
            return ((m[0] === 1) &&
                    (m[1] === 0) &&
                    (m[2] === 0) &&
                    (m[3] === 0) &&
                    (m[4] === 1) &&
                    (m[5] === 0) &&
                    (m[6] === 0) &&
                    (m[7] === 0) &&
                    (m[8] === 1));
        },

        /**
         * @function
         * @name pc.Mat3#setIdentity
         * @description Sets the matrix to the identity matrix.
         * @returns {pc.Mat3} Self for chaining.
         * @example
         * m.setIdentity();
         * console.log("The two matrices are " + (src.equal(dst) ? "equal" : "different"));
         */
        setIdentity: function () {
            var m = this.data;
            m[0] = 1;
            m[1] = 0;
            m[2] = 0;

            m[3] = 0;
            m[4] = 1;
            m[5] = 0;

            m[6] = 0;
            m[7] = 0;
            m[8] = 1;

            return this;
        },

        /**
         * @function
         * @name pc.Mat3#toString
         * @description Converts the matrix to string form.
         * @returns {String} The matrix in string form.
         * @example
         * var m = new pc.Mat3();
         * // Should output '[1, 0, 0, 0, 1, 0, 0, 0, 1]'
         * console.log(m.toString());
         */
        toString: function () {
            var t = "[";
            for (var i = 0; i < 9; i++) {
                t += this.data[i];
                t += (i !== 9) ? ", " : "";
            }
            t += "]";
            return t;
        },

        /**
         * @function
         * @name pc.Mat3#transpose
         * @description Generates the transpose of the specified 3x3 matrix.
         * @returns {pc.Mat3} Self for chaining.
         * @example
         * var m = new pc.Mat3();
         *
         * // Transpose in place
         * m.transpose();
         */
        transpose: function () {
            var m = this.data;

            var tmp;
            tmp = m[1]; m[1] = m[3]; m[3] = tmp;
            tmp = m[2]; m[2] = m[6]; m[6] = tmp;
            tmp = m[5]; m[5] = m[7]; m[7] = tmp;

            return this;
        },

        transposeInto: function (m) {
            var n = this.data,
                k = m.data;
            k[0] = n[0];
            k[3] = n[1];
            k[6] = n[2];
            k[1] = n[3];
            k[4] = n[4];
            k[7] = n[5];
            k[2] = n[6];
            k[5] = n[7];
            k[8] = n[8];

            return m;
        },

        transformVector3: function (v) {
            var u = v.data,
                x = u[0],
                y = u[1],
                z = u[2],
                m = this.data;

            u[0] = m[0] * x + m[1] * y + m[2] * z;
            u[1] = m[3] * x + m[4] * y + m[5] * z;
            u[2] = m[6] * x + m[7] * y + m[8] * z;

            return v;
        },

        transformVector3Into: function (v, dest) {
            v = v.data;
            var x = v[0],
                y = v[1],
                z = v[2],
                dst = dest.data,
                m = this.data;

            dst[0] = m[0] * x + m[1] * y + m[2] * z;
            dst[1] = m[3] * x + m[4] * y + m[5] * z;
            dst[2] = m[6] * x + m[7] * y + m[8] * z;

            return dest;
        },

        invert: function() {
            var m = this.data,
                a00 = m[0], a01 = m[1], a02 = m[2],
                a10 = m[3], a11 = m[4], a12 = m[5],
                a20 = m[6], a21 = m[7], a22 = m[8],

                b01 = a22 * a11 - a12 * a21,
                b11 = -a22 * a10 + a12 * a20,
                b21 = a21 * a10 - a11 * a20,

                d = a00 * b01 + a01 * b11 + a02 * b21,
                id;

            if (!d) {
                return null;
            }
            id = 1 / d;

            m[0] = b01 * id;
            m[1] = (-a22 * a01 + a02 * a21) * id;
            m[2] = (a12 * a01 - a02 * a11) * id;
            m[3] = b11 * id;
            m[4] = (a22 * a00 - a02 * a20) * id;
            m[5] = (-a12 * a00 + a02 * a10) * id;
            m[6] = b21 * id;
            m[7] = (-a21 * a00 + a01 * a20) * id;
            m[8] = (a11 * a00 - a01 * a10) * id;

            return this;
        },

        invertInto: function(m) {
            var n = this.data,
                a00 = n[0], a01 = n[1], a02 = n[2],
                a10 = n[3], a11 = n[4], a12 = n[5],
                a20 = n[6], a21 = n[7], a22 = n[8],

                b01 = a22 * a11 - a12 * a21,
                b11 = -a22 * a10 + a12 * a20,
                b21 = a21 * a10 - a11 * a20,

                d = a00 * b01 + a01 * b11 + a02 * b21,
                id, k;

            if (!d) {
                return null;
            }
            id = 1 / d;

            k = m.data;
            k[0] = b01 * id;
            k[1] = (-a22 * a01 + a02 * a21) * id;
            k[2] = (a12 * a01 - a02 * a11) * id;
            k[3] = b11 * id;
            k[4] = (a22 * a00 - a02 * a20) * id;
            k[5] = (-a12 * a00 + a02 * a10) * id;
            k[6] = b21 * id;
            k[7] = (-a21 * a00 + a01 * a20) * id;
            k[8] = (a11 * a00 - a01 * a10) * id;

            return m;
        },

        multiply: function(m) {
            m = m.data;
            var n = this.data,
                a00 = n[0], a01 = n[1], a02 = n[2],
                a10 = n[3], a11 = n[4], a12 = n[5],
                a20 = n[6], a21 = n[7], a22 = n[8],

                b00 = m[0], b01 = m[1], b02 = m[2],
                b10 = m[3], b11 = m[4], b12 = m[5],
                b20 = m[6], b21 = m[7], b22 = m[8];

            n[0] = b00 * a00 + b10 * a01 + b20 * a02;
            n[3] = b00 * a10 + b10 * a11 + b20 * a12;
            n[6] = b00 * a20 + b10 * a21 + b20 * a22;

            n[1] = b01 * a00 + b11 * a01 + b21 * a02;
            n[4] = b01 * a10 + b11 * a11 + b21 * a12;
            n[7] = b01 * a20 + b11 * a21 + b21 * a22;

            n[2] = b02 * a00 + b12 * a01 + b22 * a02;
            n[5] = b02 * a10 + b12 * a11 + b22 * a12;
            n[8] = b02 * a20 + b12 * a21 + b22 * a22;

            return this;
        },

        multiplyFrom: function(a, b) {
            a = a.data;
            b = b.data;
            var a00 = a[0], a01 = a[1], a02 = a[2],
                a10 = a[3], a11 = a[4], a12 = a[5],
                a20 = a[6], a21 = a[7], a22 = a[8],

                b00 = b[0], b01 = b[1], b02 = b[2],
                b10 = b[3], b11 = b[4], b12 = b[5],
                b20 = b[6], b21 = b[7], b22 = b[8],
                m = this.data;

            m[0] = b00 * a00 + b10 * a01 + b20 * a02;
            m[3] = b00 * a10 + b10 * a11 + b20 * a12;
            m[6] = b00 * a20 + b10 * a21 + b20 * a22;

            m[1] = b01 * a00 + b11 * a01 + b21 * a02;
            m[4] = b01 * a10 + b11 * a11 + b21 * a12;
            m[7] = b01 * a20 + b11 * a21 + b21 * a22;

            m[2] = b02 * a00 + b12 * a01 + b22 * a02;
            m[5] = b02 * a10 + b12 * a11 + b22 * a12;
            m[8] = b02 * a20 + b12 * a21 + b22 * a22;

            return this;
        }
    };

    Mat3.prototype.setInitial = Mat3.prototype.setIdentity;

    /**
     * @field
     * @static
     * @readonly
     * @type pc.Mat3
     * @name pc.Mat3.IDENTITY
     * @description A constant matrix set to the identity.
     */
    Object.defineProperty(Mat3, 'IDENTITY', {
        get: function () {
            var identity = new Mat3();
            return function() {
                return identity;
            };
        }()
    });

    /**
     * @field
     * @static
     * @readonly
     * @type pc.Mat3
     * @name pc.Mat3.ZERO
     * @description A constant matrix with all elements set to 0.
     */
    Object.defineProperty(Mat3, 'ZERO', {
        get: function () {
            var zero = new Mat3(0, 0, 0, 0, 0, 0, 0, 0, 0);
            return function() {
                return zero;
            };
        }()
    });

    return {
        Mat3: Mat3
    };
}()));
