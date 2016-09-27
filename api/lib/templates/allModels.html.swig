<html>
<body>
<div>
    <ul>
{% for modelDef in models %}
    {%- set modelName = loop.key %}
    <li><a href="{{ 'models/' + modelName }}">{{ modelName }}</a></li>
{% endfor %}
    </ul>
</div>
</body>
</html>
