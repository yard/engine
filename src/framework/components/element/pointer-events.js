pc.extend(pc, function() {

    var POINTER_TEST_RESULT_PASS            = 0;
    var POINTER_TEST_RESULT_PASS_THROUGH    = 1;
    var POINTER_TEST_RESULT_FAIL            = 2;

    var PointEventsManager = {

        // Tests if the pointer event with coordinates passed (in local coord space)
        // falls into the bounds of the current element and should be processed by it
        // or its children.
        _testPointerEvent: function(point) {
            if (!this.entity || !this.entity.enabled) {
                return POINTER_TEST_RESULT_FAIL;
            }

            var failureResult = POINTER_TEST_RESULT_FAIL;

            if (this._width == 0 || this._height == 0 || this.entity.localScale.x < 0 || this.entity.localScale.y < 0 || !this._image) {
                failureResult = POINTER_TEST_RESULT_PASS_THROUGH;
            }

            if ((point.x >= 0) && (point.y >= 0) && (point.x <= this._width) && (point.y <= this._height)) {
                return POINTER_TEST_RESULT_PASS;
            } else {
                return failureResult;
            }
        },

        // Converts point in parent's coords into the local coordinate system.
        _parentPointToLocalPoint: function(point) {
            // check if we the screen component – do we have a camera on us?
            if (this._rootPointerEventReceiver) {
                // if so – we need to undergo camera-to-world transform first
                var cameraZ = this._screenType == pc.SCREEN_TYPE_SCREEN ? this.camera.nearClip : this.screenDistance;
                point = this.camera.screenToWorld( point.x, point.y, cameraZ, this.system.app.graphicsDevice.width, this.system.app.graphicsDevice.height );
                // ... and then use inverse screen matrix to transform point from camera world space into local UI space
                return this._inverseScreenMatrix.transformPoint(point);
            }

            // if we aren't a screen, we will use _localModelTransform which is constructed to transform points
            // from parent's element coord system into the local one
            return this._localModelTransform.transformPoint(point);
        },

        // Iterates over all children and passes the event through to them.
        _passPointerEventToChildren: function(name, eventData) {
            for(var i = 0; i < this.entity.children.length; i++) {
                var element =  this.entity.children[i];
                if (element && element.element) {
                    element.element[ name ].apply( element.element, eventData );
                }
            }
        },

        // Handles "down" pointer event – might be coming from touch or
        // a mouse.
        _pointerEventDown: function(point) {
            point = this._parentPointToLocalPoint(point);

            var testResult = this._testPointerEvent(point);

            if (testResult == POINTER_TEST_RESULT_FAIL) {
                return;
            }

            this._passPointerEventToChildren("_pointerEventDown", [ point ]);

            if (testResult == POINTER_TEST_RESULT_PASS) {
                this.fire(pc.POINTEREVENT_DOWN, point);
            }
        },

        // Handles "up" pointer event – might be coming from touch or
        // a mouse.
        _pointerEventUp: function(point) {
            point = this._parentPointToLocalPoint(point);

            var testResult = this._testPointerEvent(point);

            if (testResult == POINTER_TEST_RESULT_FAIL) {
                return;
            }

            this._passPointerEventToChildren("_pointerEventUp", [ point ]);

            if (testResult == POINTER_TEST_RESULT_PASS) {
                this.fire(pc.POINTEREVENT_CLICK, point);
                this.fire(pc.POINTEREVENT_UP, point);
            }
        },

        // Fires pointer leave event and also makes all children do so.
        _ensurePointerLeaveEvent: function(point) {
            this._pointerOver = false;
            this.fire(pc.POINTEREVENT_LEAVE, point); 

            this._passPointerEventToChildren( "_ensurePointerLeaveEvent", [ point ]);
        },

        // Handles "move" pointer event – might be coming from touch or
        // a mouse.
        _pointerEventMove: function(point) {
            point = this._parentPointToLocalPoint(point);

            var testResult = this._testPointerEvent(point);

            if (testResult != POINTER_TEST_RESULT_PASS) {
                if (this._pointerOver) {
                    this._ensurePointerLeaveEvent(point);            
                }

                return;
            }

            this._passPointerEventToChildren("_pointerEventMove", [ point ]);

            if (!this._pointerOver) {
                this._pointerOver = true;
                this.fire(pc.POINTEREVENT_ENTER, point);                
            }

            this.fire(pc.POINTEREVENT_MOVE, point);
        },

        // Handles "scroll" pointer event – might be coming from touch or
        // a mouse.
        _pointerEventScroll: function(point, amount) {
            point = this._parentPointToLocalPoint(point);

            var testResult = this._testPointerEvent(point);

            if (testResult == POINTER_TEST_RESULT_FAIL) {
                return;
            }

            this._passPointerEventToChildren("_pointerEventScroll", [ point, amount ]);

            if (testResult == POINTER_TEST_RESULT_PASS) {
                this.fire(pc.POINTEREVENT_SCROLL, point, amount);
            }
        },

        // Mouse-specific event handler.
        _onMouseDown: function(mouseEvent) {
            if (!this.entity || !this.entity.enabled) {
                return false;
            }

            this._pointerEventDown( new pc.Vec3( mouseEvent.x, mouseEvent.y, 0 ) );
        },

        // Mouse-specific event handler.
        _onMouseUp: function(mouseEvent) {
            if (!this.entity || !this.entity.enabled) {
                return false;
            }

            this._pointerEventUp( new pc.Vec3( mouseEvent.x, mouseEvent.y, 0 ) );
        },

        // Mouse-specific event handler.
        _onMouseMove: function(mouseEvent) {
            if (!this.entity || !this.entity.enabled) {
                return false;
            }

            this._pointerEventMove( new pc.Vec3( mouseEvent.x, mouseEvent.y, 0 ) );
        },

        // Touch-specific event handler.
        _onMouseWheel: function(mouseEvent) {
            if (!this.entity || !this.entity.enabled) {
                return false;
            }

            this._pointerEventScroll( new pc.Vec3( mouseEvent.x, mouseEvent.y, 0 ), mouseEvent.wheel );
        },

        // Touch-specific event handler.
        _onTouchUp: function(touchEvent) {
            if (!this.entity || !this.entity.enabled) {
                return false;
            }

            var touch = touchEvent.changedTouches[0];
            this._pointerEventUp( new pc.Vec3( touch.x, touch.y, 0 ) );
        },

        // Touch-specific event handler.
        _onTouchMove: function(touchEvent) {
            if (!this.entity || !this.entity.enabled) {
                return false;
            }
            
            var touch = touchEvent.changedTouches[0];
            this._pointerEventMove( new pc.Vec3( touch.x, touch.y, 0 ) );
        },

        /**
        * @function
        * @name pc.ScreenComponent#enablePointerEvents
        * @description Starts listening to mouse and touch events for the currenct {@link pc.ScreenComponent} instance.
        * @example
        * // On an entity with a screen component
        * entity.screen.enablePointerEvents();
        */
        enablePointerEvents: function(_app) {
            var app = _app || pc.Application.getApplication();

            if (app.mouse) {
                app.mouse.on(pc.EVENT_MOUSEDOWN,   this._onMouseDown,   this);
                app.mouse.on(pc.EVENT_MOUSEUP,     this._onMouseUp,     this);
                app.mouse.on(pc.EVENT_MOUSEMOVE,   this._onMouseMove,   this);
                app.mouse.on(pc.EVENT_MOUSEWHEEL,  this._onMouseWheel,  this);
            }

            if (app.touch) {
                app.touch.on(pc.EVENT_TOUCHSTART,  this._onTouchDown,   this);
                app.touch.on(pc.EVENT_TOUCHEND,    this._onTouchUp,     this);
                app.touch.on(pc.EVENT_TOUCHMOVE,   this._onTouchMove,   this);
                app.touch.on(pc.EVENT_TOUCHCANCEL, this._onTouchUp,     this);
            }

            this._rootPointerEventReceiver = true;
        }

    };

    // we mix point events in to both Screen and Element so that the whole UI stack
    // becomes mouse/touch events-aware.
    pc.extend(pc.ScreenComponent.prototype, PointEventsManager);
    pc.extend(pc.ElementComponent.prototype, PointEventsManager);

    return {
        POINTEREVENT_MOVE: "pointer:move",
        POINTEREVENT_UP: "pointer:up",
        POINTEREVENT_DOWN: "pointer:down",
        POINTEREVENT_CLICK: "pointer:click",
        POINTEREVENT_SCROLL: "pointer:scroll",
        POINTEREVENT_ENTER: "pointer:enter",
        POINTEREVENT_LEAVE: "pointer:leave",
    };
}());