pc.extend(pc, function () {
    var Tween = function (target, manager, entity) {
        pc.events.attach(this);

        this.manager = manager;

        if (entity) {
            this.entity = null; // if present the tween will dirty the transforms after modify the target
        }

        this.time = 0;

        this.complete = false;
        this.playing = false;
        this.stopped = true;
        this.pending = false;

        this.target = target;

        this.duration = 0;
        this._currentDelay = 0;
        this.timeScale = 1;
        this._reverse = false;

        this._delay = 0;
        this._yoyo = false;

        this._count = 0;
        this._numRepeats = 0;
        this._repeatDelay = 0;

        this._from = false; // indicates a "from" tween

        // for rotation tween
        this._slerp = false; // indicates a rotation tween
        this._fromQuat = new pc.Quat();
        this._toQuat = new pc.Quat();
        this._quat = new pc.Quat();

        this.easing = pc.EASE_LINEAR;

        this._sv = {}; // start values
        this._ev = {}; // end values
    };

    Tween.prototype = {
        // properties - js obj of values to update in target
        to: function (properties, duration, easing, delay, repeat, yoyo) {
            if (properties instanceof pc.Vec3) {
                this._properties = {
                    x: properties.x,
                    y: properties.y,
                    z: properties.z
                };
            } else if (properties instanceof pc.Color) {
                this._properties = {
                    r: properties.r,
                    g: properties.g,
                    b: properties.b,
                };
                if (properties.a !== undefined) {
                    this._properties.a = properties.a;
                }
            } else {
                this._properties = properties;
            }

            this.duration = duration;

            if (easing) this.easing = easing;
            if (delay) {
                this.delay(delay);
            }
            if (repeat) {
                this.repeat(repeat);
            }

            if (yoyo) {
                this.yoyo(yoyo);
            }

            return this;
        },

        from: function (properties, duration, easing, delay, repeat, yoyo) {
            if (properties instanceof pc.Vec3) {
                this._properties = {
                    x: properties.x,
                    y: properties.y,
                    z: properties.z
                };
            } else if (properties instanceof pc.Color) {
                this._properties = {
                    r: properties.r,
                    g: properties.g,
                    b: properties.b,
                };
                if (properties.a !== undefined) {
                    this._properties.a = properties.a;
                }
            } else {
                this._properties = properties;
            }

            this.duration = duration;

            if (easing) this.easing = easing;
            if (delay) {
                this.delay(delay);
            }
            if (repeat) {
                this.repeat(repeat);
            }

            if (yoyo) {
                this.yoyo(yoyo);
            }

            this._from = true;

            return this;
        },

        rotate: function (properties, duration, easing, delay, repeat, yoyo) {
            if (properties instanceof pc.Quat) {
                this._properties = {
                    x: properties.x,
                    y: properties.y,
                    z: properties.z,
                    w: properties.w
                }
            } else if (properties instanceof pc.Vec3) {
                this._properties = {
                    x: properties.x,
                    y: properties.y,
                    z: properties.z
                };
            } else if (properties instanceof pc.Color) {
                this._properties = {
                    r: properties.r,
                    g: properties.g,
                    b: properties.b,
                };
                if (properties.a !== undefined) {
                    this._properties.a = properties.a;
                }
            } else {
                this._properties = properties;
            }

            this.duration = duration;

            if (easing) this.easing = easing;
            if (delay) {
                this.delay(delay);
            }
            if (repeat) {
                this.repeat(repeat);
            }

            if (yoyo) {
                this.yoyo(yoyo);
            }

            this._slerp = true;

            return this;
        },

        start: function () {
            this.playing = true;
            this.complete = false;
            this.stopped = false;

            if (this._reverse && !this.pending) {
                this.time = this.duration;
            } else {
                this.time = 0;
            }

            if (this._from) {
                for (var prop in this._properties) {
                    this._sv[prop] = this._properties[prop];
                    this._ev[prop] = this.target[prop];
                }

                if (this._slerp) {
                    this._toQuat.setFromEulerAngles(this.target.x, this.target.y, this.target.z);

                    var _x = this._properties.x !== undefined ? this._properties.x : this.target.x;
                    var _y = this._properties.y !== undefined ? this._properties.y : this.target.y;
                    var _z = this._properties.z !== undefined ? this._properties.z : this.target.z;
                    this._fromQuat.setFromEulerAngles(_x, _y, _z);
                }
            } else {
                for (var prop in this._properties) {
                    this._sv[prop] = this.target[prop];
                    this._ev[prop] = this._properties[prop];
                }

                if (this._slerp) {
                    this._fromQuat.setFromEulerAngles(this.target.x, this.target.y, this.target.z);

                    var _x = this._properties.x !== undefined ? this._properties.x : this.target.x;
                    var _y = this._properties.y !== undefined ? this._properties.y : this.target.y;
                    var _z = this._properties.z !== undefined ? this._properties.z : this.target.z;
                    this._toQuat.setFromEulerAngles(_x, _y, _z);
                }
            }

            // set delay
            this._currentDelay = this._delay;

            // add to manager when started
            this.manager.add(this);

            return this;
        },

        pause: function () {
            this.playing = false;
        },

        resume: function () {
            this.playing = true;
        },

        stop: function () {
            this.playing = false;
            this.stopped = true;
        },

        delay: function (delay) {
            this._delay = delay;
            this.pending = true;

            return this;
        },

        repeat: function (num, delay) {
            this._count = 0;
            this._numRepeats = num;
            if (delay) {
                this._repeatDelay = delay;
            } else {
                this._repeatDelay = 0;
            }

            return this;
        },

        loop: function (loop) {
            if (loop) {
                this._count = 0;
                this._numRepeats = Infinity;
            } else {
                this._numRepeats = 0;
            }

            return this;
        },

        yoyo: function (yoyo) {
            this._yoyo = yoyo;
            return this;
        },

        reverse: function () {
            this._reverse = !this._reverse;

            return this;
        },

        chain: function () {
            var n = arguments.length;

            while(n--) {
                if (n > 0) {
                    arguments[n-1]._chained = arguments[n]
                } else {
                    this._chained = arguments[n];
                }
            }

            return this;
        },

        update: function (dt) {
            if (!this.playing) return true;

            if (!this._reverse || this.pending) {
                this.time += dt*this.timeScale;
            } else {
                this.time -= dt*this.timeScale;
            }

            // delay start if required
            if (this.pending) {
                if (this.time > this._currentDelay) {
                    if (this._reverse) {
                        this.time = this.duration - (this.time - this._currentDelay);
                    } else {
                        this.time = this.time - this._currentDelay;
                    }
                    this.pending = false;
                } else {
                    return true;
                }
            }

            var _extra = 0;
            if ((!this._reverse && this.time > this.duration) || (this._reverse && this.time < 0)){
                this._count++;
                this.complete = true;

                if (this._reverse) {
                    _extra = this.duration - this.time;
                    this.time = 0;
                } else {
                    _extra = this.time - this.duration;
                    this.time = this.duration;
                }
            }

            var elapsed = this.time / this.duration;

            // run easing
            var a = this.easing(elapsed);

            // increment property
            var s,e,d;
            for (var prop in this._properties) {
                s = this._sv[prop];
                e = this._ev[prop];

                this.target[prop] = s + (e - s) * a;
            }

            if (this._slerp) {
                this._quat.slerp(this._fromQuat, this._toQuat, a);
            }

            // if this is a entity property then we should dirty the transform
            if (this.entity) {
                this.entity.dirtyLocal = true;
                this.entity.dirtyWorld = true;
                if (this._slerp) {
                    this.entity.setLocalRotation(this._quat);
                }
            }

            this.fire("update", dt);

            if (this.complete) {
                var repeat = this._repeat(_extra);
                if (!repeat) {
                    this.fire("complete", _extra);
                    if (this._chained) this._chained.start();
                } else {
                    this.fire("loop");
                }

                return repeat;
            }

            return true;
        },

        _repeat: function (extra) {
            // test for repeat conditions
            if (this._count < this._numRepeats) {
                // do a repeat
                if (this._reverse) {
                    this.time = this.duration - extra;
                } else {
                    this.time = extra; // include overspill time
                }
                this.complete = false;

                this._currentDelay = this._repeatDelay;
                this.pending = true;

                if (this._yoyo) {
                    // swap start/end properties
                    for (var prop in this._properties) {
                        tmp = this._sv[prop];
                        this._sv[prop] = this._ev[prop];
                        this._ev[prop] = tmp;
                    }

                    if (this._slerp) {
                        this._quat.copy(this._fromQuat);
                        this._fromQuat.copy(this._toQuat);
                        this._toQuat.copy(this._quat);
                    }
                }

                return true;
            }
            return false;
        },

    };

    return {
        Tween: Tween
    };
}());
