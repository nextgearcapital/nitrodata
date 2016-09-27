<html>
<body>
    <div>
<h1>{{ modelName }} - {{ modelDef.prettyName }}()</h1>
<h4><a href="../angularmodels/{{ modelName }}">Enhanced View of {{ modelDef.prettyName }}()</a></h4>
<h2>example usage</h2>
<br><br>

{% if modelDef.namespace %}
var {{ modelDef.prettyName }} = nitro.nsModels.{{ modelDef.namespace }}.{{ modelDef.prettyName }}()
{% else %}
var {{ modelDef.prettyName }} = nitro.models.{{ modelDef.prettyName }}()
{% endif %}

{% for fieldDef in modelDef.fields %}
    {%- set fieldName = loop.key -%}
<br>
{%- if fieldDef.enable === false %}//  {% endif -%}
&nbsp;&nbsp;&nbsp;&nbsp;.with{{ fieldDef.prettyName  | capitalizeFirst}}({{ instance[fieldName] | json | hideUndefined }})
{%- if loop.last %};{% endif %}
{% if fieldDef.targetTable %}
<br>
// &nbsp;&nbsp;&nbsp;&nbsp;.with{{ fieldDef.prettyTargetTable | capitalizeFirst}}({{ fieldDef.prettyTargetTable }}Model);
{% endif %}
{%- endfor -%}

<h3>alternative usage</h3>
<pre>
{% if modelDef.namespace %}
var {{ modelDef.prettyName }} = nitro.nsModels.{{ modelDef.namespace }}.{{ modelDef.prettyName }}({{ instanceJSON }})
{% else %}
var {{ modelDef.prettyName }} = nitro.models.{{ modelDef.prettyName }}({{ instanceJSON }});
{% endif %}
</pre>

<h2>definition</h2>
        <ul>
{% for fieldDef in modelDef.fields %}
    {%- set fieldName = loop.key %}
        <li><h3 style="display: inline">{{ fieldName }}</h3>
            <ul>
            <li>.with{{ fieldDef.prettyName | capitalizeFirst }}( &lt;{{ fieldDef.type }}{%- if fieldDef.maxLength !== undefined -%}({{ fieldDef.maxLength }}) {% endif %}&gt; )</li>
            {% if fieldDef.isNullable %}<li>nullable</li>{% endif %}
            {% if fieldDef.isPrimaryKey %}<li>primary key</li>{% endif %}
            {% if fieldDef.targetTable %}
            <li>=&gt; {{ fieldDef.targetTable }}.{{ fieldDef.targetColumn }}</li>
            <li>.with{{ fieldDef.prettyTargetTable | capitalizeFirst }}( {{ fieldDef.prettyTargetTable }}Model )</li>
            {% endif %}
            {% if fieldDef.enable === false %}<li>not enabled</li>{% endif %}
            </ul>
        </li>
{% endfor %}
        </ul>
<br><br>
<h3>json</h3>
<pre>
{{ modelDef | json(4) }}
</pre>
    </div>
</body>
</html>
