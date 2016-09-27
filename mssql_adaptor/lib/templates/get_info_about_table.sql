SELECT t.TABLE_SCHEMA, t.TABLE_NAME, c.COLUMN_NAME, c.DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, c.IS_NULLABLE, TargetSchema, TargetTable, TargetColumn, i.IS_IDENTITY, j.IS_PRIMARY_KEY, c.IS_COMPUTED
FROM INFORMATION_SCHEMA.TABLES t
LEFT JOIN (
SELECT
    COLUMNPROPERTY(OBJECT_ID(TABLE_SCHEMA+'.'+TABLE_NAME),COLUMN_NAME,'IsComputed') AS IS_COMPUTED
    ,*
FROM INFORMATION_SCHEMA.COLUMNS) c ON t.TABLE_NAME = c.TABLE_NAME
LEFT JOIN (
SELECT
    ccu.table_name AS SourceTable
    ,ccu.constraint_name AS SourceConstraint
    ,ccu.column_name AS SourceColumn
    ,kcu.table_name AS TargetTable
    ,kcu.column_name AS TargetColumn
    ,kcu.table_schema AS TargetSchema
FROM INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu
    INNER JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc ON ccu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
    INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu ON kcu.CONSTRAINT_NAME = rc.UNIQUE_CONSTRAINT_NAME
) d ON t.TABLE_NAME = d.SourceTable AND c.COLUMN_NAME = d.SourceColumn
LEFT JOIN (
select o.name as TableName, c.name as ColumnName, CASE WHEN o.name IS NOT NULL THEN 'YES' END AS IS_IDENTITY
from sys.objects o inner join sys.columns c on o.object_id = c.object_id
where c.is_identity = 1
) i ON i.TableName = t.TABLE_NAME AND i.ColumnName = c.COLUMN_NAME
LEFT JOIN (
SELECT Col.Column_Name as ColumnName, Tab.TABLE_NAME AS TableName, 'YES' AS IS_PRIMARY_KEY 
 FROM 
    INFORMATION_SCHEMA.TABLE_CONSTRAINTS Tab, 
    INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE Col 
WHERE 
    Col.Constraint_Name = Tab.Constraint_Name
    AND Col.Table_Name = Tab.Table_Name
    AND Constraint_Type = 'PRIMARY KEY'
) j on j.ColumnName = c.COLUMN_NAME AND j.TableName = t.TABLE_NAME
where TABLE_TYPE = 'BASE TABLE'
order by t.TABLE_NAME
{% if table %}
and t.TABLE_NAME = '{{ table }}'
{% endif %}
