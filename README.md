Custom-table
-

Explain:
```
props:                       | this contains the properties that apply to the whole card.
    summary:                 | this only applies to the summary, if the header is filled in a row will be added below the table.
        headers:             | apply the summary to all available headers or specific headers.
        fontWeight:          | how fat does the font need to be?
        borders:             | apply borders to the summary?
        excludeRows:         | the given index (index starts at 1) of rows will be excluded from the summary.
    filters:                 <-- not available yet.
    styling:                 | this applies the style for the whole card.
        borders:             | this applies to the table, also for the summary if the property borders under summary is not defined.
        textAlign:           | the output in the table is text, this text can be aligned by this option.
            headers:         | apply the text align to all available headers or specific headers.
            alignHeaders:    | if this is false the header(s) will not be aligned. 
            direction:       | the direction of the text alignment.
    not_available_values:    | if the value from a sensor is this string|text, it will be shown as empty.
data:                        | this is the data that will be shown in the card/table.
    headers:                 | these are all the header.
        example1:            | this will be used for linking the values to this column (keep in mind, this is not the name that will be shown).
            title:           | this is the header name that will be shown in this column.
            properties:      | this is the properties that applies to the values in this column.
                prefix:      | this string|text will be added before the value in this column.
                suffix:      | this string|text will be added after the value in this column.
                type:        | this applies some style to the value.
                decimal:     | this is only available if the type is `decimal`.
                format:      | this is only available if the type is `decimal`.
                excludeRows: | the given index (index starts at 1) of the rows will be excluded from this styling.
        example2:
            title: 'header2'
    values:                                   | the values of the headers can be a string|text or data from a sensor.
        - example1:                           | this can be a static value or sensor data.
          example2:                           | this can be a static value or sensor data.

        - repeat:                             | if there are repetitive/repeat values, this will add more values to the card (based on the amount from the `start` and `end` value). See: Card example #5
            variable:                         | this is needed to bind the increment (repeat) value to the variable. 
            start:                            | index of the starting number (example: 0, 1 or 5. it depends on where you want to start), must be lower than the `end`.
            end:                              | index of the ending number (example: 6, 7 or 10. it depends on where you want to end), must be higher than the `start`.
            skip:                             | the number between `start` and `end` you want to exclude for the loop.
            paddingNumber:                    | if the `end` value is for example `10` it is 2 digits, so if the variable needs to be 01, 02, 03, etc. this needs to be set to 2 (if the index is 10 or higher it will not longer apply, but if this is set to 3 it will apply to the 10 to, so 010 but does not apply to 100 then), if it needs to be like 1, 2, 3, etc. this can be 0.
            paddingCharacter:                 | this is the character, which will be placed before the index, if `paddingNumber` is higher than 0. example: 01, 02, 03, etc.
          example1: someSensorName{repeat}    | this can be a static value or sensor data, if this is a sensor data and there is a need for a repetitive/repeat pattern, the repeats or repeat can be applied. if repeats or repeat is applied the variable from the repeat must be in one or multiple values.
          example2: someSensorName{repeat}_2  | this can be a static value or sensor data, if this is a sensor data and there is a need for a repetitive/repeat pattern, the repeats or repeat can be applied. if repeats or repeat is applied the variable from the repeat must be in one or multiple values.

        - repeats:                            | if there is a need for multiple increment values this can be used. See: Card example #6
            - repeat:                         | this is the same object as if this is for single use.
                variable:                     | this is needed to bind the increment (repeat) value to the variable. 
                start:                        | index of the starting number (example: 0, 1 or 5. it depends on where you want to start), must be lower than the `end`.
                end:                          | index of the ending number (example: 6, 7 or 10. it depends on where you want to end), must be higher than the `start`.
                skip:                         | the number between `start` and `end` you want to exclude for the loop.
                paddingNumber:                | if the `end` value is for example `10` it is 2 digits, so if the variable needs to be 01, 02, 03, etc. this needs to be set to 2 (if the index is 10 or higher it will not longer apply, but if this is set to 3 it will apply to the 10 to, so 010 but does not apply to 100 then), if it needs to be like 1, 2, 3, etc. this can be 0.
                paddingCharacter:             | this is the character, which will be placed before the index, if `paddingNumber` is higher than 0. example: 01, 02, 03, etc.
            - repeat: 
                variable:
                start:
                end:
                skip:
                paddingNumber:
                paddingCharacter:
          example1: someSensorName{repeat_1}  | this can be a static value or sensor data, if this is a sensor data and there is a need for a repetitive/repeat pattern, the repeats or repeat can be applied. if repeats or repeat is applied the variable from the repeat must be in one or multiple values.
          example2: otherSensorName{repeat_2} | this can be a static value or sensor data, if this is a sensor data and there is a need for a repetitive/repeat pattern, the repeats or repeat can be applied. if repeats or repeat is applied the variable from the repeat must be in one or multiple values.

```
   
Datatype:
```
props:                        | <object>                 | available: `summary`|`filter`|`styling`
    summary:                  | <object>                 | available: `headers`|`fontWeight`|`borders`|`excludeRows`
        headers:              | <boolean|string>         | available: `true`|`false`|any header name with a comma delimiter (example: header1,header2,header4).
        fontWeight:           | <string|integer>         | available: `unset`|`normal`|`bold`|`bolder`|`100`|`200`|`300`|`400`|`500`|`600`|`700`|`800`|`900`
        borders:              | <boolean|string>         | available: `true`|`false`|`top`|`left`|`right`|`bottom`
        excludeRows:          | <array>                  | available: row indexes (starts counting from 1)
    filters:                  <-- not available yet.
    styling:                  | <object>                 | available: `borders`|`textAlign`
        borders:              | <boolean|string>         | available: `true`|`false`|`top`|`left`|`right`|`bottom`
        textAlign:            | <object>                 | available: `headers`|`alignHeaders`|`direction`
            headers:          | <boolean|string>         | available: `true`|`false`|any header name with a comma delimiter (example: header1,header2,header4)
            alignHeaders:     | <boolean>                | available: `true`|`false`
            direction:        | <string>                 | available: `left`|`right`|`center`|`justify`|`unset`
    not_available_values:     | <array>                  | available: `any` (string|integer)
data:                         | <object>                 | available: `headers`|`values`
    headers:                  | <object>                 | available: `any` (string)
        example1:             | <object>                 | available: `title`|`properties`
            title:            | <string>                 | available: `any` (string)
            properties:       | <object>                 | available: `prefix`|`suffix`|`type`|`decimal`|`format`|`excludeRows`
                prefix:       | <string>                 | available: `any` (string)
                suffix:       | <string>                 | available: `any` (string)
                type:         | <string>                 | available: `decimal`|`text`
                decimal:      | <integer>                | available: `any` (integer)
                format:       | <string>                 | available: `nl`|`en`
                excludeRows:  | <array>                  | available: row indexes (starts counting from 1)
        example2:
            title: 'header2'
    values:                   | <array>                   | available: all headers for each item.
        - example1:           | <string|integer|variable> | available: sensor variable, string input, integer input.
          example2:           | <string|integer|variable> | available: sensor variable, string input, integer input.
    
        - repeat:             | <object>                  | available: `variable`|`start`|`end`|`skip`|`paddingNumber`|`paddingCharacter`
            variable:         | <string>                  | available: `any` (string)
            start:            | <integer>                 | available: `any` (integer)
            end:              | <integer>                 | available: `any` (integer) 
            skip:             | <array>                   | available: number(s) between `start` and `end`
            paddingNumber:    | <integer>                 | available: `any` (integer)
            paddingCharacter: | <string|integer>          | available: `any` (string|integer)
          example1:           | <string|integer|variable> | available: sensor variable, string input, integer input.
          example2:           | <string|integer|variable> | available: sensor variable, string input, integer input.

        - repeats:                | <array>                   | available: `any` (repeat object)
            - repeat:             | <object>                  | available: `variable`|`start`|`end`|`skip`|`paddingNumber`|`paddingCharacter`
                variable:         | <string>                  | available: `any` (string)
                start:            | <integer>                 | available: `any` (integer)
                end:              | <integer>                 | available: `any` (integer) 
                skip:             | <array>                   | available: number(s) between `start` and `end`
                paddingNumber:    | <integer>                 | available: `any` (integer)
                paddingCharacter: | <string|integer>          | available: `any` (string|integer)
            - repeat:             | <object>                  | available: `variable`|`start`|`end`|`skip`|`paddingNumber`|`paddingCharacter`
                start:            | <integer>                 | available: `any` (integer)
                end:              | <integer>                 | available: `any` (integer) 
                skip:             | <array>                   | available: number(s) between `start` and `end`
                paddingNumber:    | <integer>                 | available: `any` (integer)
                paddingCharacter: | <string|integer>          | available: `any` (string|integer)
          example1:               | <string|integer|variable> | available: sensor variable, string input, integer input.
          example2:               | <string|integer|variable> | available: sensor variable, string input, integer input.

```

Card example #1:
```
- type: custom:custom-table
  title: 'example #1'
  props:
    summary:
        headers:    true
        title:      'Total'
        fontWeight: bold
        excludeRows:
    styling:
        borders: true
        textAlign:
            - headers:      true
              alignHeaders: true
              direction:    center
            - headers:      header3,header4
              alignHeaders: false
              direction:    right
    not_available_values:
        - 'unknown'
    data:
        headers:
            header_1:
                title: 'header #1'
            header_2:
                title: 'header #2'
                properties:
                    prefix: '€'
                    type: 'decimal'
                    decimal: 2
                    format: 'nl'
                    excludeRows:
                        - 1
            header_3:
                title: 'header #3'
                properties:
                    suffix: '°C'
                    type: 'decimal'
                    decimal: 1
                    format: 'nl'
                    excludeRows:
                        - 1
        values:
            - header_1: 'Front yard'
              header_2: 5
              header_3: 9.2
            - header_1: 'Back yard'
              header_2: 4
              header_3: 12.2
```
Output:
```
_______________________________________________
|       | header #1   | header #2 | header #3 |
_______________________________________________
|       | Front yard  |    € 5,00 |    9,2 °C |
_______________________________________________
|       | Back yard   |    € 4,00 |   12,2 °C |
_______________________________________________
| Total |             |    € 9,00 |   21,4 °C |
_______________________________________________
```


Card example #2:
```
- type: custom:custom-table
  title: 'example #2'
  props:
    summary:
        headers:    header_3
        title:      'T'
        fontWeight: bold
        borders:    false
        excludeRows:
    styling:
        borders: true
        textAlign:
            - headers:      header_3
              alignHeaders: false
              direction:    center
            - headers:      header_4
              alignHeaders: false
              direction:    right
    not_available_values:
  data:
    headers:
        header_1:
            title: 'header #1'
        header_2:
            title: 'header #2'
            properties:
                prefix: '€'
                type: 'decimal'
                decimal: 1
                format: 'nl'
                excludeRows:
        header_3:
            title: 'header #3'
            properties:
                suffix: '°C'
                type: 'decimal'
                decimal: 0
                format: 'nl'
                excludeRows:
    values:
        - header_1: 'Front yard'
          header_2: 6
          header_3: 10.2
        - header_1: 'Back yard'
          header_2: 5
          header_3: 14.2
```
Output:
```
_________________________________________________
|   | header #1     | header #2   |  header #3  |
_________________________________________________
|   | Front yard    | € 6,00      |    10 °C    |
_________________________________________________
|   | Back yard     | € 5,00      |    14 °C    |
_________________________________________________
  T                                    24 °C

```


Card example #3:
```
- type: custom:custom-table
  title: 'example #3'
  props:
    summary:
        headers:    header_2
        title:      ''
        fontWeight: bolder
        borders:    false
        excludeRows:
    styling:
        borders: false
        textAlign:
            - headers:      true
              alignHeaders: true
              direction:    right
    not_available_values:
  data:
    headers:
        header_1:
            title: 'header #1'
        header_2:
            title: 'header #2'
            properties:
                prefix: '€'
                type: 'decimal'
                decimal: 2
                format: 'nl'
                excludeRows:
        header_3:
            title: 'header #3'
            properties:
                suffix: '°C'
                type: 'decimal'
                decimal: 0
                format: 'nl'
                excludeRows:
    values:
        - header_1: 'Front yard'
          header_2: 7
          header_3: 11.2
        - header_1: 'Back yard'
          header_2: 6
          header_3: 15.2
```
Output:
```
    header #1     header #2     header #3
   Front yard        € 7,00         11 °C
    Back yard        € 6,00         15 °C
                    € 13,00   
```


Card example #4:
```
- type: custom:custom-table
  title: 'example #4'
  props:
    summary:
        headers:    header_2,header_3
        title:      ''
        fontWeight: bolder
        borders:    true
        excludeRows:
    styling:
        borders: false
        textAlign:
            - headers:      true
              alignHeaders: false
              direction:    right
    not_available_values:
  data:
    headers:
        header_1:
            title: 'header #1'
        header_2:
            title: 'header #2'
            properties:
                prefix: '€'
                type: 'decimal'
                decimal: 2
                format: 'nl'
                excludeRows:
        header_3:
            title: 'header #3'
            properties:
                suffix: '°C'
                type: 'decimal'
                decimal: 0
                format: 'nl'
                excludeRows:
    values:
        - header_1: 'Front yard'
          header_2: 8
          header_3: 12
        - header_1: 'Back yard'
          header_2: 7
          header_3: 16
```
Output:
```
  header #1       header #2     header #3
     Front yard        € 6,00         10 °C
      Back yard        € 5,00         14 °C
_____________________________________________
|               |     € 15,00 |       28 °C |
_____________________________________________
```

Card example #5:
```
- type: custom:custom-table
  title: 'example #5'
  props:
    summary:
        headers:    header_2,header_3
        title:      ''
        fontWeight: bolder
        borders:    top
        excludeRows:
    styling:
        borders: false
        textAlign:
            - headers:      true
              alignHeaders: false
              direction:    right
    not_available_values:
  data:
    headers:
        header_1:
            title: 'header #1'
        header_2:
            title: 'header #2'
            properties:
                    prefix: '€'
                    type: 'decimal'
                    decimal: 2
                    format: 'nl'
                    excludeRows:
        header_3:
            title: 'header #3'
            properties:
                suffix: '°C'
                type: 'decimal'
                decimal: 0
                format: 'nl'
                excludeRows:
  values:
    - repeat:
        variable: repeatVariableName
        start: 1
        end: 5
        skip:
        paddingNumber: 2
        paddingCharacter: 0
      header_1: 'Front yard {repeatVariableName}'
      header_2: 1
      header_3: 2
```

Output
```
  header #1       header #2     header #3
   Front yard 01       € 1,00         2 °C
   Front yard 01       € 1,00         2 °C
   Front yard 01       € 1,00         2 °C
   Front yard 01       € 1,00         2 °C
   Front yard 01       € 1,00         2 °C
_____________________________________________
                      € 5,00         10 °C
```

Card example #6:
```
- type: custom:custom-table
  title: 'example #6'
  props:
    summary:
        headers: false
    styling:
        borders: false
        textAlign:
            - headers:      true
              alignHeaders: false
              direction:    right
    not_available_values:
  data:
    headers:
        header_1:
            title: 'header #1'
        header_2:
            title: 'header #2'
        header_3:
            title: 'header #3'
    values:
        - repeats:
            - repeat:
                variable: repeatVariableName_1
                start: 1
                end: 5
                skip:
                paddingNumber: 2
                paddingCharacter: 0
            - repeat:
                variable: repeatVariableName_2
                start: 5
                end: 10
                skip:
                paddingNumber: 2
                paddingCharacter: 0
            - repeat:
                variable: repeatVariableName_3
                start: 10
                end: 15
                skip:
                paddingNumber: 2
                paddingCharacter: 0
          header_1: 'value: {repeatVariableName_1}'
          header_2: 'value: {repeatVariableName_2}'
          header_3: 'value: {repeatVariableName_3}'
```

Output
```
  header #1        header #2       header #3
        value 01        value 05        value 10
        value 02        value 06        value 11
        value 03        value 07        value 12
        value 04        value 08        value 13
        value 05        value 09        value 14
```