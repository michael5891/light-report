<a name="LightReportFactory"></a>

## LightReportFactory
**Kind**: global class  
**Access**: public  
**Author**: Michael Yakubov  

* [LightReportFactory](#LightReportFactory)
    * [new LightReportFactory()](#new_LightReportFactory_new)
    * [.create(options)](#LightReportFactory.create) ⇒ <code>LocalReportService</code> \| <code>RestReportService</code>

<a name="new_LightReportFactory_new"></a>

### new LightReportFactory()
Report communication services factory.
Factory provider for light report locale, rest or socket services.

<a name="LightReportFactory.create"></a>

### LightReportFactory.create(options) ⇒ <code>LocalReportService</code> \| <code>RestReportService</code>
Factory provider for light report rest or socket services.

**Kind**: static method of [<code>LightReportFactory</code>](#LightReportFactory)  
**Access**: public  

| Param | Type |
| --- | --- |
| options | <code>null</code> \| <code>string</code> \| <code>object</code> | 

**Example**  
```
Local:
var liveService = LightReportFactory.create();

Rest:
var url = "reports/deals";
var restService = LightReportFactory.create(url);
```
