pc.extend(pc, function () {

    /**
     * @name pc.ImageElement
     * @description Attaches image extension to an element.
     * @class This extension makes an element render an image taken from a texture (or a texture asset).
     * An image always spans for the whole layout box of an element and follows its transformations, including
     * both anchor/corner and local ones.
     * An image can also be said to mask children elements: in this case child elements outside a specific area
     * will not be draw.
     * @param {pc.ElementComponent} element The ElementComponent to attach image extension to.
     * @property {pc.Color} color The color to tint the image with.
     * @property {Boolean} masksChildren Whether to mask child elements with the contents of the image.
     * @property {Number} alphaTest Minimum alpha value of an image pixel to allow child element be visible above.
     * @property {Number} opacity Opacity multiplier of the image.
     * @property {pc.Vec4} rect The UV portion of the texture to use.
     * @property {pc.Vec4} border The pixel portion of the texture to keep unscaled. Please refer to {@link pc.StandardMaterial} to understand how borders are working.
     * @property {pc.Material} material Material to use for rendering (defaults to {@link pc.StandardMaterial}).
     * @property {pc.Asset} materialAsset An asset to get the material from.
     * @property {pc.Texture} texture Texture to use for rendering.
     * @property {pc.Asset} textureAsset An asset to get the texture from.
     */    

    var ImageElement = function ImageElement (element) {
        this._element = element;
        this._entity = element.entity;
        this._system = element.system;

        // public
        this._textureAsset = null;
        this._texture = null;
        this._materialAsset = null;
        this._material = null;
        this._masksChildren = false;
        this._alphaTest = 0.01;

        this._rect = new pc.Vec4(0,0,1,1); // x, y, w, h
        this._border = new pc.Vec4(0,0,0,0);

        this._color = new pc.Color(1,1,1,1);

        // clone material to safely modify the settings for this instance
        this._material = this._system.defaultImageMaterial.clone();

        // private
        this._positions = [];
        this._normals = [];
        this._uvs = [];
        this._indices = [];

        this._mesh = this._createMesh();
        this._node = new pc.GraphNode();
        this._model = new pc.Model();
        this._model.graph = this._node;
        this._meshInstance = new pc.MeshInstance(this._node, this._mesh, this._material);
        this._model.meshInstances.push(this._meshInstance);
        this._drawOrder = 0;

        // add model to sceen
        if (this._entity.enabled) {
            this._system.app.scene.addModel(this._model);
        }

        this._entity.addChild(this._model.graph);
        this._model._entity = this._entity;

        // initialize based on screen
        this._onScreenChange(this._element.screen);

        // listen for events
        this._element.on('resize', this._onParentResize, this);
        this._element.on('screen:set:screentype', this._onScreenTypeChange, this);
        this._element.on('set:screen', this._onScreenChange, this);
        this._element.on('set:draworder', this._onDrawOrderChange, this);
        this._element.on('screen:set:resolution', this._onResolutionChange, this);
        this._element.on("set:stencillayer", this._onStencilLayerChange, this);
    };

    pc.extend(ImageElement.prototype, {
        destroy: function () {
            if (this._model) {
                this._system.app.scene.removeModel(this._model);
                this._model.destroy();
                this._model = null;
            }

            this._element.off('resize', this._onParentResize, this);
            this._element.off('screen:set:screentype', this._onScreenTypeChange, this);
            this._element.off('set:screen', this._onScreenChange, this);
            this._element.off('set:draworder', this._onDrawOrderChange, this);
            this._element.off('screen:set:resolution', this._onResolutionChange, this);
            this._element.off('set:stencillayer', this._onStencilLayerChange, this);
        },

        _onResolutionChange: function (res) {
        },

        _onParentResize: function () {
            if (this._mesh) {
                this._updateMesh(this._mesh);
            }
        },

        _onStencilLayerChange: function(value) {
            if (this._element.screen) {
                this._updateMaterial(this._element.screen.screen.screenType == pc.SCREEN_TYPE_SCREEN);
            } else {
                this._updateMaterial(false);
            }
        },

        _onScreenTypeChange: function (value) {
            this._updateMaterial(value == pc.SCREEN_TYPE_SCREEN);
        },

        _onScreenChange: function (screen) {
            if (screen) {
                this._updateMaterial(screen.screen.screenType == pc.SCREEN_TYPE_SCREEN);
            } else {
                this._updateMaterial(false);
            }
        },

        _onDrawOrderChange: function (order) {
            this._drawOrder = order;
            if (this._meshInstance) {
                this._meshInstance.drawOrder = order;
            }
        },

        _updateMaterial: function (screenSpace) {
            this._material.alphaTest = this._alphaTest;
            this._material.stencilBack = this._material.stencilFront = this._element._getStencilParameters();

            this._updateBorders();

            this._material.update();

            if (this._meshInstance) {
                this._meshInstance.layer = screenSpace ? pc.scene.LAYER_HUD : pc.scene.LAYER_WORLD;
                this._meshInstance.material = this._material;
                this._meshInstance.screenSpace = screenSpace;
            }
        },

        _createMesh: function () {
            var w = this._element.width;
            var h = this._element.height;

            this._positions[0] = 0;
            this._positions[1] = 0;
            this._positions[2] = 0;
            this._positions[3] = w;
            this._positions[4] = 0;
            this._positions[5] = 0;
            this._positions[6] = w;
            this._positions[7] = h;
            this._positions[8] = 0;
            this._positions[9] = 0;
            this._positions[10] = h;
            this._positions[11] = 0;

            for (var i = 0; i < 12; i+=3) {
                this._normals[i] = 0;
                this._normals[i+1] = 0;
                this._normals[i+2] = -1;
            }

            this._uvs[0] = 0;
            this._uvs[1] = 0;
            this._uvs[2] = 1;
            this._uvs[3] = 0;
            this._uvs[4] = 1;
            this._uvs[5] = 1;
            this._uvs[6] = 0;
            this._uvs[7] = 1;

            this._indices[0] = 0;
            this._indices[1] = 1;
            this._indices[2] = 3;
            this._indices[3] = 2;
            this._indices[4] = 3;
            this._indices[5] = 1;

            var mesh = pc.createMesh(this._system.app.graphicsDevice, this._positions, {uvs: this._uvs, normals: this._normals, indices: this._indices});
            this._updateMesh(mesh);

            return mesh;
        },

        _updateBorders: function() {
            if (!this._material) {
                return;
            }

            var w = this._element.width;
            var h = this._element.height;

            var bordersWereEmpty = !!this._material.emissiveMapBorders;

            if (this._texture) {
                this._material.emissiveMapBorders = new pc.Mat4(
                    this._rect.x, (this._border.x / this._texture.width) + this._rect.x, (this._rect.z - this._border.z / this._texture.width) + this._rect.x, this._rect.x + this._rect.z,
                    this._rect.y, (this._border.y / this._texture.height) + this._rect.y, (this._rect.w - this._border.w / this._texture.height) + this._rect.y, this._rect.y + this._rect.w,
                    0, (this._border.x / w), (1 - this._border.z / w), 1,
                    0, (this._border.y / h), (1 - this._border.w / h), 1
                );

                this._material.opacityMapBorders = this._material.emissiveMapBorders;
            } else {
                this._material.emissiveMapBorders = null;
                this._material.opacityMapBorders = null;
            }

            this._material.update();
        },

        _updateMesh: function (mesh) {
            var w = this._element.width;
            var h = this._element.height;

            this._updateBorders();

            this._positions[0] = 0;
            this._positions[1] = 0;
            this._positions[2] = 0;
            this._positions[3] = w;
            this._positions[4] = 0;
            this._positions[5] = 0;
            this._positions[6] = w;
            this._positions[7] = h;
            this._positions[8] = 0;
            this._positions[9] = 0;
            this._positions[10] = h;
            this._positions[11] = 0;

            this._uvs[0] = 0;
            this._uvs[1] = 0;
            this._uvs[2] = 1;
            this._uvs[3] = 0;
            this._uvs[4] = 1;
            this._uvs[5] = 1;
            this._uvs[6] = 0;
            this._uvs[7] = 1;

            var vb = mesh.vertexBuffer;
            var it = new pc.VertexIterator(vb);
            var numVertices = 4;
            for (var i = 0; i < numVertices; i++) {
                it.element[pc.SEMANTIC_POSITION].set(this._positions[i*3+0], this._positions[i*3+1], this._positions[i*3+2]);
                it.element[pc.SEMANTIC_NORMAL].set(this._normals[i*3+0], this._normals[i*3+1], this._normals[i*3+2]);
                it.element[pc.SEMANTIC_TEXCOORD0].set(this._uvs[i*2+0], this._uvs[i*2+1]);

                it.next();
            }
            it.end();

            mesh.aabb.compute(this._positions);
        },

        _onMaterialLoad: function (asset) {
            this.material = asset.resource;
        },

        _onMaterialChange: function () {
        },

        _onMaterialRemove: function () {
        },

        _onTextureLoad: function (asset) {
            this.texture = asset.resource;
        },

        _onTextureChange: function (asset) {
        },

        _onTextureRemove: function (asset) {
        },

        onEnable: function () {
            if (this._model && !this._system.app.scene.containsModel(this._model)) {
                this._system.app.scene.addModel(this._model);
            }
        },

        onDisable: function () {
            if (this._model && this._system.app.scene.containsModel(this._model)) {
                this._system.app.scene.removeModel(this._model);
            }
        }
    });
    
    /**
    * @name pc.ImageElement#color
    * @type pc.Color
    * @description The color to multiply the image pixels by. Unless the material is overriden, sets emissive color
    * of the material.
    * @example
    * // make element be red-ish.
    * var element = this.entity.element;
    * element.color = new pc.Color( 1, 0, 0 );
    */
    Object.defineProperty(ImageElement.prototype, "color", {
        get: function () {
            return this._color;
        },

        set: function (value) {
            this._color.data[0] = value.data[0];
            this._color.data[1] = value.data[1];
            this._color.data[2] = value.data[2];

            if (this._meshInstance) {
                this._meshInstance.setParameter('material_emissive', this._color.data3);
            }
        }
    });

    /**
    * @name pc.ImageElement#masksChildren
    * @type Boolean
    * @description Makes the element mask all their children using texture pixels. The masking algorithm uses stencil
    * buffer to discard child fragments, and only the pixels with alpha value > alphaTest are passing on, meaning one
    * can control which portions of the image will mask the children by tweaking alphaTest value. If no texture is 
    * assigned to the image element, please make sure to set the alphaTest value to 0 as the default texture used is
    * a 4x4 texture with all pixels set to (0, 0, 0, 0) – and this will mask the children by layout box automatically.
    * @example
    * // force the element to mask all children by its layout box.
    * var element = this.entity.element;
    * element.alphaTest = 0;
    * element.masksChildren = true;
    */
    Object.defineProperty(ImageElement.prototype, "masksChildren", {
        get: function () {
            return this._masksChildren;
        },

        set: function (value) {
            this._masksChildren = value;
            this._element._setMasksChildren( value );
        }
    });

    /**
    * @name pc.ImageElement#alphaTest
    * @type Number
    * @description The minimum alpha value for image pixel to be considered passing for rendering. The most useful application
    * is masking child elements.
    * @example
    * // make regions with opacity > 0.5 draw, discard others
    * var element = this.entity.element;
    * element.alphaTest = 0.5;
    */
    Object.defineProperty(ImageElement.prototype, "alphaTest", {
        get: function () {
            return this._alphaTest;
        },

        set: function (value) {
            this._alphaTest = value;

            var screenSpace = this._element.screen ? (this._element.screen.screen.screenType == pc.SCREEN_TYPE_SCREEN) : false;
            this._updateMaterial( screenSpace );
        }
    });

    /**
    * @name pc.ImageElement#opacity
    * @type Number
    * @description The alpha multiplier for the image material.
    */
    Object.defineProperty(ImageElement.prototype, "opacity", {
        get: function () {
            return this._color.data[3];
        },

        set: function (value) {
            this._color.data[3] = value;
            this._meshInstance.setParameter("material_opacity", value);
        }
    });

    /**
    * @name pc.ImageElement#rect
    * @type pc.Vec4
    * @description The rect on the texture to draw onto the image. It is provided in a form of {@link pc.Vec4} with the coords
    * meaning minimum U, minimum V, width across U axis, width across V axis. The most obvious application is to use
    * atlased textures.
    * @example
    * // use bottom left quarter of the texture
    * var element = this.entity.element;
    * element.rect = new pc.Vec4(0, 0, 0.5, 0.5);
    */
    Object.defineProperty(ImageElement.prototype, "rect", {
        get: function () {
            return this._rect;
        },

        set: function (value) {
            if (value instanceof pc.Vec4) {
                this._rect.set(value.x, value.y, value.z, value.w);
            } else {
                this._rect.set(value[0], value[1], value[2], value[3]);
            }

            if (this._mesh) {
                this._updateMesh(this._mesh);
            }
        }
    });

    /**
    * @name pc.ImageElement#border
    * @type pc.Vec4
    * @description The borders' size in pixels. The areas falling into the border region (where {@link pc.Vec4} is used to specify
    * left, bottom, right and top border sizes) will be drawn 1:1 onto the elements' surface, allowing for the 9 patch buttons
    * and other interface elements to stretch nicely.
    * @example
    * // make 10 pixel band around the texture be fixed.
    * var element = this.entity.element;
    * element.border = new pc.Vec4(10, 10, 10, 10);
    */
    Object.defineProperty(ImageElement.prototype, "border", {
        get: function () {
            return this._border;
        },

        set: function (value) {
            if (value instanceof pc.Vec4) {
                this._border.set(value.x, value.y, value.z, value.w);
            } else {
                this._border.set(value[0], value[1], value[2], value[3]);
            }

            if (this._mesh) {
                this._updateMesh(this._mesh);
            }
        }
    });

    /**
    * @name pc.ImageElement#material
    * @type pc.Material
    * @description The material currently used for rendering.
    */
    Object.defineProperty(ImageElement.prototype, "material", {
        get: function () {
            return this._material;
        },
        set: function (value) {
            if (! value) {
                var screenSpace = this._element.screen ? (this._element.screen.screen.screenType == pc.SCREEN_TYPE_SCREEN) : false;
                value = screenSpace ? this._system.defaultScreenSpaceImageMaterial : this._system.defaultImageMaterial;
            }

            this._material = value;
            if (value) {
                this._meshInstance.material = value;

                // if we are back to the default material
                // and we have no texture then reset color properties
                if (value === this._system.defaultScreenSpaceImageMaterial || value === this._system.defaultImageMaterial) {
                    if (! this._texture) {
                        this._meshInstance.deleteParameter('material_opacity');
                        this._meshInstance.deleteParameter('material_emissive');
                    }
                }
            }
        }
    });

    /**
    * @name pc.ImageElement#materialAsset
    * @type pc.Asset
    * @description The asset to get the material from.
    */
    Object.defineProperty(ImageElement.prototype, "materialAsset", {
        get: function () {
            return this._materialAsset;
        },

        set: function (value) {
            var assets = this._system.app.assets;
            var _id = value;

            if (value instanceof pc.Asset) {
                _id = value.id;
            }

            if (this._materialAsset !== _id) {
                if (this._materialAsset) {
                    var _prev = assets.get(this._materialAsset);

                    _prev.off("load", this._onMaterialLoad, this);
                    _prev.off("change", this._onMaterialChange, this);
                    _prev.off("remove", this._onMaterialRemove, this);
                }

                this._materialAsset = _id;
                if (this._materialAsset) {
                    var asset = assets.get(this._materialAsset);

                    asset.on("load", this._onMaterialLoad, this);
                    asset.on("change", this._onMaterialChange, this);
                    asset.on("remove", this._onMaterialRemove, this);

                    if (asset.resource) {
                        this._onMaterialLoad(asset);
                    } else {
                        assets.load(asset);
                    }
                } else {
                    this.material = null;
                }
            }
        }
    });

    /**
    * @name pc.ImageElement#texture
    * @type pc.Texture
    * @description The texture currently used for rendering.
    */
    Object.defineProperty(ImageElement.prototype, "texture", {
        get: function () {
            return this._texture;
        },
        set: function (value) {
            this._texture = value;

            if (value) {
                // default texture just uses emissive and opacity maps
                this._meshInstance.setParameter("texture_emissiveMap", this._texture);
                this._meshInstance.setParameter("texture_opacityMap", this._texture);
                this._meshInstance.setParameter("material_emissive", this._color.data3);
                this._meshInstance.setParameter("material_opacity", this._color.data[3]);
            } else {
                // clear texture params
                this._meshInstance.deleteParameter("texture_emissiveMap");
                this._meshInstance.deleteParameter("texture_opacityMap");

                // if we are back to the default material then reset
                // color parameters
                if (this._material === this._system.defaultImageMaterial || this._material === this._system.defaultScreenSpaceImageMaterial) {
                    this._meshInstance.deleteParameter('material_opacity');
                    this._meshInstance.deleteParameter('material_emissive');
                }
            }

            if (this._mesh) {
                this._updateMesh(this._mesh);
            }
        }
    });

    /**
    * @name pc.ImageElement#textureAsset
    * @type pc.Asset
    * @description The asset to get the texture from.
    */
    Object.defineProperty(ImageElement.prototype, "textureAsset", {
        get: function () {
            return this._textureAsset;
        },

        set: function (value) {
            var assets = this._system.app.assets;
            var _id = value;

            if (value instanceof pc.Asset) {
                _id = value.id;
            }

            if (this._textureAsset !== _id) {
                if (this._textureAsset) {
                    var _prev = assets.get(this._textureAsset);

                    _prev.off("load", this._onTextureLoad, this);
                    _prev.off("change", this._onTextureChange, this);
                    _prev.off("remove", this._onTextureRemove, this);
                }

                this._textureAsset = _id;
                if (this._textureAsset) {
                    var asset = assets.get(this._textureAsset);

                    asset.on("load", this._onTextureLoad, this);
                    asset.on("change", this._onTextureChange, this);
                    asset.on("remove", this._onTextureRemove, this);

                    if (asset.resource) {
                        this._onTextureLoad(asset);
                    } else {
                        assets.load(asset);
                    }
                } else {
                    this.texture = null;
                }
            }
        }
    });

    return {
        ImageElement: ImageElement
    };
}());

