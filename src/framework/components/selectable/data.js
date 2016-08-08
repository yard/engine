pc.extend(pc, function () {
    var SelectableComponentData = function () {
        this.enabled = true;
    };
    SelectableComponentData = pc.inherits(SelectableComponentData, pc.ComponentData);

    return {
        SelectableComponentData: SelectableComponentData
    };
}());
