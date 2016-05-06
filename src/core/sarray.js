pc.extend(pc, function () {
    var SArray = function (length) {
        length = length || 1;
        if (this.data) {
            // this.data.length = length;
        } else {
            this.data = new Array(length);
        }
        this.length = 0;
    }

    SArray.prototype = {
        copy: function (arr) {
            // resize until there is room
            while (arr.length > this.data.length) {
                this.resize(this.data.length*2);
            }

            // clear data and copy array in
            for (var i = 0; i < arr.length;i++) {
                this.data[i] = arr[i];
            }
            this.length = arr.length;
        },

        set: function (index, value) {
            if(index >= this.data.length) {
                this.resize(this.data.length*2);
            }
            this.data[index] = value;
        },

        push: function (item) {
            if (this.length >= this.data.length) {
                this.resize(this.data.length*2);
            }
            this.data[this.length++] = item;

            return this.length;
        },

        pop: function () {
            if (this.length) {
                return this.data[this.length--];
            }
        },

        resize: function (length) {
            console.log("resize from: " + this.data.length + " to " + length);

            var _data = this.data;

            this.data = new Array(_data.length*2);
            for (var i = 0; i < _data.length; i++) {
                this.data[i] = _data[i];
            }
        }
    };

    return {
        SArray: SArray
    };
}());
