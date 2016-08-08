pc.extend(pc, function () {
    /**
    * @component
    * @name pc.SelectableComponent
    * @extends pc.Component
    * @class
    */

    var SelectableComponent = function SelectableComponent(system, entity) {
        this._selected = false;

        entity._on = entity.on;
        entity.on = this._on;
    };
    SelectableComponent = pc.inherits(SelectableComponent, pc.Component);

    SelectableComponent.prototype._on = function (name, callback, scope) {
        this.selectable.system.addEvent(name);
        // call original event handler
        this._on(name, callback, scope);
    };

    SelectableComponent.prototype._off = function (name, callback, scope) {
        this.selectable.system.removeEvent(name);
        // call original event handler
        this._off(name, callback, scope);
    };

    SelectableComponent.prototype.onPointerClick = function (x, y) {
        if (this.entity.enabled) {
            this.entity.fire("pointerclick", x, y);
        }
    };

    SelectableComponent.prototype.onPointerDown = function (x, y) {
        if (this.entity.enabled) {
            this.entity.fire("pointerdown", x, y);
        }
    };

    SelectableComponent.prototype.onPointerUp = function (x, y) {
        if (this.entity.enabled) {
            this.entity.fire("pointerup", x, y);
        }
    };

    SelectableComponent.prototype.onPointerMove = function (x, y, selected) {
        if (!this._selected && selected) {
            this.entity.fire("pointerenter");
        } else if (this._selected && !selected) {
            this.entity.fire("pointerexit");
        }
        this._selected = selected;
    };

    return {
        SelectableComponent: SelectableComponent
    };
}());
