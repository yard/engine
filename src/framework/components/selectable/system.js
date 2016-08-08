pc.extend(pc, function () {
    /**
     * @name pc.SelectableComponentSystem
     * @description Create a new SelectableComponentSystem
     * @param {pc.Application} app The application
     * @extends pc.ComponentSystem
     */

    var SelectableComponentSystem = function SelectableComponentSystem(app) {
        this.id = 'selectable';
        this.app = app;
        app.systems.add(this.id, this);

        this.ComponentType = pc.SelectableComponent;
        this.DataType = pc.SelectableComponentData;

        this.schema = [ 'enabled' ];

        this.width = 1024;
        this.height = 1024;

        this._picker = new pc.Picker(app.graphicsDevice, this.width, this.height);
        this._rect = {x: 0, y: 0, width: 0, height: 0};

        this._canvasWidth = app.graphicsDevice.canvas.clientWidth;
        this._canvasHeight = app.graphicsDevice.canvas.clientHeight;

        this._downTime = 0;

        this._events = {}; // keep track of attached events for optimization

        this.attach(app);
    };
    SelectableComponentSystem = pc.inherits(SelectableComponentSystem, pc.ComponentSystem);

    SelectableComponentSystem.prototype.attach = function (app) {
        if (app.mouse) {
            app.mouse.on('mousedown', this._onMouseDown, this);
            app.mouse.on('mouseup', this._onMouseUp, this);
            app.mouse.on('mousemove', this._onMouseMove, this);
        }

        if (app.touch) {
            app.touch.on('touchstart', this._onTouchStart, this);
            app.touch.on('touchend', this._onTouchEnd, this);
            app.touch.on('touchmove', this._onTouchMove, this);
            app.touch.on('touchcancel', this._onTouchCancel, this);
        }
    };

    SelectableComponentSystem.prototype.at = function (x, y, camera) {
        camera = camera || this.app.systems.camera.cameras[0].camera;
        this._picker.prepare(camera, this.app.scene);

        this._rect.x = x * this._picker.width / app.graphicsDevice.canvas.clientWidth;
        this._rect.y = this._picker.height - Math.floor(y*this._picker.height/app.graphicsDevice.canvas.clientHeight);

        var results = this._picker.getSelection(this._rect);
        if (results.length > 0) {
            var meshInstance = results[0];

            // walk up hierarchy to find Entity
            var node = meshInstance.node;
            while(node && !(node instanceof pc.Entity)) {
                node = node._parent;
            }

            return node;
        }

        return null;
    };

    SelectableComponentSystem.prototype.addEvent = function (name) {
        if (this._events[name] === undefined) this._events[name] = 0;
        this._events[name]++;
    };

    SelectableComponentSystem.prototype.removeEvent = function (name) {
        this._events[name]--;
    };

    SelectableComponentSystem.prototype._onMouseDown = function (e) {
        if (this._events['pointerdown'] === 0) return;

        var entity = this.at(e.x, e.y);
        if (entity && entity.selectable) {
            entity.selectable.onPointerDown(e.x, e.y);
        }

    };

    SelectableComponentSystem.prototype._onMouseUp = function (e) {

        var entity = this.at(e.x, e.y);
        if (entity && entity.selectable) {
            entity.selectable.onPointerUp(e.x, e.y);
            entity.selectable.onPointerClick(e.x, e.y);
        }
    };

    SelectableComponentSystem.prototype._onMouseMove = function (e) {
        if (!this._events['pointerenter'] && !this._events['pointerexit']) return; // don't

        var entity = this.at(e.x, e.y);

        var components = this.dataStore;

        for (var guid in components) {
            var d = components[guid];
            d.entity.selectable.onPointerMove(e.x, e.y, entity === d.entity);
        }
    };

    SelectableComponentSystem.prototype._onTouchStart = function (e) {
        if (!this._events['pointerdown']) return;

        var touch = e.changedTouches[0];

        var entity = this.at(touch.x, touch.y);
        if (entity && entity.selectable) {
            entity.selectable.onPointerDown(touch.x, touch.y);
        }
    };

    SelectableComponentSystem.prototype._onTouchEnd = function (e) {
        if (!this._events['pointerup'] && !this._events['pointerclick']) return;

        var touch = e.changedTouches[0];

        var entity = this.at(touch.x, touch.y);
        if (entity && entity.selectable) {
            entity.selectable.onPointerUp(touch.x, touch.y);
        }
    };

    SelectableComponentSystem.prototype._onTouchCancel = function (e) {
        if (!this._events['pointerup'] && !this._events['pointerclick']) return;

        var touch = e.changedTouches[0];

        var entity = this.at(touch.x, touch.y);
        if (entity && entity.selectable) {
            entity.selectable.onPointerUp(touch.x, touch.y);
        }
    };

    SelectableComponentSystem.prototype._onTouchMove = function (e) {
        if (!this._events['pointerenter'] && !this._events['pointerexit']) return;

        var touch = e.changedTouches[0];

        var entity = this.at(touch.x, touch.y);
        var components = this.dataStore;

        for (var guid in components) {
            var d = components[guid];
            d.entity.selectable.onPointerMove(touch.x, touch.y, entity === d.entity);
        }
    };

    return {
        SelectableComponentSystem: SelectableComponentSystem
    };
}());
