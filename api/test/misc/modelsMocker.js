'use strict';

module.exports = function(data) {
    return {
        getModelDef: function(modelName) {
            return data[modelName];
        }
    };
};
