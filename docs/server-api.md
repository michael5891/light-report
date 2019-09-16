## Classes

<dl>
<dt><a href="#Report">Report</a></dt>
<dd></dd>
</dl>

## Members

<dl>
<dt><a href="#OracleLongDateFormatter">OracleLongDateFormatter</a> : <code>Formatter</code></dt>
<dd><p>OracleLongDateFormatter</p>
</dd>
<dt><a href="#OracleLongDateTimeFormatter">OracleLongDateTimeFormatter</a> : <code>Formatter</code></dt>
<dd><p>OracleLongDateTimeFormatter</p>
</dd>
<dt><a href="#_reports">_reports</a></dt>
<dd><p>handle routings</p>
</dd>
</dl>

<a name="Report"></a>

## Report
**Kind**: global class  
**Properties**

| Name | Type |
| --- | --- |
| columns | <code>object</code> | 

<a name="new_Report_new"></a>

### new Report(name, properties, beforeQuery, afterQuery)
Represents a report.


| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The name of the report (identifier for later use, avoid spaces). |
| properties | <code>object</code> | properties of report, defines columns . |
| beforeQuery | <code>function</code> | function to run before querying the DB. |
| afterQuery | <code>function</code> | function to run after querying the DB. |

<a name="OracleLongDateFormatter"></a>

## OracleLongDateFormatter : <code>Formatter</code>
OracleLongDateFormatter

**Kind**: global variable  
<a name="OracleLongDateFormatter.formatElement"></a>

### OracleLongDateFormatter.formatElement(element) ⇒ <code>\*</code>
add extra 0 digit to time elements in case only one digit exists

**Kind**: static method of [<code>OracleLongDateFormatter</code>](#OracleLongDateFormatter)  

| Param |
| --- |
| element | 

<a name="OracleLongDateTimeFormatter"></a>

## OracleLongDateTimeFormatter : <code>Formatter</code>
OracleLongDateTimeFormatter

**Kind**: global variable  
<a name="_reports"></a>

## \_reports
handle routings

**Kind**: global variable  
