# Bugzilla import to Github #

## Prerequisites ##

Clone repository and create a config.json into it

```
    {
        "user":"xxx",
        "password":"ppp",
        "repository": "xxx/yyy"
    }
```

## Extract Bugzilla issues ##

### Create a xml file of issues ###

Retrieve Capella bugzilla issues, and extract it as XML 

https://bugs.eclipse.org/bugs/buglist.cgi?classification=Polarsys&f1=status_whiteboard&limit=0&list_id=19117778&o1=isnotempty&order=changeddate%2Cbug_id&product=Capella&query_format=advanced

Save it as `show_bug.cgi.xml`

### Create a json file from xml ###

`bugzilla.parse2json("show_bug.cgi.xml", "bugs.json)`

## Then import ##
