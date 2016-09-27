{% for modelDef in models %}
{% set modelName = loop.key -%}
{%- set prettyModelName = modelDef.prettyName -%}

// ------------------- begin {{ modelName }} ------------------

function {{ prettyModelName }} (attributes) {
  this.attributes = attributes || {};
  this.modelName = '{{ modelName }}';
  this.createMode = 'useServerDefault';
  return this;
}

function _{{ prettyModelName }} (attributes) {
    return new {{ prettyModelName }}(attributes);
}

{{ prettyModelName }}.prototype.createNew = function () {
  this.createMode = 'createNew';
  return this;
};

{{ prettyModelName }}.prototype.useExisting = function () {
  this.createMode = 'useExisting';
  return this;
};

{{ prettyModelName }}.prototype.createIfDoesNotExist = function () {
  this.createMode = 'createIfDoesNotExist';
  return this;
};

{% for fieldDef in modelDef.fields -%}
{%- set fieldName = loop.key -%}

{{ prettyModelName }}.prototype.with{{ fieldDef.prettyName | capitalizeFirst }} = function (value) {
  this.attributes['{{ fieldName }}'] = value;
  return this;
};

{% if fieldDef.targetTable %}
{{ prettyModelName }}.prototype.with{{ fieldDef.prettyTargetTable | capitalizeFirst }} = function (model) {
    this.attributes.{{ fieldName }} = model.getData();
    return this;
}
{% endif %}
{%- endfor -%}

{{ prettyModelName }}.prototype.getData = function() {
    return {
        "model": this.modelName,
        "attributes": this.attributes,
        "createMode": this.createMode,
        "count": 1
    }
}

{{ prettyModelName }}.prototype.getRequirements = function() {
    return this.attributes
}


// ------------------- end {{ modelName }} ------------------
{% endfor %}

module.exports = {
    'default': {
{% for modelDef in models %}
    {{ modelDef.prettyName }}: _{{ modelDef.prettyName }}    {%- if !loop.last %},{% endif %}
{% endfor -%}
    }
}
