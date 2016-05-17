pc.extend(pc, function () {
    var SArray = function (length) {
        length = length || 1;
        if (!this.data) {
            // check for pre-existing data in-case this is being pooled
            this.data = new Array(length);
        }
        this.length = 0;
    }

    SArray.prototype = {
        // copy other array into this array
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

        // set a value at index
        set: function (index, value) {
            if(index >= this.data.length) {
                this.resize(this.data.length*2);
            }
            this.data[index] = value;
        },

        // push new value onto end
        push: function (item) {
            if (this.length >= this.data.length) {
                this.resize(this.data.length*2);
            }
            this.data[this.length++] = item;

            return this.length;
        },

        // pop value off end
        pop: function () {
            if (this.length) {
                return this.data[this.length--];
            }
        },

        // resize
        resize: function (length) {
            console.log("resize from: " + this.data.length + " to " + length);

            var _data = this.data;

            this.data = new Array(length*2);
            for (var i = 0; i < _data.length; i++) {
                this.data[i] = _data[i];
            }
        }
    };

    return {
        SArray: SArray
    };
}());
