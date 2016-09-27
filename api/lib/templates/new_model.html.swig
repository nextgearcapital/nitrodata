<!doctype html>
<html lang="en" ng-app="modelPage">
<head>
  <!-- Angular Material style sheet -->
  <link rel="stylesheet" href="http://ajax.googleapis.com/ajax/libs/angular_material/1.0.0-rc5/angular-material.min.css">
</head>
<body ng-cloak>
{% raw %}

    <div ng-controller="modelController">
    <h1>{{ modelDef.prettyName }}</h1>
      <md-content>
        <md-tabs md-dynamic-height md-border-bottom>
          <md-tab label="example">
            <md-content class="md-padding">
              <h1 class="md-display-3">Example Usage</h1>
<p>
{% endraw %}
var {{ modelDef.prettyName }} = nitro.models.{{ modelDef.prettyName }}()
{% for fieldDef in modelDef.fields %}
    {%- set fieldName = loop.key -%}
<br>
{%- if fieldDef.enable === false %}//  {% endif -%}
&nbsp;&nbsp;&nbsp;&nbsp;.with{{ fieldDef.prettyName  | capitalizeFirst}}({{ instance[fieldName] | json | hideUndefined }})
;
{% if fieldDef.targetTable %}
<br>
// &nbsp;&nbsp;&nbsp;&nbsp;.with{{ fieldDef.prettyTargetTable | capitalizeFirst}}({{ fieldDef.prettyTargetTable }}Model);
{% endif %}
{%- endfor -%}
{% raw %}
</p>
            </md-content>
        </md-tab>
        <md-tab label='example 2'>
            <md-content>
{% endraw %}
<pre>
var {{ modelDef.prettyName }} = nitro.models.{{ modelDef.prettyName }}({{ instance | json(4) }});
</pre>
{% raw %}
            </md-content>
        </md-tab>
        <md-tab label='new definition'>

            <div ng-repeat="(fieldName, fieldDef) in modelDef.fields">
                <md-toolbar>
                  <div class="md-toolbar-tools">
                    <h3>
                      <span>{{ fieldName }}</span>
                    </h3>
                    <span flex="" class="flex"></span>
                    <button class="md-raised md-button md-ink-ripple" type="button" aria-label="Learn More" ng-click="showModelDialog($event)"><span class="ng-scope">
                      Learn More
                    </span></button>
                  </div>

                </md-toolbar>
                <div>
                </div>
            </div>


        </md-tab>

        <md-tab label='old definition'>
            <md-content>
        <ul>
{% endraw %}
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
{% raw %}
        </ul>

            </md-content>
        </md-tab>
        <md-tab label='json definition'>
            <md-content>
{% endraw %}
<pre>
{{ modelDef | json(4) }}
</pre>
{% raw %}
            </md-content>
        </md-tab>



    </div>

{% endraw %}
  <!-- Angular Material requires Angular.js Libraries -->
  <script src="http://ajax.googleapis.com/ajax/libs/angularjs/1.4.8/angular.min.js"></script>
  <script src="http://ajax.googleapis.com/ajax/libs/angularjs/1.4.8/angular-animate.min.js"></script>
  <script src="http://ajax.googleapis.com/ajax/libs/angularjs/1.4.8/angular-aria.min.js"></script>
  <script src="http://ajax.googleapis.com/ajax/libs/angularjs/1.4.8/angular-messages.min.js"></script>

  <!-- Angular Material Library -->
  <script src="http://ajax.googleapis.com/ajax/libs/angular_material/1.0.0-rc5/angular-material.min.js"></script>
  
<script type="text/javascript">    
    var myApp = angular.module('modelPage', ['ngMaterial']);
    myApp.controller('modelController', ['$scope', '$mdDialog', '$mdMedia', function($scope, $mdDialog, $mdMedia) {
      $scope.modelDef = {{ modelDef | json(4) }};

      $scope.showModelDialog = function(ev) {
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;

        $mdDialog.show({
          controller: DialogController,
          templateUrl: 'dialog1.tmpl.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose:true,
          fullscreen: false
        })
        .then(function(answer) {
          $scope.status = 'You said the information was "' + answer + '".';
        }, function() {
          $scope.status = 'You cancelled the dialog.';
        });



        $scope.$watch(function() {
          return $mdMedia('xs') || $mdMedia('sm');
        }, function(wantsFullScreen) {
          $scope.customFullscreen = (wantsFullScreen === true);
        });

      };


    }]); 

    myApp.filter('capitalize', function() {
      return function(input, scope) {
        if (input!=null)
        input = input.toLowerCase();
        return input.substring(0,1).toUpperCase()+input.substring(1);
      }
    });

function DialogController($scope, $mdDialog) {
  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
  $scope.answer = function(answer) {
    $mdDialog.hide(answer);
  };
}
</script>
  
</body>
</html>
