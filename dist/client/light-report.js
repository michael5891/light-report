/*! light-report - v1.3.633 - 2019-09-15 */
"use strict";

angular.module("lightReport", []).constant("lightReportEvents", {
    APPLY_QUERY: "APPLY_QUERY",
    ON_DATA: "ON_DATA",
    FILTER_CHANGED: "FILTER_CHANGED",
    FILTER_REMOVED: "FILTER_REMOVED"
}).factory("LightReportFactory", [ "RestReportService", "LocalReportService", function(RestReportService, LocalReportService) {
    return {
        create: function(options) {
            var retVal = null;
            if (!options) {
                retVal = new LocalReportService();
            } else if (typeof options === "string" && options.length > 0) {
                retVal = new RestReportService(options);
            } else if (typeof options === "object") {
                if (options.hasOwnProperty("url")) {
                    retVal = new RestReportService(options);
                } else {
                    retVal = new LocalReportService();
                }
                for (var prop in options) {
                    if (retVal.hasOwnProperty(prop)) {
                        retVal[prop] = options[prop];
                    }
                }
            } else {
                console.warn("LightReportFactory: unsupported connection type:", options);
            }
            return retVal;
        }
    };
} ]);

"use strict";

var reportLog = function custom_console_log(message) {
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();
    var milliseconds = now.getMilliseconds();
    if (hours < 10) {
        hours = "0" + "" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + "" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + "" + seconds;
    }
    if (milliseconds < 10) {
        milliseconds = "0" + "" + milliseconds;
    }
    if (milliseconds < 100) {
        milliseconds = "0" + "" + milliseconds;
    }
    var timeStr = hours + ":" + minutes + ":" + seconds + "." + milliseconds;
    console.log("[" + timeStr + "]" + message);
};

angular.module("lightReport").directive("lightReport", [ "lightReportEvents", "BaseReportService", function(lightReportEvents, BaseReportService) {
    return {
        restrict: "A",
        scope: {
            reportService: "=lightReport",
            gridSettings: "=?",
            reportAutoQuery: "@?",
            reportSubmitLabel: "@?",
            sortDirections: "=?",
            onLoaded: "=?",
            onSelect: "=?",
            onDoubleSelect: "=?",
            onClick: "=?",
            onSort: "=?",
            onColumnResize: "=?"
        },
        transclude: true,
        templateUrl: "../lib/client/directives/lightReport/lightReport.tpl.html",
        controller: [ "$scope", function($scope) {
            $scope.$id = $scope.$id + "_lightReport";
            $scope.reportGridApi = null;
            if (!($scope.reportService instanceof BaseReportService)) {
                throw "lightReport.drv: reportService should be extended instance of BaseReportService.";
            }
            if (!$scope.gridSettings || typeof $scope.gridSettings !== "object") {
                $scope.gridSettings = {};
            }
            if (!$scope.sortDirections) {
                $scope.sortDirections = {
                    asc: true,
                    desc: true,
                    none: true
                };
            }
            $scope.applyQueryHandler = function applyQueryHandler(event, message) {
                $scope.reportService.applyQuery(message.isPaging);
            };
            $scope.onGridLoadedHandler = function onGridLoadedHandler(event) {
                $scope.reportGridApi = event;
                if ($scope.onLoaded) {
                    $scope.onLoaded(event);
                }
            };
            $scope.onGridSortHandler = function onGridSortHandler(field) {
                var column = $scope.reportService.reportModel.getColumnByField("field", field);
                if (column.sort !== false) {
                    var direction = null;
                    var sortBy = $scope.reportService.queryModel.params.sortBy;
                    if (sortBy.length > 0) {
                        $scope.reportGridApi.removeColumnClass(sortBy[0].field, "sorted_" + sortBy[0].direction, true);
                        if (sortBy[0].field === field) {
                            direction = sortBy[0].direction;
                        }
                    }
                    switch (direction) {
                      case "asc":
                        if ($scope.sortDirections.desc) {
                            direction = "desc";
                        } else if ($scope.sortDirections.none) {
                            direction = null;
                        }
                        break;

                      case "desc":
                        if ($scope.sortDirections.none) {
                            direction = null;
                        } else if ($scope.sortDirections.asc) {
                            direction = "asc";
                        }
                        break;

                      case null:
                        if ($scope.sortDirections.asc) {
                            direction = "asc";
                        } else if ($scope.sortDirections.desc) {
                            direction = "desc";
                        }
                        break;
                    }
                    var isOverriden = false;
                    if ($scope.onSort) {
                        isOverriden = $scope.onSort(field, direction);
                    }
                    if (isOverriden !== true) {
                        if ($scope.reportService.sort(field, direction)) {
                            if (direction) {
                                $scope.reportGridApi.addColumnClass(field, "sorted_" + direction, true);
                            }
                            $scope.reportGridApi.refresh();
                        }
                    }
                }
            };
            $scope.onDataHandler = function(result, isAppended) {
                if (isAppended) {
                    $scope.reportGridApi.refresh();
                } else {
                    $scope.reportGridApi.scrollTop();
                    if (!$scope.$root.$$phase) {
                        $scope.$digest();
                    }
                }
                var sortBy = $scope.reportService.queryModel.params.sortBy;
                if (sortBy.length > 0) {
                    $scope.reportGridApi.addColumnClass(sortBy[0].field, "sorted_" + sortBy[0].direction, true);
                }
            };
            $scope.onScrollHitBottom = function onScrollHitBottom(event) {
                if (!$scope.reportService.isInProgress && $scope.reportService.queryModel.hasNext) {
                    reportLog("lightReport.drv: onScrollHitBottom");
                    $scope.reportService.queryModel.page++;
                    $scope.reportService.applyQuery(true);
                }
            };
            $scope.reportService.onData($scope.onDataHandler);
            $scope.applyQueryUnbind = $scope.$on(lightReportEvents.APPLY_QUERY, $scope.applyQueryHandler);
        } ],
        link: function($scope, element) {
            $scope.$watch(function() {
                return $scope.reportService.columns;
            }, function() {
                $scope.gridSettings.columns = $scope.reportService.reportModel.displayedColumns;
            });
            element.on("$destroy", function() {
                $scope.reportService.offData($scope.onDataHandler);
                $scope.applyQueryUnbind();
            });
        }
    };
} ]);

"use strict";

angular.module("lightReport").directive("reportFilter", [ "lightReportEvents", "ReportFilterService", function(lightReportEvents, ReportFilterService) {
    return {
        restrict: "A",
        require: "^ngModel",
        scope: {
            reportFilterApi: "=reportFilter",
            filterKey: "=?",
            filterField: "@",
            filterValue: "=",
            filterType: "@",
            filterFrom: "=",
            filterTo: "=",
            filterOperation: "@"
        },
        controller: [ "$scope", function($scope) {
            $scope.$id = $scope.$id + "reportFilter";
        } ],
        link: function($scope, element, attrs, ngModelCtrl) {
            function handleModelChanged(newValue) {
                var message = {
                    key: $scope.filterKey,
                    field: $scope.filterField,
                    type: $scope.filterType
                };
                switch ($scope.filterType) {
                  case ReportFilterService.MAP:
                  case ReportFilterService.FIELD:
                    message.data = newValue;
                    message.operation = $scope.filterOperation;
                    break;

                  case ReportFilterService.RANGE:
                  case ReportFilterService.DATE_RANGE:
                    var side = "from";
                    if (attrs.filterFrom === undefined && attrs.filterTo !== undefined) {
                        side = "to";
                    }
                    message[side] = {
                        data: newValue,
                        operation: $scope.filterOperation
                    };
                    break;
                }
                $scope.$emit(lightReportEvents.FILTER_CHANGED, message);
            }
            $scope.getModelValue = function getModelValue() {
                var retVal = $scope.filterValue;
                if (!retVal && ngModelCtrl) {
                    retVal = ngModelCtrl.$modelValue;
                }
                return retVal;
            };
            $scope.$watchGroup([ "getModelValue()", "filterField", "filterType" ], function(newValues) {
                var modelValue = newValues[0];
                if (!$scope.filterKey || $scope.filterKey.length === 0 && $scope.filterField && $scope.filterField.length > 0) {
                    $scope.filterKey = $scope.filterField + "Filter";
                }
                handleModelChanged(modelValue);
            });
            if ($scope.reportFilterApi) {
                $scope.reportFilterApi.api = {
                    remove: function() {
                        var message = {
                            key: $scope.filterKey,
                            field: $scope.filterField,
                            type: $scope.filterType
                        };
                        $scope.$emit(lightReportEvents.FILTER_REMOVED, message);
                    }
                };
            }
        }
    };
} ]);

"use strict";

angular.module("lightReport").directive("reportGrid", [ function() {
    return {
        restrict: "A",
        require: "^ngModel",
        scope: {
            gridSettings: "=?",
            onLoaded: "=?",
            onSelect: "=?",
            onDoubleSelect: "=?",
            onClick: "=?",
            onSort: "=?",
            onColumnResize: "=?",
            onScrollHitBottom: "=?"
        },
        controller: [ "$scope", function($scope) {
            $scope.$id = $scope.$id + "reportGrid";
            var defaultGridSettings = {
                columns: null,
                element: null,
                rowHeight: 24,
                headerHeight: 28,
                selection: {
                    multi: true,
                    type: "row"
                },
                minColumnWidth: 40,
                resizableColumns: true,
                enableInfiniteScroll: false,
                infiniteScrollTolerance: 50,
                trackBy: ""
            };
            if (!$scope.gridSettings) {
                $scope.gridSettings = {};
            }
            for (var key in defaultGridSettings) {
                if (defaultGridSettings.hasOwnProperty(key) && !$scope.gridSettings.hasOwnProperty(key)) {
                    if (!$scope.gridSettings[key]) {
                        $scope.gridSettings[key] = defaultGridSettings[key];
                    }
                }
            }
            $scope.$watch("gridSettings.columns", function(newValue) {
                if (Array.isArray(newValue) && newValue.length > 0) {
                    for (var idx = 0; idx < newValue.length; idx++) {
                        newValue[idx].fixed = newValue[idx].isPinned;
                    }
                    $scope.setColumns(newValue);
                }
            });
            $scope.setColumns = function setColumns(newColumns) {
                $scope.gridSettings.columns = newColumns;
                if ($scope.grid) {
                    $scope.grid.setColumns(newColumns);
                }
            };
            $scope.resizeGrid = function() {
                var resizeTO;
                return function(event) {
                    clearTimeout(resizeTO);
                    resizeTO = setTimeout(function() {
                        $scope.grid.resize();
                    }, 90);
                };
            }();
            $scope.onGridSortHandler = function onGridSortHandler(event) {
                $scope.onSort(event.detail.column);
            };
            $scope.onGridSelectHandler = function onGridSelectHandler(event) {
                var eventDataObj = {
                    dataIndex: event.detail.dataIndex,
                    rowData: event.detail.rowData,
                    column: event.detail.column,
                    isSelect: event.detail.isSelect
                };
                $scope.onSelect(eventDataObj);
            };
            $scope.onGridDoubleSelectHandler = function onGridDoubleSelectHandler(event) {
                $scope.onDoubleSelect(event.detail, event);
            };
            $scope.onGridClickHandler = function onGridClickHandler(event) {
                $scope.onClick(event.detail, event);
            };
            $scope.onGridResizeColumnHandler = function onGridResizeColumnHandler(event) {
                var eventDataObj = {
                    columnField: event.detail.columnField,
                    columnIndex: event.detail.columnIndex,
                    width: event.detail.width
                };
                $scope.onColumnResize(eventDataObj);
            };
            $scope.onGridLoadedHandler = function onGridLoadedHandler() {
                var reportGridApi = {
                    grid: $scope.grid,
                    setColumns: function setColumns(value) {
                        $scope.setColumns(value);
                    },
                    setData: function setData(value) {
                        $scope.grid.setData(value);
                    },
                    scrollTop: function scrollTop() {
                        $scope.grid.scrollY = 0;
                    },
                    addColumnClass: function addColumnClass(field, className, alsoForDataCells) {
                        $scope.grid.addColumnClass(field, className, alsoForDataCells);
                    },
                    removeColumnClass: function removeColumnClass(field, className, alsoForDataCells) {
                        $scope.grid.removeColumnClass(field, className, alsoForDataCells);
                    },
                    refresh: function refresh() {
                        $scope.grid.refresh();
                    }
                };
                $scope.onLoaded(reportGridApi);
            };
            $scope.onGridScrollHitBottomHandler = function onGridScrollHitBottomHandler(event) {
                if ($scope.onScrollHitBottom) {
                    $scope.onScrollHitBottom(event);
                }
            };
        } ],
        link: function($scope, element, attrs, ngModelCtrl) {
            ngModelCtrl.$render = function() {
                $scope.grid.setData(ngModelCtrl.$modelValue);
            };
            $scope.gridSettings.element = element[0];
            $scope.grid = new StorkGrid($scope.gridSettings);
            $scope.eventListeners = [ {
                key: "onSort",
                eventName: "column-click",
                handler: $scope.onGridSortHandler
            }, {
                key: "onClick",
                eventName: "data-click",
                handler: $scope.onGridClickHandler
            }, {
                key: "onSelect",
                eventName: "select",
                handler: $scope.onGridSelectHandler
            }, {
                key: "onDoubleSelect",
                eventName: "dblselect",
                handler: $scope.onGridDoubleSelectHandler
            }, {
                key: "onDoubleSelect",
                eventName: "enter-select",
                handler: $scope.onGridDoubleSelectHandler
            }, {
                key: "onColumnResize",
                eventName: "resize-column",
                handler: $scope.onGridResizeColumnHandler
            }, {
                key: "onColumnResize",
                eventName: "resize-column",
                handler: $scope.onGridResizeColumnHandler
            } ];
            for (var idx = 0; idx < $scope.eventListeners.length; idx++) {
                var listener = $scope.eventListeners[idx];
                if ($scope[listener.key]) {
                    $scope.grid.addEventListener(listener.eventName, listener.handler, false);
                }
            }
            if ($scope.onScrollHitBottom && $scope.gridSettings.enableInfiniteScroll) {
                $scope.grid.addScrollEvent("hitBottom", $scope.gridSettings.infiniteScrollTolerance);
                $scope.grid.addEventListener("hitBottom", $scope.onGridScrollHitBottomHandler, false);
            }
            window.addEventListener("resize", $scope.resizeGrid, false);
            if ($scope.onLoaded) {
                $scope.onGridLoadedHandler();
            }
            element.on("$destroy", function() {
                for (var idx = 0; idx < $scope.eventListeners.length; idx++) {
                    var listener = $scope.eventListeners[idx];
                    $scope.grid.removeEventListener(listener.eventName, listener.handler, false);
                }
                if ($scope.onScrollHitBottom && $scope.gridSettings.enableInfiniteScroll) {
                    $scope.grid.removeEventListener("hitBottom", $scope.onGridScrollHitBottomHandler, false);
                }
                window.removeEventListener("resize", $scope.resizeGrid, false);
                $scope.grid.destroy();
            });
        }
    };
} ]);

"use strict";

angular.module("lightReport").directive("reportQuery", [ "lightReportEvents", "ReportFilterService", function(lightReportEvents, ReportFilterService) {
    return {
        restrict: "A",
        scope: {
            queryModel: "=reportQuery",
            reportAutoQuery: "@",
            reportSubmitLabel: "@",
            reportOnApplyQuery: "=?"
        },
        templateUrl: "../lib/client/directives/reportQuery/reportQuery.tpl.html",
        transclude: true,
        controller: [ "$scope", function($scope) {
            $scope.$id = $scope.$id + "_reportQuery";
            $scope.filters = {};
            $scope.autoApplyQuery = $scope.reportAutoQuery;
            if ($scope.autoApplyQuery === undefined) {
                $scope.autoApplyQuery = "true";
            }
            $scope.autoApplyQuery = $scope.autoApplyQuery !== "false";
            $scope.submitLabel = $scope.reportSubmitLabel;
            if (!$scope.autoApplyQuery && !$scope.submitLabel) {
                $scope.submitLabel = "Submit";
            }
            $scope.applyQuery = function applyQuery(isPaging) {
                $scope.$emit(lightReportEvents.APPLY_QUERY, {
                    isPaging: isPaging
                });
                if ($scope.reportOnApplyQuery) {
                    $scope.reportOnApplyQuery({
                        isPaging: isPaging
                    });
                }
            };
            $scope.filterChangedHandler = function filterChangedHandler(event, message) {
                event.stopPropagation();
                if (message.type === ReportFilterService.MAP) {
                    var hasData = false;
                    for (var prop in message.data) {
                        if (message.data.hasOwnProperty(prop)) {
                            hasData = true;
                            break;
                        }
                    }
                    if (!hasData) {
                        $scope.filterRemovedHandler(event, message);
                        return {};
                    }
                }
                var filter = $scope.queryModel.addFilter(message.key, message);
                if ($scope.autoApplyQuery && !filter.isPartial) {
                    $scope.applyQuery(false);
                }
            };
            $scope.filterRemovedHandler = function filterRemovedHandler(event, message) {
                event.stopPropagation();
                $scope.queryModel.removeFilter(message.key);
                if ($scope.autoApplyQuery) {
                    $scope.applyQuery(false);
                }
            };
            $scope.submitEventHandler = function() {
                $scope.applyQuery(false);
            };
            $scope.offFilterChanged = $scope.$on(lightReportEvents.FILTER_CHANGED, $scope.filterChangedHandler);
            $scope.offFilterRemoved = $scope.$on(lightReportEvents.FILTER_REMOVED, $scope.filterRemovedHandler);
        } ],
        link: function($scope, element, attrs) {
            var transcludeContent = element[0].querySelector(".lightReportQueryContent").children;
            $scope.hasTranscludeContent = transcludeContent.length > 0;
            if (!$scope.autoApplyQuery && $scope.hasTranscludeContent) {
                $scope.formElement = element[0].querySelector(".lightReportQueryForm");
                $scope.formElement.addEventListener("submit", $scope.submitEventHandler);
            } else {
                element[0].querySelector(".lightReportQueryFormSubmit").remove();
            }
            element.on("$destroy", function() {
                $scope.offFilterChanged();
                $scope.offFilterRemoved();
                if ($scope.formElement) {
                    $scope.formElement.removeEventListener("submit", $scope.submitEventHandler);
                }
            });
        }
    };
} ]);

"use strict";

angular.module("lightReport").directive("tagsFilter", [ "lightReportEvents", "ReportFilterService", function(lightReportEvents, ReportFilterService) {
    return {
        restrict: "A",
        require: "ngModel",
        scope: {
            getSuggestions: "=",
            placeholder: "@",
            settings: "="
        },
        controller: [ "$scope", function($scope) {
            $scope.$id = $scope.$id + "tagsFilter";
            $scope.placeholder = $scope.placeholder || "";
        } ],
        link: function($scope, element, attrs, ngModelCtrl) {
            var isUpdateInProgress = false;
            var defaultSettings = {
                element: element[0],
                suggestionsHandler: $scope.getSuggestions,
                storkTagsInput: null,
                placeholder: $scope.placeholder,
                rechooseRemove: true,
                inputMinWidth: 110
            };
            if ($scope.settings) {
                for (var prop in $scope.settings) {
                    defaultSettings[prop] = $scope.settings[prop];
                }
            }
            var tagsObj = new StorkTagsInput(defaultSettings);
            var commitTagsQuery = function commitTagsQuery(tags) {
                var message = {
                    key: "tagsKey",
                    type: ReportFilterService.MAP,
                    data: {}
                };
                for (var idx = 0; idx < tags.length; idx++) {
                    var groupField = tags[idx].groupField;
                    if (!message.data[groupField]) {
                        message.data[groupField] = [];
                    }
                    message.data[groupField].push(tags[idx].value);
                }
                $scope.$emit(lightReportEvents.FILTER_CHANGED, message);
            };
            var tagsUpdatedHandler = function tagsUpdatedHandler(event) {
                if (!isUpdateInProgress) {
                    isUpdateInProgress = true;
                    ngModelCtrl.$setViewValue(tagsObj.chosenTags);
                    commitTagsQuery(tagsObj.chosenTags);
                    isUpdateInProgress = false;
                }
            };
            tagsObj.addEventListener("tag-added", tagsUpdatedHandler, false);
            tagsObj.addEventListener("tag-removed", tagsUpdatedHandler, false);
            tagsObj.addEventListener("all-tags-removed", tagsUpdatedHandler, false);
            $scope.$watchCollection(function() {
                return ngModelCtrl.$modelValue;
            }, function handleModelChanged(newValue) {
                if (!isUpdateInProgress) {
                    isUpdateInProgress = true;
                    tagsObj.removeAllTags();
                    for (var idx = 0; idx < newValue.length; idx++) {
                        tagsObj.addTag(newValue[idx]);
                    }
                    commitTagsQuery(tagsObj.chosenTags);
                    isUpdateInProgress = false;
                }
            });
            element.on("$destroy", function() {
                tagsObj.removeEventListener("tag-added", tagsUpdatedHandler, false);
                tagsObj.removeEventListener("tag-removed", tagsUpdatedHandler, false);
                tagsObj.removeEventListener("all-tags-removed", tagsUpdatedHandler, false);
                tagsObj.destroy();
            });
        }
    };
} ]);

"use strict";

angular.module("lightReport").factory("ReportFilterModel", [ "ReportFilterService", "ReportFilterEvaluatorService", function(ReportFilterService, ReportFilterEvaluatorService) {
    var validOperations = [ ">", ">=", "<", "<=", "!=", "<>" ];
    function ReportFilterModel() {
        this.filters = {};
    }
    ReportFilterModel.prototype = {
        compileFilter: function compileFilter() {
            return ReportFilterService.createFilterFromObject(this.filters);
        },
        addFilter: function addFilter(key, originalOptions) {
            var isPartial = false;
            var filter = this.filters[key];
            var options = angular.copy(originalOptions);
            if (typeof options.from !== "undefined" && (typeof options.from !== "object" || options.from instanceof Date)) {
                options.from = {
                    data: options.from
                };
            }
            if (typeof options.to !== "undefined" && (typeof options.to !== "object" || options.to instanceof Date)) {
                options.to = {
                    data: options.to
                };
            }
            if (!filter) {
                filter = options;
                this.filters[key] = filter;
            }
            filter.field = options.field;
            filter.type = options.type;
            if (filter.type === ReportFilterService.RANGE || filter.type === ReportFilterService.DATE_RANGE) {
                if (options.from) {
                    filter.from = options.from;
                    if (validOperations.indexOf(options.from.operation) === -1) {
                        filter.from.operation = ">=";
                    }
                }
                if (options.to) {
                    filter.to = options.to;
                    if (validOperations.indexOf(options.to.operation) === -1) {
                        filter.to.operation = "<=";
                    }
                }
                isPartial = !(filter.from && filter.to);
            } else {
                filter.data = options.data;
                filter.operation = validOperations.indexOf(options.operation) === -1 ? "=" : options.operation;
            }
            return {
                filter: filter,
                isPartial: isPartial
            };
        },
        removeFilter: function(key) {
            delete this.filters[key];
        },
        filterRecords: function filterRecords(records) {
            if (!Array.isArray(records)) {
                throw new TypeError("filterRecords: records must be an Array");
            }
            var filtered = [];
            var recordsCopy = records.slice(0);
            if (Object.keys(this.filters).length) {
                var filter = this.compileFilter();
                var evaluator = new ReportFilterEvaluatorService();
                for (var idx = 0; idx < recordsCopy.length; idx++) {
                    if (evaluator.evaluate(filter, recordsCopy[idx])) {
                        filtered.push(recordsCopy[idx]);
                    }
                }
            } else {
                filtered = recordsCopy;
            }
            return filtered;
        }
    };
    return ReportFilterModel;
} ]);

"use strict";

angular.module("lightReport").factory("ReportModel", [ function() {
    function ReportModel() {
        this.$data = [];
        this.$columns = [];
    }
    ReportModel.prototype = {
        get data() {
            return this.$data;
        },
        set data(value) {
            if (value instanceof Array) {
                this.$data = value;
            }
        },
        get displayedColumns() {
            var ret = [];
            angular.forEach(this.$columns, function(value) {
                if (value.isDisplayed) {
                    ret.push(value);
                }
            });
            return ret;
        },
        get columns() {
            return this.$columns;
        },
        set columns(newColumns) {
            if (angular.isObject(newColumns)) {
                var self = this;
                var column;
                var columnsArr = [];
                var isArray = Array.isArray(newColumns);
                angular.forEach(newColumns, function(value, key) {
                    if (!isArray && !value.hasOwnProperty("field")) {
                        value.field = key;
                    }
                    column = self.createColumn(value);
                    columnsArr.push(column);
                });
                this.$columns = columnsArr;
            }
        },
        getColumnByField: function getColumnByProp(field, value) {
            var comparator = function comparator(column) {
                return column[field] === value;
            };
            return this.$columns.find(comparator);
        },
        createColumn: function createColumn(settings) {
            var retVal = {
                field: "FIELD_EMPTY",
                label: "LABEL_EMPTY",
                type: "string",
                sort: true,
                sortable: true,
                isDisplayed: true,
                isPinned: false,
                getSuggestions: null
            };
            for (var prop in settings) {
                retVal[prop] = settings[prop];
            }
            if (retVal.field.indexOf("_displayValue") !== -1) {
                retVal.isDisplayed = false;
            }
            if (settings.sort === false) {
                retVal.sortable = false;
            }
            return retVal;
        }
    };
    return ReportModel;
} ]);

"use strict";

angular.module("lightReport").factory("ReportQueryModel", [ "ReportFilterModel", function(ReportFilterModel) {
    var ReportQueryModel = function() {
        this.params = {
            clientParams: {
                seqId: 1
            },
            fromRow: 0,
            rows: 150,
            scnId: -1,
            sortBy: []
        };
        this.$page = 0;
        this.hasNext = 0;
        this.filterModel = new ReportFilterModel();
        Object.defineProperty(this, "page", {
            get: function() {
                return this.$page;
            },
            set: function(value) {
                if (angular.isNumber(value)) {
                    this.$page = value;
                    this.params.fromRow = this.params.rows * this.$page;
                }
            }
        });
    };
    ReportQueryModel.SortDirection = {
        ASC: "asc",
        DESC: "desc"
    };
    ReportQueryModel.prototype.sort = function sort(field, direction) {
        if (typeof field !== "string" || direction && ReportQueryModel.SortDirection[direction.toUpperCase()] === undefined) {
            return;
        }
        if (direction) {
            var val = {
                field: field,
                direction: direction.toLowerCase()
            };
            var itemIdx = -1;
            for (var idx = 0; idx < this.params.sortBy.length; idx++) {
                if (this.params.sortBy[idx].field === field) {
                    itemIdx = idx;
                    break;
                }
            }
            if (itemIdx > -1) {
                this.params.sortBy[itemIdx] = val;
            } else {
                this.params.sortBy.push(val);
            }
        } else if (itemIdx > -1) {
            this.params.sortBy.splice(itemIdx, 1);
        }
    };
    ReportQueryModel.prototype.clearSort = function clearSort() {
        this.params.sortBy = [];
    };
    ReportQueryModel.prototype.queryToUrlString = function queryToUrlString(manualParams) {
        var filterNodes;
        var query;
        var backups = {};
        var tmpSortBy;
        if (manualParams) {
            for (var key in manualParams) {
                if (manualParams.hasOwnProperty(key) && this.params.hasOwnProperty(key)) {
                    backups[key] = this.params[key];
                    if (typeof manualParams[key] === "undefined" || manualParams[key] === null) {
                        delete this.params[key];
                    } else {
                        this.params[key] = manualParams[key];
                    }
                }
            }
        }
        filterNodes = this.filterModel.compileFilter();
        this.params.filter = JSON.stringify(filterNodes);
        tmpSortBy = this.params.sortBy;
        if (this.params.sortBy && this.params.sortBy.length > 0) {
            this.params.sortBy = [];
            for (var idx = 0; idx < tmpSortBy.length; idx++) {
                var sortItem = tmpSortBy[idx];
                var val = {};
                val[sortItem.field] = sortItem.direction;
                this.params.sortBy.push(val);
            }
            this.params.sortBy = JSON.stringify(this.params.sortBy);
        } else {
            delete this.params.sortBy;
        }
        query = $.param(this.params);
        delete this.params.filter;
        this.params.sortBy = tmpSortBy;
        if (backups) {
            for (key in backups) {
                if (backups.hasOwnProperty(key) && this.params.hasOwnProperty(key)) {
                    this.params[key] = backups[key];
                }
            }
        }
        return query;
    };
    ReportQueryModel.prototype.filterRecords = function filterRecords(records) {
        return this.filterModel.filterRecords(records);
    };
    ReportQueryModel.prototype.addFilter = function addFilter(key, options) {
        return this.filterModel.addFilter(key, options);
    };
    ReportQueryModel.prototype.removeFilter = function removeFilter(key) {
        this.filterModel.removeFilter(key);
    };
    return ReportQueryModel;
} ]);

"use strict";

angular.module("lightReport").service("ReportFilterService", [ "ReportFilterEvaluatorService", function(ReportFilterEvaluatorService) {
    var ReportFilterService = {
        FIELD: "FIELD",
        MAP: "MAP",
        RANGE: "RANGE",
        DATE_RANGE: "DATE_RANGE",
        createFilter: function(options) {
            var retVal = null;
            switch (options.type) {
              case ReportFilterService.FIELD:
                retVal = {};
                retVal[options.operation] = [ options.field, options.data ];
                break;

              case ReportFilterService.MAP:
                retVal = ReportFilterService.createFilterFromSearchMap(options.data);
                break;

              case ReportFilterService.RANGE:
                retVal = ReportFilterService.createFilterInRange(options.field, options.from, options.to);
                break;

              case ReportFilterService.DATE_RANGE:
                retVal = ReportFilterService.createFilterDateInRange(options.field, options.from, options.to);
                break;

              default:
                console.warn("ReportFilterService.createFilter: no filter type specified.");
            }
            return retVal;
        },
        createFilterFromSearchMap: function(map) {
            var values = [];
            var columns = Object.keys(map);
            for (var idx = 0; idx < columns.length; idx++) {
                values.push(this.createStatementFromMapValues(columns[idx], map[columns[idx]]));
            }
            var retVal = values[0];
            if (columns.length > 1) {
                retVal = {
                    AND: values
                };
            }
            return retVal;
        },
        createFilterInRange: function(field, from, to) {
            var retVal = {
                AND: [ {}, {} ]
            };
            retVal.AND[0][from.operation] = [ field, from.data ];
            retVal.AND[1][to.operation] = [ field, to.data ];
            return retVal;
        },
        createFilterDateInRange: function(field, from, to) {
            var adjustedFrom = {
                data: new Date(from.data).getTime(),
                operation: from.operation
            };
            var adjustedTo = {
                data: new Date(to.data).getTime(),
                operation: to.operation
            };
            return this.createFilterInRange(field, adjustedFrom, adjustedTo);
        },
        createFilterFromObject: function(obj) {
            var filterNodes = {};
            var keys = Object.keys(obj);
            if (keys.length > 1) {
                filterNodes = {
                    AND: []
                };
                for (var key in obj) {
                    var filter = this.createFilter(obj[key]);
                    filterNodes.AND.push(filter);
                }
            } else if (keys.length !== 0) {
                filterNodes = this.createFilter(obj[keys[0]]);
            }
            return filterNodes;
        },
        createStatementFromMapValues: function createStatementFromMapValues(columnName, values) {
            var isInStatement = values.length > 1;
            var operator = isInStatement ? "IN" : "=";
            var statement = {};
            statement[operator] = [ columnName, isInStatement ? values : values[0] ];
            return statement;
        }
    };
    return ReportFilterService;
} ]);

"use strict";

angular.module("lightReport").factory("ReportFilterEvaluatorService", function() {
    var ReportFilterEvaluatorService = function() {};
    ReportFilterEvaluatorService.prototype = {
        evaluate: function evaluate(filter, record) {
            var operator = Object.keys(filter)[0];
            return this[operator](filter[operator], record);
        },
        OR: function(nodes, record) {
            var operator;
            for (var idx = 0; idx < nodes.length; idx++) {
                operator = Object.keys(nodes[idx])[0];
                if (this[operator](nodes[idx][operator], record)) {
                    return true;
                }
            }
            return false;
        },
        AND: function(nodes, record) {
            var operator;
            for (var idx = 0; idx < nodes.length; idx++) {
                operator = Object.keys(nodes[idx])[0];
                if (!this[operator](nodes[idx][operator], record)) {
                    return false;
                }
            }
            return true;
        },
        IN: function(nodes, record) {
            var key = nodes[0];
            var val = nodes[1];
            var recordVal = record[key];
            for (var idx = 0; idx < val.length; idx++) {
                if (val[idx] == recordVal) {
                    return true;
                }
            }
            return false;
        },
        "=": function(nodes, record) {
            var key = nodes[0];
            var val = nodes[1];
            var recordVal = record[key];
            return recordVal == val;
        },
        ">=": function(nodes, record) {
            var key = nodes[0];
            var val = nodes[1];
            var recordVal = record[key];
            if (isNaN(val)) {
                throw val + " is not a number";
            }
            if (isNaN(recordVal)) {
                throw recordVal + " is not a number";
            }
            return recordVal >= val;
        },
        "<=": function(nodes, record) {
            var key = nodes[0];
            var val = nodes[1];
            var recordVal = record[key];
            if (isNaN(val)) {
                throw val + " is not a number";
            }
            if (isNaN(recordVal)) {
                throw recordVal + " is not a number";
            }
            return recordVal <= val;
        },
        ">": function(nodes, record) {
            var key = nodes[0];
            var val = nodes[1];
            var recordVal = record[key];
            if (isNaN(val)) {
                throw val + " is not a number";
            }
            if (isNaN(recordVal)) {
                throw recordVal + " is not a number";
            }
            return recordVal > val;
        },
        "<": function(nodes, record) {
            var key = nodes[0];
            var val = nodes[1];
            var recordVal = record[key];
            if (isNaN(val)) {
                throw val + " is not a number";
            }
            if (isNaN(recordVal)) {
                throw recordVal + " is not a number";
            }
            return recordVal < val;
        }
    };
    return ReportFilterEvaluatorService;
});

"use strict";

angular.module("lightReport").service("BaseReportService", [ "ReportModel", "ReportQueryModel", function(ReportModel, ReportQueryModel) {
    var BaseReportService = function() {
        this.reportModel = new ReportModel();
        this.queryModel = new ReportQueryModel();
        this.isInProgress = false;
        this.onDataHandlers = [];
        this.applyQueryThrottleLatency = 0;
        this.$appendDataThrottleLatency = 0;
        this.applyQueryTimeout = undefined;
        Object.defineProperty(this, "appendDataThrottleLatency", {
            enumerable: true,
            get: function() {
                return this.$appendDataThrottleLatency;
            },
            set: function(value) {
                if (angular.isNumber(value)) {
                    this.$appendDataThrottleLatency = value;
                    if (value > 0) {
                        this.appendData = this.appendDataThrottle();
                    } else {
                        this.appendData = this.$appendData;
                    }
                }
            }
        });
    };
    BaseReportService.prototype = {
        get data() {
            return this.reportModel.data;
        },
        set data(value) {
            this.setData(value);
        },
        get columns() {
            return this.reportModel.columns;
        },
        set columns(columns) {
            this.reportModel.columns = columns;
        },
        get page() {
            return this.queryModel.page;
        },
        set page(value) {
            this.queryModel.page = value;
        },
        get hasNext() {
            return this.queryModel.hasNext;
        },
        set hasNext(value) {
            if (typeof value === "boolean") {
                this.queryModel.hasNext = value;
            }
        },
        setData: function setData(value) {
            if (value instanceof Array) {
                this.reportModel.data = value;
                this.updateDataHandlers({
                    data: this.reportModel.data,
                    queryModel: this.queryModel
                }, false);
            } else {
                console.warn("BaseReportService.setData: value must be an Array");
            }
        },
        updateDataHandlers: function updateDataHandlers(value, isAppended) {
            for (var idx = 0; idx < this.onDataHandlers.length; idx++) {
                this.onDataHandlers[idx](value, isAppended);
            }
        },
        hasColumns: function hasColumns() {
            return this.reportModel.columns.length > 0;
        },
        applyQuery: function applyQuery(isPaging) {
            var self = this;
            self.isInProgress = true;
            if (self.applyQueryThrottleLatency && self.applyQueryThrottleLatency > 0) {
                if (!self.applyQueryTimeout) {
                    self.applyQueryTimeout = setTimeout(function() {
                        self.$applyQuery(isPaging);
                        clearTimeout(self.applyQueryTimeout);
                        self.applyQueryTimeout = undefined;
                    }, self.applyQueryThrottleLatency);
                }
            } else {
                self.$applyQuery(isPaging);
            }
        },
        $applyQuery: function $applyQuery(isPagging) {},
        onData: function onData(handler) {
            this.onDataHandlers.push(handler);
        },
        offData: function offData(handler) {
            var itemIdx = this.onDataHandlers.indexOf(handler);
            if (itemIdx >= 0) {
                this.onDataHandlers.splice(itemIdx, 1);
            }
        },
        addFilter: function addFilter(key, options) {
            return this.queryModel.filterModel.addFilter(key, options);
        },
        removeFilter: function removeFilter(key) {
            this.queryModel.filterModel.removeFilter(key);
        },
        getSuggestions: function getSuggestions(queryString, callback) {
            callback([]);
        },
        sort: function sort(field, direction) {
            this.queryModel.clearSort();
            this.queryModel.sort(field, direction);
            var column = this.reportModel.getColumnByField("field", field);
            var comparator = this.defaultComparator;
            if (column && typeof column.sort === "function") {
                comparator = column.sort;
            }
            this.reportModel.data.sort(this.compareFields(field, direction, comparator));
            return true;
        },
        compareFields: function compareFields(field, direction, comparator) {
            if (!comparator) {
                comparator = this.defaultComparator;
            }
            var numericDirection = -1;
            if (direction === "asc") {
                numericDirection = 1;
            }
            return function(objA, objB) {
                return comparator(objA, objB, field) * numericDirection;
            };
        },
        defaultComparator: function comparator(valueA, valueB, field) {
            var left = String(valueA[field]).split(",").join("");
            var right = String(valueB[field]).split(",").join("");
            return left.localeCompare(right, "kn", {
                numeric: true
            });
        },
        appendData: function appendData(records, prepend) {
            this.$appendData(records, prepend);
        },
        prependData: function prependData(records) {
            this.$prependData(records);
        },
        $appendData: function $appendData(records, prepend) {
            throw new Error("$appendData: Not supported");
        },
        $prependData: function $prependData(records) {
            throw new Error("$prependData: Not supported");
        },
        appendDataThrottle: function appendDataThrottle() {
            var timer = null;
            var pendingData = [];
            var self = this;
            return function(value) {
                if (Array.isArray(value)) {
                    Array.prototype.push.apply(pendingData, value);
                } else {
                    pendingData.push(value);
                }
                if (timer === null) {
                    self.$appendData(pendingData);
                    pendingData = [];
                    timer = setTimeout(function throttled() {
                        clearTimeout(timer);
                        timer = null;
                        if (pendingData.length > 0) {
                            self.$appendData(pendingData);
                            pendingData = [];
                        }
                    }, this.$appendDataThrottleLatency);
                }
            };
        }
    };
    return BaseReportService;
} ]);

"use strict";

angular.module("lightReport").service("LocalReportService", [ "BaseReportService", function(BaseReportService) {
    var LocalReportService = function() {
        BaseReportService.call(this);
        this.dataMap = {};
        this.displayDataMap = {};
        this.rawData = [];
        this.maxRecords = 0;
    };
    LocalReportService.prototype = Object.create(BaseReportService.prototype);
    LocalReportService.prototype.constructor = LocalReportService;
    LocalReportService.prototype.setData = function setData(value) {
        if (value instanceof Array) {
            if (this.maxRecords > 0 && value.length > this.maxRecords) {
                this.rawData = value.splice(0, this.maxRecords - 1);
            } else {
                this.rawData = value;
            }
            this.$applyQuery(false);
        }
    };
    LocalReportService.prototype.$appendData = function $appendData(newRecords, prepend) {
        this.isInProgress = true;
        if (!Array.isArray(newRecords)) {
            newRecords = [ newRecords ];
        }
        if (this.maxRecords > 0 && newRecords.length > this.maxRecords) {
            newRecords = newRecords.splice(0, this.maxRecords);
        }
        for (var idx = 0; idx < newRecords.length; idx++) {
            if (prepend === true) {
                this.rawData.push(newRecords[idx]);
            } else {
                this.rawData.unshift(newRecords[idx]);
            }
        }
        if (this.maxRecords > 0 && this.rawData.length > this.maxRecords) {
            var removedRecords = this.rawData.splice(this.maxRecords);
            this.removeFromViewModel(removedRecords);
        }
        var filteredData = this.addToViewModel(newRecords);
        this.lastResponse = {
            data: filteredData,
            queryModel: this.queryModel,
            isPaging: false
        };
        this.updateDataHandlers(this.lastResponse, true);
        this.isInProgress = false;
    };
    LocalReportService.prototype.$prependData = function $prependData(newRecords) {
        this.$appendData(newRecords, true);
    };
    LocalReportService.prototype.addToViewModel = function addToViewModel(records) {
        var filteredData = this.queryModel.filterRecords(records);
        if (filteredData.length > 0) {
            this.updateDataMap(this.dataMap, filteredData, this.reportModel.columns);
            if (this.queryModel.params.sortBy.length > 0) {
                this.addDataWithSort(filteredData);
            } else {
                for (var idx = 0; idx < filteredData.length; idx++) {
                    this.reportModel.data.push(filteredData[idx]);
                }
            }
        }
        return filteredData;
    };
    LocalReportService.prototype.removeFromViewModel = function removeFromViewModel(records, force) {
        force = force || false;
        var itemIdx;
        var filteredRecords;
        if (force) {
            filteredRecords = records;
        } else {
            filteredRecords = this.queryModel.filterRecords(records);
        }
        for (var idx = 0; idx < filteredRecords.length; idx++) {
            itemIdx = this.reportModel.data.indexOf(filteredRecords[idx]);
            if (itemIdx !== -1) {
                this.reportModel.data.splice(itemIdx, 1);
            }
        }
        this.updateDataMap(this.dataMap, records, this.reportModel.columns, true);
    };
    LocalReportService.prototype.updateData = function updateData(records) {
        if (!Array.isArray(records)) {
            records = [ records ];
        }
        this.removeFromViewModel(records, true);
        var filteredData = this.addToViewModel(records);
        this.lastResponse = {
            data: filteredData,
            queryModel: this.queryModel,
            isPaging: false
        };
        this.updateDataHandlers(this.lastResponse, true);
    };
    LocalReportService.prototype.addDataWithSort = function appendDataSort(newData) {
        var idx;
        var existingLength = this.reportModel.data.length;
        var newDataLegnth = newData.length;
        var sortField = this.queryModel.params.sortBy[0].field;
        var sortDirection = this.queryModel.params.sortBy[0].direction;
        var comparator = null;
        for (idx = 0; idx < this.reportModel.columns.length; idx++) {
            var column = this.reportModel.columns[idx];
            if (column.field === sortField && typeof column.sort === "function") {
                comparator = column.sort;
                break;
            }
        }
        var compareFunc = this.compareFields(sortField, sortDirection, comparator);
        if (existingLength && newDataLegnth && (newDataLegnth > existingLength || newDataLegnth / existingLength > .5)) {
            for (idx = 0; idx < newData.length; idx++) {
                this.reportModel.data.push(newData[idx]);
            }
            this.reportModel.data.sort(compareFunc);
        } else {
            for (idx = 0; idx < newData.length; idx++) {
                var destIdx = 0;
                var value = newData[idx];
                if (this.queryModel.params.sortBy.length > 0) {
                    for (destIdx = 0; destIdx < this.reportModel.data.length; destIdx++) {
                        if (compareFunc(this.reportModel.data[destIdx], value) >= 0) {
                            break;
                        }
                    }
                }
                this.reportModel.data.splice(destIdx, 0, value);
            }
        }
    };
    LocalReportService.prototype.$applyQuery = function $applyQuery(isPaging) {
        this.isInProgress = true;
        var filteredData = this.queryModel.filterRecords(this.rawData);
        this.dataMap = this.buildDataMap(filteredData, this.reportModel.columns);
        this.reportModel.data = filteredData;
        if (this.queryModel.params.sortBy.length > 0) {
            this.sort(this.queryModel.params.sortBy[0].field, this.queryModel.params.sortBy[0].direction);
        }
        this.lastResponse = {
            data: filteredData,
            queryModel: this.queryModel,
            isPaging: isPaging
        };
        this.updateDataHandlers(this.lastResponse, false);
        this.isInProgress = false;
    };
    LocalReportService.prototype.getSuggestions = function getSuggestions(queryString, existingTags, callback) {
        var self = this;
        var result = [];
        var existingGroups = [];
        if (angular.isString(queryString) && queryString.length > 0) {
            queryString = queryString.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
            for (var idx = 0; idx < existingTags.length; idx++) {
                existingGroups.push(existingTags[idx].groupField);
            }
            angular.forEach(self.dataMap, function(group, key) {
                if (key.indexOf("_displayValue") !== -1) {
                    return;
                }
                if (existingGroups.indexOf(key) === -1) {
                    var groupItems = null;
                    if (typeof group.getSuggestions === "function") {
                        groupItems = group.getSuggestions(group.map, queryString);
                    } else {
                        groupItems = self.findMatches(group.map, queryString);
                    }
                    if (groupItems && groupItems.length > 0) {
                        result.push({
                            field: key,
                            items: groupItems,
                            label: group.label
                        });
                    }
                }
            });
        }
        callback(result);
    };
    LocalReportService.prototype.buildDataMap = function buildDataMap(data, columns) {
        var retVal = {}, idx, key, dataItem, displayKey, itemValue, displayValue;
        for (var idx = 0; idx < columns.length; idx++) {
            if (columns[idx].field.indexOf("_displayValue") !== -1) {
                continue;
            }
            retVal[columns[idx].field] = {
                label: columns[idx].label,
                map: {},
                getSuggestions: columns[idx].getSuggestions
            };
        }
        for (idx = 0; idx < data.length; idx++) {
            dataItem = data[idx];
            for (key in retVal) {
                if (dataItem.hasOwnProperty(key + "_displayValue")) {
                    displayKey = key + "_displayValue";
                } else {
                    displayKey = key;
                }
                if (dataItem[displayKey] !== undefined) {
                    displayValue = dataItem[displayKey];
                    itemValue = dataItem[key];
                    if (!retVal[key].map.hasOwnProperty(displayValue)) {
                        retVal[key].map[displayValue] = {
                            value: itemValue,
                            count: 0
                        };
                    }
                    retVal[key].map[displayValue].count++;
                }
            }
        }
        return retVal;
    };
    LocalReportService.prototype.updateDataMap = function updateDataMap(dataMap, records, columns, isRemove) {
        var recordIdx, record, idx, fieldValue, displayValue, map, columnField;
        if (!Array.isArray(records)) {
            records = [ records ];
        }
        for (recordIdx = 0; recordIdx < records.length; recordIdx++) {
            record = records[recordIdx];
            for (idx = 0; idx < columns.length; idx++) {
                columnField = columns[idx].field;
                if (columnField.indexOf("_displayValue") !== -1) {
                    continue;
                }
                if (!dataMap[columnField]) {
                    dataMap[columnField] = {
                        label: columns[idx].label,
                        map: {}
                    };
                }
                fieldValue = record[columnField];
                if (record.hasOwnProperty(columnField + "_displayValue") && record[columnField + "_displayValue"] !== undefined) {
                    displayValue = record[columnField + "_displayValue"];
                } else {
                    displayValue = fieldValue;
                }
                if (fieldValue) {
                    map = dataMap[columnField].map;
                    if (map[displayValue]) {
                        if (isRemove) {
                            map[displayValue].count--;
                            if (map[displayValue].count === 0) {
                                delete map[displayValue];
                            }
                        } else {
                            map[displayValue].count++;
                        }
                    } else if (!isRemove) {
                        map[displayValue] = {
                            value: fieldValue,
                            count: 0
                        };
                    }
                }
            }
        }
    };
    LocalReportService.prototype.findMatches = function findMatches(map, query) {
        var results = [];
        var regExp = new RegExp("[\\s.,+_\\-()\\[\\]{}'\"/]" + query + "|^" + query, "gi");
        var passed;
        for (var key in map) {
            passed = regExp.test(key);
            if (!passed) {
                var cleanKey = key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "");
                regExp.lastIndex = 0;
                passed = regExp.test(cleanKey);
            }
            if (passed) {
                results.push({
                    value: map[key].value,
                    label: key
                });
            }
            regExp.lastIndex = 0;
        }
        return results;
    };
    return LocalReportService;
} ]);

"use strict";

angular.module("lightReport").service("LocalReportWorker", [ function() {
    var workerContent = function() {
        function appendSort(destData, newData, field, direction) {
            for (var newIdx = 0; newIdx < newData.length; newIdx++) {
                var right = newData[newIdx];
                var compareFunc = compareFields(field, direction);
                var destIdx = 0;
                for (destIdx = 0; destIdx < destData.length; destIdx++) {
                    if (compareFunc(newData[newIdx], destData[destIdx]) >= 0) {
                        break;
                    }
                }
                destData.splice(destIdx, 0, right);
            }
        }
        function compareFields(field, direction) {
            if (direction === "asc") {
                direction = -1;
            } else {
                direction = 1;
            }
            return function(a, b) {
                var left = String(a[field]).split(",").join("");
                var right = String(b[field]).split(",").join("");
                var retVal = left.localeCompare(right, "kn", {
                    numeric: true
                }) * direction;
                return retVal;
            };
        }
        self.addEventListener("message", function(event) {
            reportLog("worker: appendSort");
            appendSort(event.data.destData, event.data.newData, event.data.field, event.data.direction);
            postMessage(event.data.destData);
        });
    };
    var LocalReportWorker = function() {
        var blob = new Blob([ "(", workerContent.toString(), "())" ], {
            type: "text/javascript"
        });
        this.blobURL = window.URL.createObjectURL(blob);
        this.worker = null;
    };
    LocalReportWorker.prototype.create = function create() {
        this.worker = new Worker(this.blobURL);
    };
    LocalReportWorker.prototype.destroy = function destroy() {
        this.worker.removeEventListener("message", resultListener);
        this.worker.terminate();
        this.worker = null;
        window.URL.revokeObjectURL(this.blobURL);
    };
    var workerMessageHandler = false;
    LocalReportWorker.prototype.appendSort = function appendSort(sortArgs, callback) {
        var self = this;
        var resultListener = function(event) {
            reportLog("LocalReportWorker: callback");
            callback(event.data);
        };
        if (!workerMessageHandler) {
            workerMessageHandler = true;
            this.worker.addEventListener("message", resultListener, false);
        }
        this.worker.postMessage(sortArgs);
    };
    return LocalReportWorker;
} ]);

"use strict";

angular.module("lightReport").service("RestReportService", [ "$http", "BaseReportService", "$q", function($http, BaseReportService, $q) {
    var RestReportService = function(url) {
        BaseReportService.call(this);
        if (!url) {
            console.warn("lightReport.RestReportService: Must specify service url.");
        }
        this.url = url;
        this.lastResponse = {
            data: [],
            query: {},
            isPaging: false
        };
        this.queryCanceller = null;
        this.SYNC_COLUMNS = {
            NEVER: 0,
            ONCE: 1,
            ALWAYS: 2
        };
        this.syncColumns = this.SYNC_COLUMNS.ONCE;
    };
    RestReportService.prototype = Object.create(BaseReportService.prototype);
    RestReportService.prototype.$applyQuery = function $applyQuery(isPaging) {
        var self = this;
        this.isInProgress = true;
        if (isPaging) {
            if (this.queryModel.hasNext === false) {
                this.isInProgress = false;
                return;
            }
        } else {
            delete this.queryModel.params.scnId;
            this.queryModel.page = 0;
        }
        if (this.queryCanceller) {
            this.queryCanceller.resolve();
        }
        this.queryCanceller = $q.defer();
        var queryClone = angular.copy(this.queryModel);
        var url = this.url + "/?" + this.queryModel.queryToUrlString();
        var promise = $http.get(url, {
            timeout: this.queryCanceller.promise
        });
        promise.success(function(response) {
            self.queryModel.params.scnId = response.scnId;
            self.queryModel.hasNext = response.hasNext;
            self.lastResponse.data = response.data;
            self.lastResponse.executionTime = response.executionTime;
            self.lastResponse.queryModel = queryClone;
            self.lastResponse.isPaging = isPaging;
            if (isPaging) {
                Array.prototype.push.apply(self.reportModel.data, response.data);
            } else {
                self.reportModel.data = response.data;
                if (self.syncColumns !== self.SYNC_COLUMNS.NEVER) {
                    if (self.syncColumns === self.SYNC_COLUMNS.ONCE) {
                        self.syncColumns = self.SYNC_COLUMNS.NEVER;
                    }
                    self.columns = response.columns;
                }
            }
            self.updateDataHandlers(self.lastResponse, isPaging);
        }).finally(function() {
            self.isInProgress = false;
        });
    };
    RestReportService.prototype.getSuggestions = function getSuggestions(queryString, existingTags, callback) {
        var url = this.url + "/suggest/?query=" + encodeURIComponent(queryString);
        if (existingTags.length > 0) {
            url += "&alreadySelectedColumns=" + existingTags[0].groupField;
            for (var idx = 1; idx < existingTags.length; idx++) {
                url += "," + existingTags[idx].groupField;
            }
        }
        var self = this;
        $http.get(url).success(function(data) {
            var parsedSuggestions = self.parseSuggestions(data);
            callback(parsedSuggestions);
        });
    };
    RestReportService.prototype.parseSuggestions = function parseSuggestions(data) {
        var suggestions = [];
        for (var key in data) {
            var tmpObj = {
                field: key,
                label: data[key].label,
                items: []
            };
            for (var idx = 0; idx < data[key].results.length; idx++) {
                tmpObj.items.push({
                    value: data[key].results[idx],
                    label: data[key].results[idx]
                });
            }
            suggestions.push(tmpObj);
        }
        return suggestions;
    };
    RestReportService.prototype.sort = function sort(field, direction) {
        this.queryModel.clearSort();
        this.queryModel.sort(field, direction);
        this.$applyQuery(false);
    };
    return RestReportService;
} ]);

angular.module("lightReport").run([ "$templateCache", function($templateCache) {
    $templateCache.put("../lib/client/directives/lightReport/lightReport.tpl.html", '<div class="lightReportQuery"\n' + '     report-query="reportService.queryModel"\n' + '     data-report-auto-query="{{reportAutoQuery}}"\n' + '     data-report-submit-label="{{reportSubmitLabel}}" >\n' + '\t<ng-transclude class="lightReportQueryTrunsclude"></ng-transclude>\n' + "</div>\n" + "\n" + '<div class="lightReportGrid"\n' + '     ng-model="reportService.reportModel.data"\n' + "     report-grid\n" + '     data-grid-settings="gridSettings"\n' + "\n" + '     data-on-loaded="onGridLoadedHandler"\n' + '\t data-on-sort="onGridSortHandler"\n' + '\t data-on-select="onSelect"\n' + '\t data-on-double-select="onDoubleSelect"\n' + '\t data-on-click="onClick"\n' + '\t data-on-column-resize="onColumnResize"\n' + '\t data-on-scroll-hit-bottom="onScrollHitBottom">\n' + "\n" + "</div>");
    $templateCache.put("../lib/client/directives/reportQuery/reportQuery.tpl.html", '<form class="lightReportQueryForm" name="lightReportQueryForm">\n' + '\t<ng-transclude class="lightReportQueryContent"></ng-transclude>\n' + '\t<input class="lightReportQueryFormSubmit" type="submit" value="{{submitLabel}}">\n' + "</form>");
} ]);