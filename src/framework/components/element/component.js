pc.extend(pc, function () {
    pc.ELEMENTTYPE_GROUP = 'group';
    pc.ELEMENTTYPE_IMAGE = 'image';
    pc.ELEMENTTYPE_TEXT = 'text';

    var _warning = false;

    var ElementComponent = function ElementComponent (system, entity) {
        this._anchor = new pc.Vec4();
        this._worldAnchor = new pc.Vec4();

        this._pivot = new pc.Vec2();

        this._debugColor = null;

        // corner offsets in relation to anchors
        this._corners = new pc.Vec4(-16, -16, 16, 16);

        // the model transform used to render
        this._modelTransform = new pc.Mat4();

        this._screenToWorld = new pc.Mat4();

        // the position of the element in canvas co-ordinate system. (0,0 = top left)
        this._canvasPosition = new pc.Vec2();

        // transform that updates local position according to anchor values
        this._anchorTransform = new pc.Mat4();

        this._anchorDirty = true;

        this.entity.on('insert', this._onInsert, this);

        this.screen = null;

        this._type = pc.ELEMENTTYPE_GROUP;

        // element types
        this._image = null;
        this._text = null;
        this._group = null;

        if (!_warning) {
            console.warn("Message from PlayCanvas: The element component is currently in Beta. APIs may change without notice.");
            _warning = true;
        }
    };
    
    ElementComponent = pc.inherits(ElementComponent, pc.Component);


    pc.extend(ElementComponent.prototype, {
        _patch: function () {
            this.entity.sync = this._sync;
            this.entity.setPosition = this._setPosition;
        },

        _unpatch: function () {
            this.entity.sync = pc.Entity.prototype.sync;
            this.entity.setPosition = pc.Entity.prototype.setPosition;
        },

        _setPosition: function () {
            var position = new pc.Vec3();
            var invParentWtm = new pc.Mat4();

            return function (x, y, z) {
                if (x instanceof pc.Vec3) {
                    position.copy(x);
                } else {
                    position.set(x, y, z);
                }

                this.getWorldTransform(); // ensure hierarchy is up to date
                invParentWtm.copy(this.element._screenToWorld).invert();
                invParentWtm.transformPoint(position, this.localPosition);

                this.dirtyLocal = true;
            };
        }(),

        // this method overwrites GraphNode#sync and so operates in scope of the Entity.
        _sync: function () {
            if (this.dirtyLocal) {
                this.localTransform.setTRS(this.localPosition, this.localRotation, this.localScale);

                this.dirtyLocal = false;
                this.dirtyWorld = true;
                this._aabbVer++;
            }

            var screen = this.element.screen;
            var rect = null;

            if (this._parent && this._parent.element) {
                rect = new pc.Vec4(
                    this._parent.element._width  * this.element._anchor.x + this.element._corners.x,
                    this._parent.element._height * this.element._anchor.y + this.element._corners.y,
                    this._parent.element._width  * this.element._anchor.z + this.element._corners.z,
                    this._parent.element._height * this.element._anchor.w + this.element._corners.w
                );
            } else if (screen) {
                resolution = new pc.Vec2( screen.screen._width, screen.screen._height );

                rect = new pc.Vec4(
                    resolution.x * this.element._anchor.x + this.element._corners.x,
                    resolution.y * this.element._anchor.y + this.element._corners.y,
                    resolution.x * this.element._anchor.z + this.element._corners.z,
                    resolution.y * this.element._anchor.w + this.element._corners.w
                );
            }

            this.element._width = rect.z - rect.x;
            this.element._height = rect.w - rect.y;

            // the rect is going to be Vec4 storing the following values:
            // [ left offset, bottom offset, right offset, top offset ]
            if (this.element._anchorDirty || this.element._cornerDirty) {               
                this.element._anchorTransform.setTranslate(rect.x, rect.y, 0);
                this.element._anchorDirty = false;
            }

            if (this.dirtyWorld) {
                if (this._parent === null) {
                    this.worldTransform.copy(this.localTransform);
                } else {
                    // transform element hierarchy
                    if (this._parent.element) {
                        this.element._screenToWorld.mul2(this._parent.element._modelTransform, this.element._anchorTransform);
                    } else {
                        this.element._screenToWorld.copy(this.element._anchorTransform);
                    }

                    this.element._modelTransform.mul2(this.element._screenToWorld, this.localTransform);

                    if (screen) {
                        this.element._screenToWorld.mul2(screen.screen._screenMatrix, this.element._screenToWorld);

                        if (screen.screen.screenType != pc.SCREEN_TYPE_SCREEN) {
                            this.element._screenToWorld.mul2(screen.worldTransform, this.element._screenToWorld);
                        }

                        this.worldTransform.copy( this.element._screenToWorld );

                        var toPivotTransform = new pc.Mat4();
                        var pivotPoint = new pc.Vec3( this.element._width * this.element.pivot.x, this.element._height * this.element.pivot.y, 0 );

                        toPivotTransform.setTRS( pivotPoint, pc.Quat.IDENTITY, pc.Vec3.ONE );
                        this.worldTransform.mul( toPivotTransform ).mul( this.localTransform ).mul( toPivotTransform.invert() );

                        //this.worldTransform.mul2(this.element._screenToWorld, this.localTransform);
                    } else {
                        this.worldTransform.copy(this.element._modelTransform);
                    }
                }

                this.dirtyWorld = false;
                var child;

                for (var i = 0, len = this._children.length; i < len; i++) {
                    child = this._children[i];
                    child.dirtyWorld = true;
                    child._aabbVer++;
                }

                this.element.fire("resize", this.element._width, this.element._height);
            }
        },

        _drawDebugBox: function(dt) {
            var bottomLeft = new pc.Vec3();
            var r = new pc.Vec3( this._width, 0, 0 );
            var u = new pc.Vec3( 0, this._height, 0 );

            var corners = [
                bottomLeft.clone(),
                bottomLeft.clone().add(u),
                bottomLeft.clone().add(r).add(u),
                bottomLeft.clone().add(r)
            ];

            var points = [
                corners[0], corners[1],
                corners[1], corners[2],
                corners[2], corners[3],
                corners[3], corners[0]
            ];

            var transform = this.entity.worldTransform;

            for(var i = 0; i < points.length; i++) {
                points[i] = transform.transformPoint( points[i] );
            }

            this.system.app.renderLines(points, this._debugColor, this.screen.screen._screenType == pc.SCREEN_TYPE_SCREEN ? pc.LINEBATCH_SCREEN : pc.LINEBATCH_WORLD);
        },

        _onInsert: function (parent) {
            // when the entity is reparented find a possible new screen
            var screen = this._findScreen();
            this._updateScreen(screen);
        },

        _updateScreen: function (screen) {
            if (this.screen && this.screen !== screen) {
                this.screen.screen.off('set:resolution', this._onScreenResize, this);
                this.screen.screen.off('set:referenceresolution', this._onScreenResize, this);
                this.screen.screen.off('set:scaleblend', this._onScreenResize, this);
                this.screen.screen.off('set:screentype', this._onScreenTypeChange, this);
            }

            this.screen = screen;
            if (this.screen) {
                this.screen.screen.on('set:resolution', this._onScreenResize, this);
                this.screen.screen.on('set:referenceresolution', this._onScreenResize, this);
                this.screen.screen.on('set:scaleblend', this._onScreenResize, this);
                this.screen.screen.on('set:screentype', this._onScreenTypeChange, this);

                this._patch();
            } else {
                this._unpatch();
            }

            this.fire('set:screen', this.screen);

            this._anchorDirty = true;
            this.entity.dirtyWorld = true;

            // update all child screens
            var children = this.entity.getChildren();
            for (var i = 0, l = children.length; i < l; i++) {
                if (children[i].element) children[i].element._updateScreen(screen);
            }

            // calculate draw order
            if (this.screen) this.screen.screen.syncDrawOrder();
        },

        _findScreen: function () {
            var screen = this.entity._parent;
            while(screen && !screen.screen) {
                screen = screen._parent;
            }
            return screen;
        },

        _onScreenResize: function (res) {
            this.entity.dirtyWorld = true;
            this._anchorDirty = true;

            this.fire('screen:set:resolution', res);
        },

        _onScreenTyoeChange: function () {
            this.entity.dirtyWorld = true;
            this.fire('screen:set:screentype', this.screen.screen.screenType);
        },

        onEnable: function () {
            ElementComponent._super.onEnable.call(this);
            if (this._image) this._image.onEnable();
            if (this._text) this._text.onEnable();
            if (this._group) this._group.onEnable();
        },

        onDisable: function () {
            ElementComponent._super.onDisable.call(this);
            if (this._image) this._image.onDisable();
            if (this._text) this._text.onDisable();
            if (this._group) this._group.onDisable();
        },

        onRemove: function () {
            this._unpatch();
            if (this._image) this._image.destroy();
            if (this._text) this._text.destroy();
        }
    });

    Object.defineProperty(ElementComponent.prototype, "type", {
        get: function () {
            return this._type;
        },

        set: function (value) {
            if (value !== this._type) {
                if (this._image) {
                    this._image.destroy();
                    this._image = null;
                }
                if (this._text) {
                    this._text.destroy();
                    this._text = null;
                }

                if (value === pc.ELEMENTTYPE_IMAGE) {
                    this._image = new pc.ImageElement(this);
                } else if (value === pc.ELEMENTTYPE_TEXT) {
                    this._text = new pc.TextElement(this);
                }

            }
            this._type = value;
        }
    });

    Object.defineProperty(ElementComponent.prototype, "debugColor", {
        get: function () {
            return this._debugColor;
        },

        set: function (value) {
            this._debugColor = value;

            if (this._debugColor) {
                pc.ComponentSystem.on("update", this._drawDebugBox, this);
            } else {
                pc.ComponentSystem.off("update", this._drawDebugBox, this);
            }
        }
    });

    /**
    * @name pc.ElementComponent#corners
    * @type pc.Vec4
    * @description The corners of the component set in a form of {@link pc.Vec4} with coords meaning offsets from:
    * left anchor, bottom anchor, right anchor, top anchor
    * @example
    * // make element occupy central quarter of the parent with an inner padding of 10 px (or units, depending on screen 
    * // overlay flag)
    * var element = this.entity.element;
    * element.anchors = new pc.Vec4( 0.25, 0.75, 0.75, 0.25 );
    * element.corners = new pc.Vec4( 10, 10, -10, -10 );
    */
    Object.defineProperty(ElementComponent.prototype, "corners", {
        get: function () {
            return this._corners;
        },

        set: function (value) {
            this._corners = value;
            this._cornerDirty = true;

            this.getWorldTransform();
        }
    });

    Object.defineProperty(ElementComponent.prototype, "drawOrder", {
        get: function () {
            return this._drawOrder;
        },

        set: function (value) {
            this._drawOrder = value;
            this.fire('set:draworder', this._drawOrder);
        }
    });

    Object.defineProperty(ElementComponent.prototype, "worldLeft", {
        get: function () {
            return this._worldAnchor.data[0] + this.left;
        }
    });

    Object.defineProperty(ElementComponent.prototype, "worldRight", {
        get: function () {
            return this._worldAnchor.data[2] - this.right;
        }
    });

    Object.defineProperty(ElementComponent.prototype, "worldTop", {
        get: function () {
            return this._worldAnchor.data[3] - this.top;
        }
    });

    Object.defineProperty(ElementComponent.prototype, "worldBottom", {
        get: function () {
            return this._worldAnchor.data[1] + this.bottom;
        }
    });

    Object.defineProperty(ElementComponent.prototype, "width", {
        get: function () {
            return this._width;
        }
    });

    Object.defineProperty(ElementComponent.prototype, "height", {
        get: function () {
            return this._height;
        }
    });

    Object.defineProperty(ElementComponent.prototype, "left", {
        get: function () {
            return this._corners.x;
        },

        set: function (value) {
            this._corners.x = value;
            this._cornerDirty = true;

            this.getWorldTransform();
        }
    });

    Object.defineProperty(ElementComponent.prototype, "right", {
        get: function () {
            return this._corners.z;
        },

        set: function (value) {
            this._corners.z = value;
            this._cornerDirty = true;

            this.getWorldTransform();
        }
    });

    Object.defineProperty(ElementComponent.prototype, "top", {
        get: function () {
            return this._corners.w;
        },

        set: function (value) {
            this._corners.w = value;
            this._cornerDirty = true;

            this.getWorldTransform();
        }
    });

    Object.defineProperty(ElementComponent.prototype, "bottom", {
        get: function () {
            return this._corners.y;
        },

        set: function (value) {
            this._corners.y = value;
            this._cornerDirty = true;

            this.getWorldTransform();
        }
    });

    Object.defineProperty(ElementComponent.prototype, "pivot", {
        get: function () {
            return this._pivot;
        },

        set: function (value) {
            if (value instanceof pc.Vec2) {
                this._pivot.set(value.x, value.y);
            } else {
                this._pivot.set(value[0], value[1]);
            }

            this._onScreenResize();
            this.fire('set:pivot', this._pivot);
        }
    });

    /**
    * @name pc.ElementComponent#anchor
    * @type pc.Vec4
    * @description The anchor points of the element in the coordinate system of a parent. The anchors set the fraction
    * of respective parent's dimension in the form of {@link pc.Vec4} in the following order:
    * left anchor, bottom anchor, right anchor, top anchor
    * @example
    * // make element occupy central quarter of the parent
    * var element = this.entity.element;
    * element.anchors = new pc.Vec4( 0.25, 0.75, 0.75, 0.25 );
    */
    Object.defineProperty(ElementComponent.prototype, "anchor", {
        get: function () {
            return this._anchor;
        },

        set: function (value) {
            if (value instanceof pc.Vec4) {
                this._anchor.set(value.x, value.y, value.z, value.w);
            } else {
                this._anchor.set(value[0], value[1], value[2], value[3]);
            }

            this._anchorDirty = true;
            this.entity.dirtyWorld = true;
            this.fire('set:anchor', this._anchor);
        }
    });

    // return the position of the element in the canvas co-ordinate system
    Object.defineProperty(ElementComponent.prototype, "canvasPosition", {
        get: function () {
            // scale the co-ordinates to be in css pixels
            // then they fit nicely into the screentoworld method
            var device = this.system.app.graphicsDevice;
            var ratio = device.width / device.canvas.clientWidth;
            var scale = this.screen.screen.scale*ratio;
            this._canvasPosition.set(this._modelTransform.data[12]/scale, -this._modelTransform.data[13]/scale);
            return this._canvasPosition;
        }
    });

    var _define = function (name) {
        Object.defineProperty(ElementComponent.prototype, name, {
            get: function () {
                if (this._text) {
                    return this._text[name];
                } else if (this._image) {
                    return this._image[name];
                } else {
                    return null;
                }
            },
            set: function (value) {
                if (this._text) {
                    this._text[name] = value;
                } else if (this._image) {
                    this._image[name] = value;
                }
            }
        })
    };

    _define("fontSize");
    _define("color");
    _define("font");
    _define("fontAsset");
    _define("spacing");
    _define("lineHeight");
    _define("align");
    _define("verticalAlign");

    _define("text");
    _define("texture");
    _define("textureAsset");
    _define("material");
    _define("materialAsset");
    _define("opacity");
    _define("rect");

    return {
        ElementComponent: ElementComponent
    };
}());
