({
    createNewRecord: function(component) {
        var records = component.get("v.records");
        records.push({
            id: this.generateId(),
            name: "New Record " + (records.length + 1)
        });
        component.set("v.records", records);
    },
    
    deleteRecord: function(component, event) {
        var records = component.get("v.records");
        var index = event.getSource().get("v.name");
        records.splice(index, 1);
        component.set("v.records", records);
    },
    
    generateId: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}) 