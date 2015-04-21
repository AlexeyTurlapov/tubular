(function() {
    'use strict';

    angular.module('app.routes', ['ngRoute'])
        .config([
            '$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
                $routeProvider.
                    when('/', {
                        templateUrl: 'assets/intro.html',
                    }).when('/Basic', {
                        templateUrl: 'assets/home.html',
                    }).when('/WebApi', {
                        templateUrl: 'assets/webapi.html',
                    }).when('/Generator', {
                        templateUrl: 'assets/generator.html',
                    }).otherwise({
                        redirectTo: '/'
                    });

                //$locationProvider.html5Mode(true);
            }
        ]);

    angular.module('app.controllers', ['tubular.services'])
        .controller('tubularSampleCtrl', [
            '$scope', '$location', '$anchorScroll', '$templateCache', 'tubularOData',
            function($scope, $location, $anchorScroll, $templateCache, tubularOData) {
                $scope.odata = tubularOData;
                $scope.source = [];
                $scope.tutorial = [
                    {
                        title: 'Basic Layout with JSON datasource',
                        body: 'First grid shows a basic layout, without any additional feature or special column. Just a plain grid using a JSON datasource.',
                        key: 'sample',
                        next: 'sample2'
                    },
                    {
                        title: 'Grid with Paginations using OData',
                        body: 'Adding a new feature: the pagination. This demo is using an OData datasource and you can move across the pages and change the size.',
                        key: 'sample2',
                        next: 'sample3'
                    },
                    {
                        title: 'Grid with common features using OData',
                        body: 'The grid can be extended to include features like sorting and filtering. Press Ctrl key to sort by multiple columns.',
                        key: 'sample3',
                        next: 'sample4'
                    },
                    {
                        title: 'Free-text search',
                        body: 'Adding a "searchable" attribute to your columns and you can perform free-text searches.',
                        key: 'sample4',
                        next: 'sample5'
                    },
                    {
                        title: 'Grouping',
                        body: 'You can group by one column (we hope improve this later) and also select the columns to show.',
                        key: 'sample5',
                        next: 'sample6'
                    },
                    {
                        title: 'Inline editors (read-only)',
                        body: 'You can add inline editors just defining a Save URL and assigning some controls. This demo is read-only, but you can get the idea.',
                        key: 'sample6',
                        next: null
                    }
                ];

                $scope.$on('tbGrid_OnSuccessfulUpdate', function(data) { toastr.success("Record updated"); });
                $scope.$on('tbGrid_OnRemove', function(data) { toastr.success("Record removed"); });
                $scope.$on('tbGrid_OnConnectionError', function(error) { toastr.error(error.statusText || "Connection error"); });
                $scope.$on('tbGrid_OnSuccessfulForm', function(data) { $location.path('/'); });
                $scope.$on('tbGrid_OnSavingNoChanges', function(model) {
                    toastr.warning("Nothing to save");
                    $location.path('/');
                });

                $scope.toggleCode = function(tag) {
                    if ($scope.source[tag] == null) {
                        $scope.source[tag] = $templateCache.get('assets/' + tag + '.html')[1];
                    } else {
                        $scope.source[tag] = null;
                    }
                };

                $scope.scrollTo = function(id) {
                    $location.hash(id);
                    $anchorScroll();
                };
            }
        ]).controller('tubularGeneratorCtrl', [
            '$scope', '$http', '$templateCache', function($scope, $http, $templateCache) {
            $scope.templatename = '';
            $scope.basemodel = '';

            $scope.generate = function () {
                $scope.templatename = '';

                var model = angular.fromJson($scope.basemodel);

                if (angular.isArray(model) && model.length > 0) {
                    $scope.jsonmodel = model[0];
                } else {
                    $scope.jsonmodel = model;
                }

                $scope.columns = [];

                for (var prop in $scope.jsonmodel) {
                    if ($scope.jsonmodel.hasOwnProperty(prop)) {
                        var value = $scope.jsonmodel[prop];
                        if (angular.isNumber(value) || parseFloat(value).toString() == value)
                            $scope.columns.push({ Name: prop, DataType: 'numeric' });
                        else if (angular.isDate(value) || isNaN((new Date(value)).getTime()) == false)
                            $scope.columns.push({ Name: prop, DataType: 'date' });
                        else if (value.toLowerCase() == 'true' || value.toLowerCase() == 'false')
                            $scope.columns.push({ Name: prop, DataType: 'boolean' });
                        else
                            $scope.columns.push({ Name: prop, DataType: 'string' });
                    }
                }

                var payload = {
                    Counter: 0,
                    Payload: model,
                    TotalRecordCount: 1,
                    FilteredRecordCount: 1,
                    TotalPages: 1,
                    CurrentPage: 1
                };

                var dataUrl = window.URL.createObjectURL(new Blob([JSON.stringify(payload, undefined, 2)], { type: "application/json" }));
                $scope.gridmodel = '<h1>Autogenerated Grid</h1>' +
                    '\r\n<tb-grid server-url="' + dataUrl + '" request-method="GET" class="row" require-authentication="false">' +
                    '\r\n\t<div class="col-md-12">' +
                    '\r\n\t<div class="panel panel-default panel-rounded">' +
                    '\r\n\t<tb-grid-table class="table-bordered">' +
                    '\r\n\t<tb-column-definitions>' +
                    $scope.columns.map(function (el) { return '\r\n\t\t<tb-column name="' + el.Name + '" column-type="' + el.DataType + '"><tb-column-header><span>{{label}}</span></tb-column-header></tb-column>'; }).join('') +
                    '\r\n\t</tb-column-definitions>' +
                    '\r\n\t<tb-row-set>' +
                    '\r\n\t<tb-row-template ng-repeat="cells in $component.rows" row-model="cells">' +
                    $scope.columns.map(function(el) { return '\r\n\t\t<tb-cell-template>{{cells.' + el.Name + '}}</tb-cell-template>'; }).join('') +
                    '\r\n\t</tb-row-template>' +
                    '\r\n\t</tb-row-set>' +
                    '\r\n\t</tb-grid-table>' +
                    '\r\n\t</div>' +
                    '\r\n\t</div>' +
                    '\r\n</tb-grid>';

                $templateCache.put('tubulartemplate.html', $scope.gridmodel);
                $scope.templatename = 'tubulartemplate.html';
            };

            $scope.useSample = function() {
                $http.get('data/generatorsample.json').
                    success(function(data) {
                        $scope.basemodel = angular.toJson(data);
                        $scope.generate();
                    });
            };
        }
    ]);

    angular.module('app', [
        'ngRoute',
        'ngAnimate',
        'ngCookies',
        'hljs',
        'tubular.models',
        'tubular.services',
        'tubular.directives',
        'app.routes',
        'app.controllers'
    ]);
})();