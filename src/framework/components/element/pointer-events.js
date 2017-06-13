pc.extend(pc, function() {

    var POINTER_TEST_RESULT_PASS            = 0;
    var POINTER_TEST_RESULT_PASS_THROUGH    = 1;
    var POINTER_TEST_RESULT_FAIL            = 2;

    var ray = { origin: new pc.Vec3, direction: new pc.Vec3 };
    var pointerPosition = new pc.Vec3;

    var PointEventsManager = {

        // Tests if the pointer event with coordinates passed (in local coord space)
        // falls into the bounds of the current element and should be processed by it
        // or its children.
        _testPointerEvent: function(point) {
            if (!this.entity || !this.entity.enabled) {
                return POINTER_TEST_RESULT_FAIL;
            }

            var failureResult = POINTER_TEST_RESULT_FAIL;

            if (this._width == 0 || this._height == 0 || this.entity.localScale.x < 0 || this.entity.localScale.y < 0) {
                failureResult = POINTER_TEST_RESULT_PASS_THROUGH;
            }

            if ((point.x >= 0) && (point.y >= 0) && (point.x <= this._width) && (point.y <= this._height)) {
                return POINTER_TEST_RESULT_PASS;
            } else {
                return failureResult;
            }
        },

        // Converts supplied screen point to "world-space" ray. "World-space" is not literally
        // worldspace as in case of screen space canvas it's in fact screen-space.
        _screenPointToRay: function (point) {
            // if we are screen-space guys, camera transforms will be no help – we are 
            // using our own ortho matrix anyway
            if (this._screenType == pc.SCREEN_TYPE_SCREEN) {
                ray.origin.set(
                    (point.x / this.system.app.graphicsDevice.width - 0.5) * 2, 
                    (0.5 - point.y / this.system.app.graphicsDevice.height) * 2, 
                    1000
                );

                ray.direction.set(
                    0,
                    0,
                    -1
                );
            } else {
                if (this.camera == null) {
                    var app = pc.Application.getApplication();
                    var cameraInstance = app.systems.camera.cameras[ app.systems.camera.cameras.length - 1 ];
                    this.camera = cameraInstance ? cameraInstance.camera : null;
                }

                this.camera.screenToWorld( point.x, point.y, this.camera.farClip, this.system.app.graphicsDevice.width, this.system.app.graphicsDevice.height, ray.direction );
                this.camera.screenToWorld( point.x, point.y, this.camera.nearClip, this.system.app.graphicsDevice.width, this.system.app.graphicsDevice.height, ray.origin );

                ray.direction.sub( ray.origin );
                ray.direction.normalize();
            }

            return ray;
        },

        // Raycasts the ray in "world-space" to local coordinates of the element.
        _rayToLocalPoint: function (ray) {
            if (!this.entity.element) {
                return pointerPosition;
            }

            var wt  = this.entity.element._pivotGraph.getWorldTransform();
            var iwt = this.entity.element._inversePivotWorldTransform;

            var l0 = ray.origin.clone();
            var l  = ray.direction.clone();

            var p0 = this.entity.getPosition();
            var n  = wt.transformVector( new pc.Vec3( 0, 0, -1 ) ).normalize();

            var t  = p0.sub(l0).dot(n) / l.dot(n);
            var p  = l0.add( l.scale(t) );

            return iwt.transformPoint(p);
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
        _pointerEventDown: function( ray ) {
            var point = this._rayToLocalPoint( ray );

            var testResult = this._testPointerEvent( point );

            if (testResult == POINTER_TEST_RESULT_FAIL) {
                return;
            }

            this._passPointerEventToChildren("_pointerEventDown", [ ray ]);

            if (testResult == POINTER_TEST_RESULT_PASS) {
                this.fire(pc.POINTEREVENT_DOWN, point);
            }
        },

        // Handles "up" pointer event – might be coming from touch or
        // a mouse.
        _pointerEventUp: function( ray ) {
            var point = this._rayToLocalPoint( ray );

            var testResult = this._testPointerEvent(point);

            if (testResult == POINTER_TEST_RESULT_FAIL) {
                return;
            }

            this._passPointerEventToChildren("_pointerEventUp", [ ray ]);

            if (testResult == POINTER_TEST_RESULT_PASS) {
                this.fire(pc.POINTEREVENT_CLICK, point);
                this.fire(pc.POINTEREVENT_UP, point);
            }
        },

        // Fires pointer leave event and also makes all children do so.
        _ensurePointerLeaveEvent: function( ray ) {
            var point = this._rayToLocalPoint( ray );

            this._pointerOver = false;
            this.fire(pc.POINTEREVENT_LEAVE, point); 

            this._passPointerEventToChildren( "_ensurePointerLeaveEvent", [ ray ]);
        },

        // Handles "move" pointer event – might be coming from touch or
        // a mouse.
        _pointerEventMove: function( ray ) {
            var point = this._rayToLocalPoint( ray );

            var testResult = this._testPointerEvent(point);

            if (testResult == POINTER_TEST_RESULT_FAIL) {
                if (this._pointerOver) {
                    this._ensurePointerLeaveEvent( ray );            
                }

                return;
            }

            this._passPointerEventToChildren("_pointerEventMove", [ ray ]);

            if (!this._pointerOver) {
                this._pointerOver = true;
                this.fire(pc.POINTEREVENT_ENTER, point);                
            }

            this.fire(pc.POINTEREVENT_MOVE, point);
        },

        // Handles "scroll" pointer event – might be coming from touch or
        // a mouse.
        _pointerEventScroll: function( ray, amount ) {
            var point = this._rayToLocalPoint( ray );

            var testResult = this._testPointerEvent(point);

            if (testResult == POINTER_TEST_RESULT_FAIL) {
                return;
            }

            this._passPointerEventToChildren("_pointerEventScroll", [ ray, amount ]);

            if (testResult == POINTER_TEST_RESULT_PASS) {
                this.fire(pc.POINTEREVENT_SCROLL, point, amount);
            }
        },

        // Mouse-specific event handler.
        _onMouseDown: function(mouseEvent) {
            if (this.entity.parent && this.entity.parent.screen) {
                return;
            }

            if (!this.entity || !this.entity.enabled) {
                return false;
            }

            pointerPosition.set( mouseEvent.x, mouseEvent.y, 0 );
            this._pointerEventDown( this._screenPointToRay( pointerPosition ) );
        },

        // Mouse-specific event handler.
        _onMouseUp: function(mouseEvent) {
            if (this.entity.parent && this.entity.parent.screen) {
                return;
            }

            if (!this.entity || !this.entity.enabled) {
                return false;
            }

            pointerPosition.set( mouseEvent.x, mouseEvent.y, 0 );
            this._pointerEventUp( this._screenPointToRay( pointerPosition ) );
        },

        // Mouse-specific event handler.
        _onMouseMove: function(mouseEvent) {
            if (this.entity.parent && this.entity.parent.screen) {
                return;
            }

            if (!this.entity || !this.entity.enabled) {
                return false;
            }

            pointerPosition.set( mouseEvent.x, mouseEvent.y, 0 );
            this._pointerEventMove( this._screenPointToRay( pointerPosition ) );
        },

        // Touch-specific event handler.
        _onMouseWheel: function(mouseEvent) {
            if (!this.entity || !this.entity.enabled) {
                return false;
            }

            pointerPosition.set( mouseEvent.x, mouseEvent.y, 0 );
            this._pointerEventScroll( this._screenPointToRay( pointerPosition ), mouseEvent.wheel );
        },

        // Touch-specific event handler.
        _onTouchUp: function(touchEvent) {
            if (!this.entity || !this.entity.enabled) {
                return false;
            }

            var touch = touchEvent.changedTouches[0];
            
            pointerPosition.set( touch.x, touch.y, 0 );
            this._pointerEventUp( this._screenPointToRay( pointerPosition ) );
        },

        // Touch-specific event handler.
        _onTouchDown: function(touchEvent) {
            if (!this.entity || !this.entity.enabled) {
                return false;
            }

            var touch = touchEvent.changedTouches[0];
            
            pointerPosition.set( touch.x, touch.y, 0 );
            this._pointerEventDown( this._screenPointToRay( pointerPosition ) );
        },

        // Touch-specific event handler.
        _onTouchMove: function(touchEvent) {
            if (!this.entity || !this.entity.enabled) {
                return false;
            }
            
            var touch = touchEvent.changedTouches[0];
            
            pointerPosition.set( touch.x, touch.y, 0 );
            this._pointerEventMove( this._screenPointToRay( pointerPosition ) );
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