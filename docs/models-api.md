## Classes

<dl>
<dt><a href="#ReportModel">ReportModel</a></dt>
<dd></dd>
<dt><a href="#ReportQueryModel">ReportQueryModel</a></dt>
<dd></dd>
</dl>

<a name="ReportModel"></a>

## ReportModel
**Kind**: global class  
**Access**: public  

* [ReportModel](#ReportModel)
    * [new ReportModel()](#new_ReportModel_new)
    * [..data](#ReportModel.data) ⇒ <code>Array</code>
    * [.data](#ReportModel.data)
    * [..columns](#ReportModel.columns) ⇒ <code>Array</code>
    * [..columns](#ReportModel.columns) ⇒ <code>Array</code>
    * [.columns](#ReportModel.columns)
    * [.getColumnByField(field, value)](#ReportModel.getColumnByField) ⇒ <code>ReportColumn</code>
    * [.createColumn([settings])](#ReportModel.createColumn) ⇒ <code>ReportColumn</code>
    * [..ReportColumn](#ReportModel.ReportColumn) : <code>Object</code>

<a name="new_ReportModel_new"></a>

### new ReportModel()
Report model used to accumulate and manage report data, query and columns.

<a name="ReportModel.data"></a>

### ReportModel..data ⇒ <code>Array</code>
Report data

**Kind**: static property of [<code>ReportModel</code>](#ReportModel)  
**Access**: public  
<a name="ReportModel.data"></a>

### ReportModel.data
Report data

**Kind**: static property of [<code>ReportModel</code>](#ReportModel)  
**Access**: public  

| Param | Type |
| --- | --- |
| value | <code>Array</code> | 

<a name="ReportModel.columns"></a>

### ReportModel..columns ⇒ <code>Array</code>
Report displayedColumns, returns array of displayed columns.

**Kind**: static property of [<code>ReportModel</code>](#ReportModel)  
**Access**: public  
<a name="ReportModel.columns"></a>

### ReportModel..columns ⇒ <code>Array</code>
Report columns

**Kind**: static property of [<code>ReportModel</code>](#ReportModel)  
**Access**: public  
<a name="ReportModel.columns"></a>

### ReportModel.columns
setting newColumns should be formated as:
unified object where its properties serve as columns keys
newColumns = {[key]:ReportColumn}
or array of formatted columns(use create column).
newColumns = [ReportColumn]

**Kind**: static property of [<code>ReportModel</code>](#ReportModel)  
**Access**: public  

| Param | Type |
| --- | --- |
| newColumns | <code>ReportColumn</code> \| <code>Array.&lt;ReportColumn&gt;</code> | 

<a name="ReportModel.getColumnByField"></a>

### ReportModel.getColumnByField(field, value) ⇒ <code>ReportColumn</code>
Find column by field\value.

**Kind**: static method of [<code>ReportModel</code>](#ReportModel)  
**Access**: public  

| Param | Type |
| --- | --- |
| field | <code>string</code> | 
| value | <code>object</code> | 

<a name="ReportModel.createColumn"></a>

### ReportModel.createColumn([settings]) ⇒ <code>ReportColumn</code>
Creates column object with the required\default fields.

**Kind**: static method of [<code>ReportModel</code>](#ReportModel)  
**Access**: public  

| Param | Type |
| --- | --- |
| [settings] | <code>ReportColumn</code> | 

<a name="ReportModel.ReportColumn"></a>

### ReportModel..ReportColumn : <code>Object</code>
**Kind**: static typedef of [<code>ReportModel</code>](#ReportModel)  
**Access**: public  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| field | <code>string</code> | data property field name |
| label | <code>string</code> | column label |
| [type] | <code>string</code> | field type as string|number|date or custom |
| [isDisplayed] | <code>boolean</code> | default true |
| [isPinned] | <code>boolean</code> | default false |
| [sort] | <code>boolean</code> \| <code>SortComparator</code> | is field sortable, can receive custom sort function. |
| [getSuggestions] | <code>getSuggestions</code> | custom get suggestions logic |

<a name="ReportQueryModel"></a>

## ReportQueryModel
**Kind**: global class  
**Access**: public  

* [ReportQueryModel](#ReportQueryModel)
    * [new ReportQueryModel()](#new_ReportQueryModel_new)
    * [.SortDirection](#ReportQueryModel.SortDirection) : <code>Object</code>
    * [#sort([field], [direction])](#ReportQueryModel+sort)
    * [#clearSort()](#ReportQueryModel+clearSort)
    * [#queryToUrlString(manualParams)](#ReportQueryModel+queryToUrlString)
    * [#filterRecords(records)](#ReportQueryModel+filterRecords) ⇒ <code>\*</code> \| <code>Array</code>
    * [#addFilter(key, options)](#ReportQueryModel+addFilter) ⇒ <code>AddFilterResult</code>
    * [#removeFilter(key)](#ReportQueryModel+removeFilter)
    * _static_
        * [.compileFilter()](#ReportQueryModel.compileFilter) ⇒ <code>object</code>
        * [.removeFilter(key)](#ReportQueryModel.removeFilter)

<a name="new_ReportQueryModel_new"></a>

### new ReportQueryModel()
Report query state model for filters and data invocation state as page and from\to row.

<a name="ReportQueryModel.SortDirection"></a>

### ReportQueryModel.SortDirection : <code>Object</code>
Report query available sorting directions.

**Access**: public  
<a name="ReportQueryModel+sort"></a>

### ReportQueryModel#sort([field], [direction])
Field + Direction  --> add sort
Field + null\undefined -->  remove sort by field

**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| [field] | <code>String</code> | filed name |
| [direction] | <code>&#x27;ASC&#x27;</code> \| <code>&#x27;DESC&#x27;</code> | asc\desc |

<a name="ReportQueryModel+clearSort"></a>

### ReportQueryModel#clearSort()
Remove all sort fields

**Access**: public  
<a name="ReportQueryModel+queryToUrlString"></a>

### ReportQueryModel#queryToUrlString(manualParams)
Parse ReportQuery to url query string.

**Access**: public  

| Param |
| --- |
| manualParams | 

<a name="ReportQueryModel+filterRecords"></a>

### ReportQueryModel#filterRecords(records) ⇒ <code>\*</code> \| <code>Array</code>
filterRecords

**Access**: public  

| Param |
| --- |
| records | 

<a name="ReportQueryModel+addFilter"></a>

### ReportQueryModel#addFilter(key, options) ⇒ <code>AddFilterResult</code>
Adds filter by type and relevant arguments.
Existing range\range-date filters(from-to fields) will be merged.

**Returns**: <code>AddFilterResult</code> - new filter elements.  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | filter key |
| options | <code>object</code> |  |
| options.type | <code>string</code> | [ReportFilterService] |
| [options.field] | <code>string</code> |  |
| [options.data] | <code>string</code> |  |
| [options.from] | <code>number</code> \| <code>date</code> | Range input from |
| [options.to] | <code>number</code> \| <code>date</code> | Range input to |

<a name="ReportQueryModel+removeFilter"></a>

### ReportQueryModel#removeFilter(key)
**Access**: public  

| Param |
| --- |
| key | 

<a name="ReportQueryModel.compileFilter"></a>

### ReportQueryModel.compileFilter() ⇒ <code>object</code>
Build collection of filters bound by AND condition
from an object properties.

**Kind**: static method of [<code>ReportQueryModel</code>](#ReportQueryModel)  
**Returns**: <code>object</code> - - single field filter: {'=':[...]}, multiple fields filter: {'AND': [...]}.  
**Access**: public  
<a name="ReportQueryModel.removeFilter"></a>

### ReportQueryModel.removeFilter(key)
**Kind**: static method of [<code>ReportQueryModel</code>](#ReportQueryModel)  
**Access**: public  

| Param |
| --- |
| key | 

