## Classes

<dl>
<dt><a href="#lightReport">lightReport</a></dt>
<dd></dd>
<dt><a href="#reportFilter">reportFilter</a></dt>
<dd></dd>
<dt><a href="#reportGrid">reportGrid</a></dt>
<dd></dd>
<dt><a href="#reportQuery">reportQuery</a></dt>
<dd></dd>
<dt><a href="#tagsFilter">tagsFilter</a></dt>
<dd><p>An angular wrapper for Stork-Tags input component, handles component events of Added\Removed
and executes call for suggestions on demand.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#OnLoadedCallback">OnLoadedCallback</a> : <code>function</code></dt>
<dd><p>&#39;onLoaded&#39; callback.</p>
</dd>
<dt><a href="#OnSelectCallback">OnSelectCallback</a> : <code>function</code></dt>
<dd><p>&#39;onSelect&#39; callback.</p>
</dd>
<dt><a href="#OnDoubleSelectCallback">OnDoubleSelectCallback</a> : <code>function</code></dt>
<dd><p>&#39;onDoubleSelect&#39; callback.</p>
</dd>
<dt><a href="#OnClickCallback">OnClickCallback</a> : <code>function</code></dt>
<dd><p>&#39;onClick&#39; callback.</p>
</dd>
<dt><a href="#OnSortCallback">OnSortCallback</a> : <code>function</code></dt>
<dd><p>&#39;onSort&#39; callback.</p>
</dd>
<dt><a href="#OnColumnResizeCallback">OnColumnResizeCallback</a> : <code>function</code></dt>
<dd><p>&#39;onColumnResize&#39; callback.</p>
</dd>
<dt><a href="#OnScrollHitBottomCallback">OnScrollHitBottomCallback</a> : <code>function</code></dt>
<dd><p>&#39;onScrollHitBottom&#39; callback.</p>
</dd>
</dl>

<a name="lightReport"></a>

## lightReport
**Kind**: global class  
**Access**: public  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| [lightReport] | <code>BaseReportService</code> |  | Light report service instance. you may use lightReportFactory to init such instance. |
| [gridSettings] | <code>gridSettings</code> |  |  |
| [reportAutoQuery] | <code>string</code> | <code>true</code> | Auto submit the query on filter change. |
| [reportSubmitLabel] | <code>string</code> | <code>&quot;Submit&quot;</code> | The submit button label. |
| [sortDirections] | <code>string</code> |  | The possible states of sorting |
| [onLoaded] | [<code>OnLoadedCallback</code>](#OnLoadedCallback) |  | onLoaded allows you to specify custom behavior when an element is loaded. |
| [onSelect] | [<code>OnSelectCallback</code>](#OnSelectCallback) |  | onSelect allows you to specify custom behavior when an element is selected. |
| [onDoubleSelect] | [<code>OnDoubleSelectCallback</code>](#OnDoubleSelectCallback) |  | onDoubleSelect allows you to specify custom behavior when an element is double selected. |
| [onClick] | [<code>OnClickCallback</code>](#OnClickCallback) |  | onClick allows you to specify custom behavior when an element is fully clicked. |
| [onSort] | [<code>OnSortCallback</code>](#OnSortCallback) |  | onSort allows you to specify custom behavior when an element is sorted, return true\false in order to execute internal sort after override. |
| [onColumnResize] | [<code>OnColumnResizeCallback</code>](#OnColumnResizeCallback) |  | onColumnResize allows you to specify custom behavior when an column resize. |


* [lightReport](#lightReport)
    * [new lightReport()](#new_lightReport_new)
    * [.$scope.applyQueryHandler(event, message)](#lightReport.$scope.applyQueryHandler) ℗
    * [.$scope.onDataHandler(result, isAppended)](#lightReport.$scope.onDataHandler) ℗

<a name="new_lightReport_new"></a>

### new lightReport()
Light report component main entry directive.
End to end(server<-->client) reports components, used as rest on demand or local self contained
data presentation report.

- If you don't use the AutoApplyQuery but rather wish to use the form manual submit mode
  make sure to sign any buttons(if any) with type='button' other wise it will trigger the submit.

**Example**  
```
     <div    light-report="lightReportFactory"
             data-report-auto-apply-query="true"
             data-report-submit-label="Submit">

              Select Tenor:
				 <select id="tenorSelect"
						 ng-model="selectedTenor"
						 ng-options="tenor.label for tenor in tenors track by tenor.value"
						 report-filter="tenorFilter"
						 data-filter-value="selectedTenor.value"
						 data-filter-field="tenor"
						 data-filter-type="reportFilterService.FIELD">
				 </select>
      </div>
```
<a name="lightReport.$scope.applyQueryHandler"></a>

### lightReport.$scope.applyQueryHandler(event, message) ℗
**Kind**: static method of [<code>lightReport</code>](#lightReport)  
**Access**: private  

| Param |
| --- |
| event | 
| message | 

<a name="lightReport.$scope.onDataHandler"></a>

### lightReport.$scope.onDataHandler(result, isAppended) ℗
**Kind**: static method of [<code>lightReport</code>](#lightReport)  
**Access**: private  

| Param |
| --- |
| result | 
| isAppended | 

<a name="reportFilter"></a>

## reportFilter
**Kind**: global class  
**Access**: public  
<a name="new_reportFilter_new"></a>

### new reportFilter([reportFilter], [filterKey], filterField, [filterValue], [filterType], [filterFrom], [filterTo])
Report Filter

Supports light report query input fields for data filtering.
Adding the report filter to any of the trunscluded query elements will
bind the ngModel to the ReportModel query filters.


| Param | Type | Description |
| --- | --- | --- |
| [reportFilter] | <code>string</code> | populates bound object with api property. |
| [filterKey] | <code>bool</code> | key in case of multiple filter elements as in case of IN range filter,                             if not set will use FilterField + 'Filter' as key. |
| filterField | <code>string</code> | the field\column name to be filtered. |
| [filterValue] | <code>string</code> \| <code>number</code> \| <code>bool</code> | used in case ngModel is not authentic as direct field value. |
| [filterType] | <code>string</code> | (ReportFilterService.FIELD | ReportFilterService.MAP | ReportFilterService.RANGE | ReportFilterService.DATE_RANGE) |
| [filterFrom] | <code>bool</code> | used in range\date_range filter, marks the field as the start element in the range of from -> to. |
| [filterTo] | <code>bool</code> | used in range\date_range filter, marks the field as the end element in the range of from -> to |

**Example**  
```
    Field Filter:
	   <select   ng-model="selectedName"
				 ng-options="name in names"

				 report-filter="name"
				 data-filter-value="selectedTenor.value"
				 data-filter-field="tenor"
				 data-filter-type="reportFilterService.FIELD">
	    </select>

     Range Filter:
     <input filter='key' filterFrom/>
     <input filter='key' filterTo/>

```
<a name="reportGrid"></a>

## reportGrid
**Kind**: global class  
**Access**: public  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [gridSettings] | <code>gridSettings</code> |  |
| [onLoaded] | [<code>OnLoadedCallback</code>](#OnLoadedCallback) | report grid load complete. |
| [onSelect] | [<code>OnSelectCallback</code>](#OnSelectCallback) | element is selected. |
| [onDoubleSelect] | [<code>OnDoubleSelectCallback</code>](#OnDoubleSelectCallback) | element is double selected. |
| [onClick] | [<code>OnClickCallback</code>](#OnClickCallback) | element is fully clicked. |
| [onSort] | [<code>OnSortCallback</code>](#OnSortCallback) | column sort call back. |
| [onColumnResize] | [<code>OnColumnResizeCallback</code>](#OnColumnResizeCallback) | column resize call back. |
| [onScrollHitBottom] | [<code>OnScrollHitBottomCallback</code>](#OnScrollHitBottomCallback) | on scroll hit bottom defined by gridSettings.infiniteScrollTolerance. |


* [reportGrid](#reportGrid)
    * [new reportGrid()](#new_reportGrid_new)
    * [.$scope.onGridSortHandler(event)](#reportGrid.$scope.onGridSortHandler)

<a name="new_reportGrid_new"></a>

### new reportGrid()
Report grid wraps the 3rd party grid components to normalize light reports required
functionality and behavior, dispatching proper grid load and events flow.

**Example**  
```
	 <div class="lightReportGrid"
	     ng-model="reportService.reportModel.data"

	     report-grid
	     data-grid-settings="gridSettings"

	     data-on-loaded="onGridLoadedHandler"
	     data-on-sort="onGridSortHandler"
	     data-on-select="onSelect"
	     data-on-double-select="onDoubleSelect"
	     data-on-click="onClick"
	     data-on-column-resize="onColumnResize"
	     data-on-scroll-hit-bottom="onScrollHitBottom">
	 </div>
```
<a name="reportGrid.$scope.onGridSortHandler"></a>

### reportGrid.$scope.onGridSortHandler(event)
Grid sort event handler, triggers bound onSort call back with
field and direction parameters.
Direction values: asc, desc or null for no direction.

**Kind**: static method of [<code>reportGrid</code>](#reportGrid)  
**Access**: public  

| Param |
| --- |
| event | 

<a name="reportQuery"></a>

## reportQuery
**Kind**: global class  
**Access**: public  

* [reportQuery](#reportQuery)
    * [new reportQuery(queryModel)](#new_reportQuery_new)
    * [.$scope.filterChangedHandler(event, message)](#reportQuery.$scope.filterChangedHandler) ⇒ <code>JSON</code> ℗
    * [.$scope.filterRemovedHandler(key)](#reportQuery.$scope.filterRemovedHandler) ℗
    * [.$scope.submitEventHandler()](#reportQuery.$scope.submitEventHandler) ℗

<a name="new_reportQuery_new"></a>

### new reportQuery(queryModel)
Report Query

Emits lightReportEvents.APPLY_QUERY event if reportAutoQuery property is true.


| Param | Type | Description |
| --- | --- | --- |
| queryModel | <code>ReportQueryModel</code> | used in range\date_range filter, marks the field as the end element in the range of from -> to |
|  | <code>reportAutoQuery</code> |  |

<a name="reportQuery.$scope.filterChangedHandler"></a>

### reportQuery.$scope.filterChangedHandler(event, message) ⇒ <code>JSON</code> ℗
Filter change handler, if reportAutoQuery is active non partial filters will trigger.
expected message fields:

**Kind**: static method of [<code>reportQuery</code>](#reportQuery)  
**Returns**: <code>JSON</code> - - filter result  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>object</code> |  |
| message | <code>object</code> |  |
| message.key | <code>string</code> | filter key |
| message.type | <code>string</code> | [ReportFilterService] |
| [message.field] | <code>string</code> |  |
| [message.data] | <code>string</code> |  |
| [message.from] | <code>number</code> \| <code>date</code> | Range input from |
| [message.to] | <code>number</code> \| <code>date</code> | Range input to |

<a name="reportQuery.$scope.filterRemovedHandler"></a>

### reportQuery.$scope.filterRemovedHandler(key) ℗
Filter remove handler.
expected message fields:

**Kind**: static method of [<code>reportQuery</code>](#reportQuery)  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | filter key |

<a name="reportQuery.$scope.submitEventHandler"></a>

### reportQuery.$scope.submitEventHandler() ℗
**Kind**: static method of [<code>reportQuery</code>](#reportQuery)  
**Access**: private  
<a name="tagsFilter"></a>

## tagsFilter
An angular wrapper for Stork-Tags input component, handles component events of Added\Removed
and executes call for suggestions on demand.

**Kind**: global class  
**Access**: public  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| getSuggestions | <code>function</code> | function executed to with current queryString, existingTags and callback for results.                                   function getSuggestions(queryString, existingTags, callback) |
| placeholder | <code>string</code> | placeholder for the input field. |
| settings | <code>tagsFilterSettings</code> |  |


* [tagsFilter](#tagsFilter)
    * [..suggestionsHandler(queryString, existingTags, callback)](#tagsFilter.suggestionsHandler)
    * [..tagsFilterSettings](#tagsFilter.tagsFilterSettings) : <code>Object</code>

<a name="tagsFilter.suggestionsHandler"></a>

### tagsFilter..suggestionsHandler(queryString, existingTags, callback)
function to be delivered by user for suggestions on user input change.

**Kind**: static method of [<code>tagsFilter</code>](#tagsFilter)  

| Param | Type | Description |
| --- | --- | --- |
| queryString | <code>String</code> | user input |
| existingTags | <code>Array</code> | existing tags |
| callback | <code>function</code> | results ready callback |

<a name="tagsFilter.tagsFilterSettings"></a>

### tagsFilter..tagsFilterSettings : <code>Object</code>
**Kind**: static typedef of [<code>tagsFilter</code>](#tagsFilter)  
**Access**: public  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| [suggestionsHandler] | <code>suggestionsHandler</code> |  | operand type. |
| [element] | <code>HTMLElement</code> | <code>hosting element</code> | html container element. |
| storkTagsInput |  |  |  |
| [placeholder] | <code>String</code> | <code>&#x27;&#x27;</code> | placeholder text for the input field. |
| [rechooseRemove] | <code>Boolean</code> | <code>true</code> |  |
| [inputMinWidth] | <code>number</code> | <code>110</code> |  |

<a name="OnLoadedCallback"></a>

## OnLoadedCallback : <code>function</code>
'onLoaded' callback.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| grid | <code>grid</code> | The grid component |
| setColumns | <code>function</code> | Replace existing grid columns. |
| setData | <code>function</code> | Replace grid data. |
| refresh | <code>function</code> | Refresh grid display. |

<a name="OnSelectCallback"></a>

## OnSelectCallback : <code>function</code>
'onSelect' callback.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| dataIndex | <code>int</code> | Selected record index. |
| rowData | <code>object</code> | Selected row record. |
| column | <code>String</code> | Selected record column. |
| isSelect | <code>boolean</code> | Is record selected. |

<a name="OnDoubleSelectCallback"></a>

## OnDoubleSelectCallback : <code>function</code>
'onDoubleSelect' callback.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| dataIndex | <code>int</code> | Selected record index. |
| rowData | <code>object</code> | Selected row record. |
| column | <code>String</code> | Selected record column. |
| isSelect | <code>boolean</code> | Is record selected. |

<a name="OnClickCallback"></a>

## OnClickCallback : <code>function</code>
'onClick' callback.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| dataIndex | <code>int</code> | Selected record index. |
| rowData | <code>object</code> | Selected row record. |
| column | <code>String</code> | Selected record column. |
| isSelect | <code>boolean</code> | Is record selected. |

<a name="OnSortCallback"></a>

## OnSortCallback : <code>function</code>
'onSort' callback.

**Kind**: global typedef  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| field | <code>string</code> |  | Selected record index. |
| direction | <code>string</code> | <code>&quot;asc\\desc&quot;</code> | Selected row record. |

<a name="OnColumnResizeCallback"></a>

## OnColumnResizeCallback : <code>function</code>
'onColumnResize' callback.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| column | <code>string</code> | Selected column. |
| index | <code>int</code> | Selected row record. |
| width | <code>int</code> | column width. |

<a name="OnScrollHitBottomCallback"></a>

## OnScrollHitBottomCallback : <code>function</code>
'onScrollHitBottom' callback.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| column | <code>string</code> | Selected column. |
| index | <code>int</code> | Selected row record. |
| width | <code>int</code> | column width. |

