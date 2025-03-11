({
    handleNewRecord: function(component, event, helper) {
        // Handler for new record button click
        helper.createNewRecord(component);
    },
    
    handleDelete: function(component, event, helper) {
        // Handler for delete button click
        helper.deleteRecord(component, event);
    }
}) 