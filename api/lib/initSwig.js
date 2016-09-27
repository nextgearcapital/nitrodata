var swig = require('swig');

swig.setDefaults({ autoescape: false });

// swig's builtin capitalize forces the rest of the word to be lowercase.
function capitalizeFirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
swig.setFilter('capitalizeFirst', capitalizeFirst);


swig.setFilter('hideUndefined', function (value) {
    return value === undefined ? '': value;
});

