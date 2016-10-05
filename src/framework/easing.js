pc.extend(pc, function () {
    var Linear = function (k) {
        return k;
    };

    var QuadraticIn = function (k) {
        return k * k;
    };

    var QuadraticOut = function (k) {
        return k * (2 - k);
    };

    var QuadraticInOut = function (k) {
        if ((k *= 2) < 1) {
            return 0.5 * k * k;
        }
        return -0.5 * (--k * (k - 2) - 1);
    };

    var CubicIn = function (k) {
        return k * k * k;
    };

    var CubicOut = function (k) {
        return --k * k * k + 1;
    };

    var CubicInOut = function (k) {
        if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k;
        return 0.5 * ( ( k -= 2 ) * k * k + 2 );
    };

    var QuarticIn = function (k) {
            return k * k * k * k;
    };

    var QuarticOut = function (k) {
        return 1 - ( --k * k * k * k );
    };

    var QuarticInOut = function (k) {
        if ( ( k *= 2 ) < 1) return 0.5 * k * k * k * k;
        return - 0.5 * ( ( k -= 2 ) * k * k * k - 2 );
    };

    var QuinticIn = function (k) {
            return k * k * k * k * k;
    };

    var QuinticOut = function (k) {
            return --k * k * k * k * k + 1;
    };

    var QuinticInOut = function (k) {
        if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k * k * k;
        return 0.5 * ( ( k -= 2 ) * k * k * k * k + 2 );
    };

    var SineIn = function (k) {
        if (k === 0) return 0;
        if (k === 1) return 1;
        return 1 - Math.cos( k * Math.PI / 2 );
    };

    var SineOut = function (k) {
        if (k === 0) return 0;
        if (k === 1) return 1;
        return Math.sin( k * Math.PI / 2 );
    };

    var SineInOut = function (k) {
        if (k === 0) return 0;
        if (k === 1) return 1;
        return 0.5 * ( 1 - Math.cos( Math.PI * k ) );
    };

    var ExponentialIn = function (k) {
        return k === 0 ? 0 : Math.pow( 1024, k - 1 );
    };

    var ExponentialOut = function (k) {
        return k === 1 ? 1 : 1 - Math.pow( 2, - 10 * k );
    };

    var ExponentialInOut = function (k) {
        if ( k === 0 ) return 0;
        if ( k === 1 ) return 1;
        if ( ( k *= 2 ) < 1 ) return 0.5 * Math.pow( 1024, k - 1 );
        return 0.5 * ( - Math.pow( 2, - 10 * ( k - 1 ) ) + 2 );
    };

    var CircularIn = function (k) {
        return 1 - Math.sqrt( 1 - k * k );
    };

    var CircularOut = function (k) {
        return Math.sqrt( 1 - ( --k * k ) );
    };

    var CircularInOut = function (k) {
        if ( ( k *= 2 ) < 1) return - 0.5 * ( Math.sqrt( 1 - k * k) - 1);
        return 0.5 * ( Math.sqrt( 1 - ( k -= 2) * k) + 1);
    };

    var ElasticIn = function (k) {
        var s, a = 0.1, p = 0.4;
        if ( k === 0 ) return 0;
        if ( k === 1 ) return 1;
        if ( !a || a < 1 ) { a = 1; s = p / 4; }
        else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
        return - ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
    };

    var ElasticOut = function (k) {
        var s, a = 0.1, p = 0.4;
        if ( k === 0 ) return 0;
        if ( k === 1 ) return 1;
        if ( !a || a < 1 ) { a = 1; s = p / 4; }
        else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
        return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );
    };

    var ElasticInOut = function (k) {
        var s, a = 0.1, p = 0.4;
        if ( k === 0 ) return 0;
        if ( k === 1 ) return 1;
        if ( !a || a < 1 ) { a = 1; s = p / 4; }
        else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
        if ( ( k *= 2 ) < 1 ) return - 0.5 * ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
        return a * Math.pow( 2, -10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) * 0.5 + 1;
    };

    var BackIn = function (k) {
            var s = 1.70158;
            return k * k * ( ( s + 1 ) * k - s );
    };

    var BackOut = function (k) {
        var s = 1.70158;
        return --k * k * ( ( s + 1 ) * k + s ) + 1;
    };

    var BackInOut = function (k) {
        var s = 1.70158 * 1.525;
        if ( ( k *= 2 ) < 1 ) return 0.5 * ( k * k * ( ( s + 1 ) * k - s ) );
        return 0.5 * ( ( k -= 2 ) * k * ( ( s + 1 ) * k + s ) + 2 );
    };

    var BounceIn = function (k) {
        return 1 - BounceOut( 1 - k );
    };

    var BounceOut = function (k) {
        if ( k < ( 1 / 2.75 ) ) {
            return 7.5625 * k * k;
        } else if ( k < ( 2 / 2.75 ) ) {
            return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
        } else if ( k < ( 2.5 / 2.75 ) ) {
            return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
        } else {
            return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
        }
    };

    var BounceInOut = function (k) {
        if ( k < 0.5 ) return BounceIn( k * 2 ) * 0.5;
        return BounceOut( k * 2 - 1 ) * 0.5 + 0.5;
    };

    return {
        Linear: Linear,
        QuadraticIn: QuadraticIn,
        QuadraticOut: QuadraticOut,
        QuadraticInOut: QuadraticInOut,
        CubicIn: CubicIn,
        CubicOut: CubicOut,
        CubicInOut: CubicInOut,
        QuarticIn: QuarticIn,
        QuarticOut: QuarticOut,
        QuarticInOut: QuarticInOut,
        QuinticIn: QuinticIn,
        QuinticOut: QuinticOut,
        QuinticInOut: QuinticInOut,
        SineIn: SineIn,
        SineOut: SineOut,
        SineInOut: SineInOut,
        ExponentialIn: ExponentialIn,
        ExponentialOut: ExponentialOut,
        ExponentialInOut: ExponentialInOut,
        CircularIn: CircularIn,
        CircularOut: CircularOut,
        CircularInOut: CircularInOut,
        BackIn: BackIn,
        BackOut: BackOut,
        BackInOut: BackInOut,
        BounceIn: BounceIn,
        BounceOut: BounceOut,
        BounceInOut: BounceInOut,
        ElasticIn: ElasticIn,
        ElasticOut: ElasticOut,
        ElasticInOut: ElasticInOut
    }
}());

