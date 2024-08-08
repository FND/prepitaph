title: Dynamic Field Lookup in Go
tags: go
author: FND
created: 2024-08-08
syntax: true

Writing Go code for the first time in
[ages](https://github.com/innoq/naveed/commits), I've recently had to
recalibrate my brain a bit -- though I was surprised at how little resistance I
encountered there.

One thing I struggled with, however, was dynamic field lookup: Extracting data
from a record based on a field name, with the latter determined at runtime --
think customizing table columns.

One approach is to use reflection:

```go
func GetFieldValue(obj interface{}, fieldName string) string {
    value := reflect.ValueOf(obj)
    return reflect.Indirect(value).FieldByName(fieldName).String()
}
```

That's fairly slow and somewhat unwieldy though. Turns out there's a ridiculous
alternative: JSON!

```go
package main

import (
    "encoding/json"
    "html/template"
    "os"
)

func main() {
    person := Person{
        Name: "JD",
        Age:  99,
        Location: Location{
            Lat: 123,
            Lon: 456,
        },
    }

    tmp, _ := json.Marshal(&person)
    data := map[string]interface{}{}
    json.Unmarshal(tmp, &data)

    template.Must(template.New("main").Parse(`
{{- $data := .Data -}}
{{- range $i, $col := .Columns -}}
    {{ $col }}: {{ index $data $col }}
{{ end }}
    `)).Execute(os.Stdout, View{
        Columns: []string{"Name", "Age"},
        Data:    data,
    })
}

type View struct {
    Columns []string
    Data    interface{}
}

type Person struct {
    Name     string
    Age      int
    Location Location
}

type Location struct {
    Lat int
    Lon int
}
```
