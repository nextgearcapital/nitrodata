var nsModels = {};

{% for namespace in meta.namespaces %}
nsModels.{{ namespace }} = {};

// +++++++++++++++++++ begin {{ namespace }} ++++++++++++++++++

{% for modelDef in models %}
{% set modelName = loop.key -%}
{% if modelName.indexOf(namespace) === 0 %}
{%- set prettyModelNameNS = namespace + '___' + modelDef.prettyName -%}
{%- set prettyModelName = modelDef.prettyName -%}

// ------------------- begin {{ modelName }} ------------------

function {{ prettyModelNameNS }} (attributes) {
  this.attributes = attributes || {};
  this.modelName = '{{ modelName }}';
  this.createMode = 'useServerDefault';
  return this;
}

function _{{ prettyModelNameNS }} (attributes) {
    return new {{ prettyModelNameNS }}(attributes);
}

{{ prettyModelNameNS }}.prototype.createNew = function () {
  this.createMode = 'createNew';
  return this;
};

{{ prettyModelNameNS }}.prototype.useExisting = function () {
  this.createMode = 'useExisting';
  return this;
};

{{ prettyModelNameNS }}.prototype.createIfDoesNotExist = function () {
  this.createMode = 'createIfDoesNotExist';
  return this;
};


{% for fieldDef in modelDef.fields -%}
{%- set fieldName = loop.key -%}

{{ prettyModelNameNS }}.prototype.with{{ fieldDef.prettyName | capitalizeFirst }} = function (value) {
  this.attributes['{{ fieldName }}'] = value;
  return this;
};

{% if fieldDef.targetTable %}
{{ prettyModelNameNS }}.prototype.with{{ fieldDef.prettyTargetTable | capitalizeFirst }} = function (model) {
    this.attributes.{{ fieldName }} = model.getData();
    return this;
}
{% endif %}
{%- endfor -%}

{{ prettyModelNameNS }}.prototype.getData = function() {
    return {
        "model": this.modelName,
        "attributes": this.attributes,
        "createMode": this.createMode,
        "count": 1
    }
}

{{ prettyModelNameNS }}.prototype.getRequirements = function() {
    return this.attributes
}

nsModels.{{ namespace }}.{{ prettyModelName }} = _{{ prettyModelNameNS }};
// ------------------- end {{ modelName }} ------------------
{% endif %}
{% endfor %}

// +++++++++++++++++++ end {{ namespace }} ++++++++++++++++++
{% endfor %}

module.exports = {
    default: nsModels.{{ meta.defaultNamespace }},
    nsModels: nsModels
};
