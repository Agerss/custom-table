const LitElement = customElements.get('hui-masonry-view')
    ? Object.getPrototypeOf(customElements.get('hui-masonry-view'))
    : Object.getPrototypeOf(customElements.get('hui-view'));
const html       = LitElement.prototype.html;
const css        = LitElement.prototype.css;

class CustomTable extends LitElement {
    static get properties() {
        return {
            hass                 : {type: Object},
            config               : {type: Object},
            autoToggleView       : {type: Boolean},
            autoToggleViewTimerId: {type: Number},
            data                 : {type: Object},
            messages             : {type: Array},
            sensors              : {type: Array},
            view                 : {type: String},
            views                : {type: Object}
        };
    }

    static get styles() {
        return [
            css`
                ha-card {
                    padding: 2rem 1rem;
                    margin: auto;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    overflow: hidden;
                    position: relative;
                }
                ha-card h1 {
                    font-size: 1.3rem;
                    margin: 0 0 .34rem .45rem;
                    padding: 0;
                }
                ha-card table {
                    flex-grow: 1;
                }
                ha-card table tr td {
                    padding: 0 .5rem;
                }
            `
        ];
    }

    constructor() {
        super();

        this.props = {
            summary: false,
            borders: false,
            filters: false, // not in use!
        };

        this.data = {
            headers : {},
            values  : {}
        };

        this.utils = {
            isUndefined        : v => typeof v === 'undefined',
            isNull             : v => typeof v === 'object' && v === null,
            isObject           : v => typeof v === 'object' && !['null', null, undefined].includes(v) && !Object.keys(v).includes('0'),
            isArray            : v => typeof v === 'object' && !['null', null, undefined].includes(v) && Object.keys(v).includes('0'),
            isString           : v => typeof v === 'string' && `${v}`.length > 0,
            isNumber           : v => !isNaN(v) && !this.utils.isNull(v),
            isBool             : v => typeof v === 'boolean' || v === true || v === false,
            isObjectEmpty      : v => this.utils.isObject(v) && Object.keys(v).length === 0,
            isArrayEmpty       : v => this.utils.isArray(v) && v.length === 0,
            isValueNotAvailable: v => {
                let array = [];
                const notAvailableValues = this.props.not_available_values || null;
                switch (typeof notAvailableValues) {
                    case 'string':
                        array = `${notAvailableValues}`.indexOf('.') !== -1
                            ? notAvailableValues.split('.')
                            : [notAvailableValues];
                        break;
                    case 'object':
                        array = this.utils.isObject(notAvailableValues)
                            ? Object.values(notAvailableValues)
                            : [];
                        break;
                    default:
                        break;
                }

                return array.includes(v);
            },
            padding            : ({ v, isPrefix, paddingNumber, paddingCharacter}) => {
                isPrefix = this.utils.isBool(isPrefix) && isPrefix;
                if (
                    !this.utils.isNumber(v)
                    || !this.utils.isNumber(paddingNumber)
                    || !this.utils.isString(paddingCharacter)
                ) {
                    return v;
                }

                const valueLength = `${v}`.length;
                const lengthDiff  = paddingNumber - valueLength;
                if (lengthDiff > 0) {
                    for (let i=0;i<lengthDiff;i++) {
                        v = isPrefix
                            ? `${paddingCharacter}${v}`
                            : `${v}${paddingCharacter}`;
                    }
                }

                return v;
            },
            statesValue: v => {
                if (this.utils.isValueNotAvailable(v)) {
                    return 'N/A';
                }

                const value = this.utils.isObject(this.hass)
                    && this.hass.hasOwnProperty('states')
                    && this.utils.isObject(this.hass.states)
                    && this.hass.states.hasOwnProperty(v)
                        ? this.hass.states[v]
                        : v;

                return this.utils.isObject(value) && value.hasOwnProperty('state')
                    ? value.state
                    : value;
            },
            setValueType: ({ v, props, index }) => {
                if (
                    !this.utils.isObject(props)
                    || this.utils.isObjectEmpty(props)
                    || (
                        props.hasOwnProperty('excludeRows')
                        && this.utils.isArray(props.excludeRows)
                        && !this.utils.isArrayEmpty(props.excludeRows)
                        && props.excludeRows.includes(index)
                    )
                ) {
                    return v;
                }

                switch (props.type || 'text') {
                    case 'decimal':
                        if (
                            this.utils.isNumber(v)
                        ) {
                            const decimal = props.hasOwnProperty('decimal') && this.utils.isNumber(props.decimal)
                                ? props.decimal
                                : 2;

                            v = Number(v);
                            v = props.hasOwnProperty('decimal')
                                ? v.toFixed(decimal)
                                : v;

                            if (
                                props.hasOwnProperty('format')
                                && this.utils.isString(props.format)
                            ) {
                                switch (props.format.toLowerCase()) {
                                    case 'nl':
                                        v = `${v}`
                                            .replace(/,/g, '####|COMMA|####')
                                            .replace(/\./g, '####|PUNT|####')
                                            .replace(/'####\|COMMA\|####'/g, '.')
                                            .replace(/####\|PUNT\|####/g, ',');
                                        break;
                                    case 'en':
                                    default:
                                        break;
                                }
                            }
                        }
                        break;
                    case 'text':
                    default:
                        break;
                }

                return [
                    props.hasOwnProperty('prefix') ? props.prefix : '',
                    `${v}`,
                    props.hasOwnProperty('suffix') ? props.suffix : '',
                ].join(' ');
            },
            borderProperties: (borderProp, isTransparent) => {
                if (!this.utils.isString(borderProp)) {
                    return '';
                }

                isTransparent = this.utils.isBool(isTransparent) ? isTransparent : false;
                switch (`${borderProp}`.toLowerCase()) {
                    case 'top':
                    case 'left':
                    case 'right':
                    case 'bottom':
                        return `border-${borderProp}: .1rem solid ${isTransparent ? `transparent` : `var(--primary-text-color)`};`;
                    default:
                        return '';
                }
            },
            arrayRange: (start, stop, excludes) => {
                if (
                    !this.utils.isNumber(start)
                    || !this.utils.isNumber(stop)
                ) {
                    return [];
                }

                const range = [...Array(stop - start + 1).keys()]
                    .map(x => x + start);

                if (
                    this.utils.isArray(excludes)
                    && !this.utils.isNull(excludes)
                    && !this.utils.isArrayEmpty(excludes)
                ) {
                    excludes.forEach(
                        (excludeIndex, _) => range.indexOf(excludeIndex) !== -1
                            ? range.splice(range.indexOf(excludeIndex), 1)
                            : null
                    );
                }

                return range;
            },

            fixRepeatValues: () => {
                const funcRepeat = ({valueProps, valuePropKeys, repeatObject}) => {
                    const repeatValues = [];
                    if (
                        this.utils.isObject(repeatObject)
                        && repeatObject.hasOwnProperty('variable')
                        && repeatObject.hasOwnProperty('start')
                        && repeatObject.hasOwnProperty('end')
                        && repeatObject.hasOwnProperty('skip')
                        && repeatObject.hasOwnProperty('paddingNumber')
                        && repeatObject.hasOwnProperty('paddingCharacter')
                        && this.utils.isString(repeatObject.variable)
                        && this.utils.isNumber(repeatObject.start)
                        && this.utils.isNumber(repeatObject.end)
                        && (
                            this.utils.isArray(repeatObject.skip)
                            || this.utils.isNull(repeatObject.skip)
                        )
                        && this.utils.isNumber(repeatObject.paddingNumber)
                        && (
                            this.utils.isNumber(repeatObject.paddingCharacter)
                            || this.utils.isString(repeatObject.paddingCharacter)
                        )
                        && repeatObject.start < repeatObject.end
                    ) {
                        const hasRepeat = valuePropKeys.indexOf('repeat') !== -1;
                        if (hasRepeat) {
                            valuePropKeys.splice(valuePropKeys.indexOf('repeat'), 1);
                        }

                        const repeatRange = this.utils.arrayRange(
                            repeatObject.start,
                            repeatObject.end,
                            repeatObject.skip
                        );

                        repeatRange.forEach(
                            (repeatIndex, _) => {
                                const repeatValueObject = {};
                                // re-populate repeatValues
                                valuePropKeys.forEach(
                                    (valuePropKey, _) => {
                                        let value = valueProps[valuePropKey];

                                        value = this.utils.isString(value)
                                        && `${value}`.indexOf(repeatObject.variable) !== -1
                                            ? value.replace(
                                                `{${repeatObject.variable}}`,
                                                this.utils.padding(
                                                    {
                                                        v                : `${repeatIndex}`,
                                                        isPrefix         : true,
                                                        paddingNumber    : repeatObject.paddingNumber || 1,
                                                        paddingCharacter : `${repeatObject.paddingCharacter}`,
                                                    }
                                                )
                                            )
                                            : value;

                                        repeatValueObject[valuePropKey] = !this.utils.isValueNotAvailable(value)
                                            ? this.utils.statesValue(value)
                                            : value;
                                    }
                                );
                                repeatValues.push(repeatValueObject);
                            }
                        );
                    } else {
                        valuePropKeys.forEach(
                            (valuePropKey, _) => repeatValues[valuePropKey] = 'N/A'
                        );
                    }

                    return repeatValues;
                };

                const funcRepeats = ({valueProps, valuePropKeys, repeatsObject}) => {
                    let repeatValues = [];
                    let valueProperties = Object.assign({}, valueProps);
                    if (valuePropKeys.indexOf('repeats') !== -1) {
                        valuePropKeys.splice(valuePropKeys.indexOf('repeats'), 1);
                        if (
                            this.utils.isObject(valueProperties)
                            && valueProperties.hasOwnProperty('repeats')
                        ) {
                            delete valueProperties.repeats;
                        }
                    }

                    if (
                        this.utils.isArray(repeatsObject)
                        && !this.utils.isArrayEmpty(repeatsObject)
                        && !this.utils.isNull(repeatsObject)
                    )
                    {
                        repeatValues = this.utils.arrayRange(
                            repeatsObject[0].repeat.start,
                            repeatsObject[0].repeat.end,
                            repeatsObject[0].repeat.skip || []
                        );

                        repeatValues = repeatValues.map(
                            (_, rowIndex) => {
                                let   valueObject = Object.assign({}, valueProperties);

                                repeatsObject.forEach(
                                    (repeatObject, _) => {
                                        repeatObject = this.utils.isObject(repeatObject) && repeatObject.hasOwnProperty('repeat')
                                            ? repeatObject.repeat
                                            : {};

                                        if (
                                            this.utils.isObject(repeatObject)
                                            && !this.utils.isObjectEmpty(repeatObject)
                                            && repeatObject.hasOwnProperty('variable')
                                        ) {
                                            const range = this.utils.arrayRange(
                                                repeatObject.start,
                                                repeatObject.end,
                                                repeatObject.skip || [],
                                            );

                                            valuePropKeys.forEach(
                                                (valueKey, _) => {
                                                    let value = valueObject[valueKey];

                                                    value = this.utils.isString(value)
                                                    && `${value}`.indexOf(`${repeatObject.variable}`) !== -1
                                                        ? value.replace(
                                                            `{${repeatObject.variable}}`,
                                                            this.utils.padding(
                                                                {
                                                                    v                : `${range[rowIndex]}`,
                                                                    isPrefix         : true,
                                                                    paddingNumber    : repeatObject.paddingNumber || 1,
                                                                    paddingCharacter : `${repeatObject.paddingCharacter}`,
                                                                }
                                                            )
                                                        )
                                                        : value;

                                                    value = !this.utils.isValueNotAvailable(value)
                                                        ? this.utils.statesValue(value)
                                                        : value;

                                                    valueObject[valueKey] = value;

                                                }
                                            );

                                        }

                                    }
                                );

                                return valueObject;
                            }
                        );

                    }

                    return repeatValues;
                };
                if (this.utils.isArray(this.data.values)) {
                    const newValues = [];
                    this.data.values.forEach(
                        (valueProps, _) => {
                            if (this.utils.isObject(valueProps)) {
                                if (valueProps.hasOwnProperty('repeats')) {
                                    if (
                                        this.utils.isArray(valueProps.repeats)
                                        && !this.utils.isArrayEmpty(valueProps.repeats)
                                    ) {
                                        let repeatsValues = funcRepeats(
                                            {
                                                valueProps    : valueProps,
                                                valuePropKeys : Object.keys(valueProps),
                                                repeatsObject : valueProps.repeats
                                            }
                                        );
                                        newValues.push(...repeatsValues);
                                    }

                                } else if (valueProps.hasOwnProperty('repeat')) {
                                    let repeatValues = funcRepeat(
                                        {
                                            valueProps    : valueProps,
                                            valuePropKeys : Object.keys(valueProps),
                                            repeatObject  : valueProps.repeat
                                        }
                                    );
                                    newValues.push(...repeatValues);
                                } else {
                                    newValues.push(valueProps);
                                }
                            }

                        }
                    );

                    this.data.values = newValues;
                }
            },

            getBetweenCharacters: (
                value,
                startChar,
                stopChar,
                charactersBetween
            ) => {
                value = !this.utils.isUndefined(charactersBetween)
                    ? charactersBetween
                    : value;
                let startPos = value.indexOf(startChar);
                let stopPos  = value.lastIndexOf(stopChar);
                let variables         = [];

                if ([startPos, stopPos].includes(-1)) {
                    return value;
                }

                startPos = startPos + 1;
                stopPos  = stopPos - startPos;

                charactersBetween = value.substr(startPos, stopPos);

                const hasChars = ![
                    charactersBetween.indexOf(startChar),
                    charactersBetween.lastIndexOf(stopChar),
                ].includes(-1);

                const fromRecursion = hasChars
                    ? this.utils.getBetweenCharacters(charactersBetween, startChar, stopChar)
                    : charactersBetween;

                this.utils.isArray(fromRecursion)
                    ? variables.push(...fromRecursion)
                    : variables.push(fromRecursion);

                return variables;
            },
            getDefaultVariables: value => {
                const stateValue = this.utils.statesValue(value);
                if (stateValue !== value)
                {
                    return stateValue;
                }

                const today = new Date();
                const defaultVariables = {
                    year  : today.getFullYear(),
                    month : today.getMonth() + 1,
                    day   : today.getDate(),
                };

                return Object.keys(defaultVariables).includes(value)
                    ? defaultVariables[value]
                    : value;
            },
            calculation: value => {
                const formula = this.utils.getBetweenCharacters(value, "{calc(", "}")[0] || '';
                let newFormula = formula.replace(`calc(`, '');

                newFormula = newFormula.substr(0, newFormula.length - 1);

                let replaceVariables = this.utils.getBetweenCharacters(formula, '{', '}');
                const replaces = {};
                if (!this.utils.isArray(replaceVariables)) {
                    replaceVariables = [replaceVariables];
                }

                replaceVariables.forEach(
                    v => replaces[v] = this.utils.getDefaultVariables(v)
                );

                Object.keys(replaces).forEach(
                    (replaceKey, _) => newFormula = newFormula.replace(
                        `{${replaceKey}}`,
                        replaces[replaceKey]
                    )
                );

                const subtractions = newFormula.split('-');
                const addingUp     = newFormula.split('+');

                let total = 0;
                if (subtractions.length > 1) {
                    subtractions.forEach(
                        (v, index) => {
                            v = Number(v);
                            total = index === 0 && total === 0
                                ? v
                                : Number(total) - v;

                        }
                    );
                }
                if (addingUp.length > 1) {
                    addingUp.forEach(
                        (v, index) => {
                            v = Number(v);
                            total = index === 0 && total === 0
                                ? v
                                : Number(total) - v;

                        }
                    );
                }

                return value.replace(`{${formula}}`, total);
            },
            stringVariables: value => {
                if (!this.utils.isString(value)) {
                    return value;
                }

                if (
                    value.includes('calc(')
                    && value.includes(')')
                )
                {
                    value = this.utils.calculation(value);
                }

                if (
                    value.includes('{')
                    && value.includes('}')
                ) {
                    const characters = this.utils.getBetweenCharacters(value, '{', '}');
                    if (this.utils.isArray(characters)) {
                        characters.forEach(
                            (char, _) => {
                                const replaceValue = this.utils.getDefaultVariables(char);
                                char               = `{${char}}`;

                                if (value.includes(char)) {
                                    value = value.replace(
                                        char,
                                        replaceValue
                                    );
                                }
                            }
                        );
                    }
                }

                return value;
            },
        };
    }

    render() {
        return html`
            <style>
                ${this.views.styling()}
                ${
                    this.props.summary.active
                        ? `
                            table {
                                border-collapse: collapse;
                            }
                        `
                        : ''
                }
            </style>
            <ha-card>
                <h1>${this.state.title}</h1>
                ${this.views.table()}
            </ha-card>
        `;
    }

    setConfig(state) {
        state = {...state};

        this.state  = state;
        const props = state.hasOwnProperty('props') && this.utils.isObject(state.props) && !this.utils.isObjectEmpty(state.props)
            ? state.props
            : {};
        const data = state.hasOwnProperty('data') && this.utils.isObject(state.data) && !this.utils.isObjectEmpty(state.data)
            ? state.data
            : {};
        const styling = props.hasOwnProperty('styling') && this.utils.isObject(props.styling) && !this.utils.isObjectEmpty(props.styling)
            ? props.styling
            : {};

        this.setProps = {
            summary: summary => {
                const isActive = this.utils.isObject(summary)
                    && !this.utils.isObjectEmpty(summary)
                    && summary.headers !== false;

                const title  = summary.hasOwnProperty('title') ? summary.title : '';
                let headers  = [];
                if (isActive) {
                    if (this.utils.isBool(summary.headers) && summary.headers) {
                        headers = Object.keys(data.headers);
                    } else if (this.utils.isString(summary.headers)) {
                        headers = summary.headers.indexOf(',') !== -1
                            ? summary.headers.split(',')
                            : [summary.headers];
                    }
                }

                return {
                    active      : isActive,
                    title       : isActive ? title : '',
                    headers     : isActive ? headers : [],
                    data        : {},
                    excludeRows : isActive && summary.hasOwnProperty('excludeRows') && this.utils.isArray(summary.excludeRows) ? summary.excludeRows : [],
                    fontWeight  : isActive && summary.hasOwnProperty('fontWeight') ? summary.fontWeight : 'normal',
                    borders     : isActive && summary.hasOwnProperty('borders') ? summary.borders : this.styling.borders,
                };
            },
        };

        this.styling = {
            ...this.styling,
            borders   : styling.borders || false,
            textAlign : styling.textAlign || {},
        };

        this.props = {
            ...this.props,
            summary              : this.setProps.summary(props.summary || {}),
            filters              : props.filters || false,
            not_available_values : props.not_available_values || [],
        };

        this.data = {
            ...this.data,
            headers : data.headers || [],
            values  : data.values || {},
        };

        this.views = {
            table   : () => {
                this.utils.fixRepeatValues();
                const headerKeys = Object.keys(this.data.headers);
                this.props.summary.data = {}; // to prevent infinite sum-up.
                const values = () => Object.values(this.data.values).map(
                    (valueObject, index) => {

                        return html`
                            <tr>
                                ${
                                    this.props.summary.active && this.utils.isString(this.props.summary.title)
                                            ? html`<td></td>`
                                            : ''
                                }
                                ${
                                    headerKeys.map(
                                        (key, valueIndex) => {
                                            const headerProps = this.data.headers[key];
                                            const valueProps  = headerProps.properties || {};
                                            let   value = this.utils.isObject(valueObject) && valueObject.hasOwnProperty(key)
                                                ? valueObject[key]
                                                : false;
                                            
                                            if (value !== false) {
                                                value = this.utils.statesValue(value);
                                                if (!this.utils.isValueNotAvailable(value)) {
                                                    if (this.props.summary.hasOwnProperty('data')) {
                                                        const valueIsNumeric = !isNaN(value);
                                                        if (
                                                            !this.props.summary.data.hasOwnProperty(key)
                                                            || (
                                                                this.utils.isObject(this.props.summary.data[key])
                                                                && Object.keys(this.props.summary.data[key]).length === 0
                                                            )
                                                        ) {
                                                            this.props.summary.data[key] = {
                                                                props    : valueProps,
                                                                isNumber : valueIsNumeric,
                                                                values   : [],
                                                                total    : valueIsNumeric ? 0 : '',
                                                            };
                                                        }

                                                        if (
                                                            this.utils.isObject(this.props.summary)
                                                            && this.props.summary.hasOwnProperty('excludeRows')
                                                            && (
                                                                this.utils.isArrayEmpty(this.props.summary.excludeRows)
                                                                || !this.props.summary.excludeRows.includes((index + 1))
                                                            )
                                                        ) {
                                                            this.props.summary.data[key].values.push(value);
    
                                                            if (
                                                                this.utils.isNumber(value)
                                                                && valueIsNumeric
                                                            ) {
                                                                this.props.summary.data[key].total = Number(this.props.summary.data[key].total) + Number(value);
                                                            }
                                                        }
                                                    }
                                                } else {
                                                    value = 'N/A';
                                                }
                                            }

                                            value = this.utils.isValueNotAvailable(value)
                                                ? 'N/A'
                                                : this.utils.setValueType(
                                                    {
                                                        v     : `${value}`,
                                                        props : valueProps,
                                                        index : valueIndex,
                                                    }
                                                );
                                            
                                            return html`
                                                <td class='${key}'>${value}</td>
                                            `;
                                        }
                                    )
                                }
                            </tr>
                        `;
                    }
                );

                return html`
                    <table>
                        <tbody>
                            <tr>
                                ${
                                    this.props.summary.active && this.utils.isString(this.props.summary.title)
                                            ? html`<td></td>`
                                            : ''
                                }
                                ${
                                    Object.keys(this.data.headers).map(
                                        (headerKey, _) => {
                                            let headerProps = this.data.headers[headerKey];
                                            if (this.utils.isArray(headerProps)) {
                                                headerProps = headerProps[0];
                                            }
                                            
                                            let title = this.utils.isObject(headerProps) && headerProps.hasOwnProperty('title')
                                                ? headerProps.title
                                                : `Unknown`;
                                            
                                            return html`
                                                <td class='header ${headerKey}'>
                                                    ${this.utils.stringVariables(title)}
                                                </td>
                                            `;
                                        }
                                    )
                                }
                            </tr>
                            ${values()}
                        </tbody>
                        ${this.views.summary()}
                    </table>
                `;
            },
            summary : () => {
                if (this.props.summary.active === false) {
                    return '';
                }

                const borders      = this.props.summary.borders;
                const bordersProps = {
                    value     : borders,
                    isBool    : this.utils.isBool(borders),
                    borders   : [],
                    available : ['top', 'left', 'right', 'bottom']
                };

                if (this.utils.isString(bordersProps.value)) {
                    bordersProps.borders = bordersProps.value.indexOf(',') !== -1
                        ? bordersProps.value.split(',')
                        : [bordersProps.value];
                } else if (bordersProps.isBool) {
                    bordersProps.borders = bordersProps.available;
                }

                if (this.utils.isArray(bordersProps.borders) && bordersProps.borders.length > 0) {
                    bordersProps.borders = bordersProps.borders.map(
                        (border, _) => bordersProps.available.includes(border) ? this.utils.borderProperties(border, bordersProps.isBool && !bordersProps.value) : null
                    );
                } else {
                    bordersProps.borders = [];
                }

                const summaryHeaders = this.props.summary.headers;
                const options = Object.keys(this.data.headers).map(
                    (header, index) => {
                        let value = summaryHeaders.includes(header)
                            ? this.props.summary.data[header]
                            : '';

                        if (
                            this.utils.isObject(value)
                            && value.hasOwnProperty('total')
                            && value.hasOwnProperty('props')
                        ) {
                            value = this.utils.setValueType(
                                {
                                    v     : `${value.total}`,
                                    props : value.props,
                                    index : index,
                                }
                            );
                        }

                        return html`<td class="${header}" style="${bordersProps.borders.join(' ')}">${value}</td>`;
                    }
                );
                const fontWeightOptions = [
                    'bold',
                    'bolder',
                    'normal',
                    '100',
                    '200',
                    '300',
                    '400',
                    '500',
                    '600',
                    '700',
                    '800',
                    '900',
                    'unset',
                ];

                const fontWeight = fontWeightOptions.includes(this.props.summary.fontWeight)
                    ? this.props.summary.fontWeight
                    : 'normal';

                return html`
                    <tbody style="font-weight:${fontWeight};">
                        <tr>
                            ${
                                this.utils.isString(this.props.summary.title)
                                    ? html`<td style="${bordersProps.borders.join(' ')}">${this.props.summary.title}</td>`
                                    : ''
                            }
                            ${options}
                        </tr>
                    </tbody>
                `;
            },
            styling: () => {
                const styleProps = Object.keys(this.styling).map(
                    (styleProp, _) => {
                        if (this.utils.isString(styleProp)) {
                            let styleProps = this.styling[styleProp] || '';

                            switch (styleProp.toLowerCase()) {
                                case 'borders':
                                    if (styleProps === true) {
                                        styleProps = 'top,left,right,bottom';
                                    }

                                    if (this.utils.isString(styleProps)) {
                                        styleProps = `${styleProps}`.indexOf(',') !== -1
                                            ? styleProps.split(',')
                                            : [styleProps];
                                    }

                                    const chosenBorders = this.utils.isArray(styleProps)
                                        ? styleProps.map((borderProp, _) => this.utils.borderProperties(borderProp))
                                        : [];

                                    return chosenBorders.length > 0
                                        ? `
                                            table tr td {
                                                ${chosenBorders.join(' ')}
                                            }
                                        `
                                        : '';
                                case 'textalign':
                                    if (this.utils.isObject(styleProps)) {
                                        styleProps = [styleProps];
                                    }

                                    if (this.utils.isArray(styleProps)) {
                                        const directions = [
                                            'center',
                                            'end',
                                            'inherit',
                                            'initial',
                                            'justify',
                                            'left',
                                            'right',
                                            'revert',
                                            'start',
                                            'unset',
                                        ];

                                        return styleProps.map(
                                            (styleProp, _) => {
                                                if (
                                                    !this.utils.isObject(styleProp)
                                                    || this.utils.isObjectEmpty(styleProp)
                                                    || !styleProp.hasOwnProperty('headers')
                                                    || this.utils.isArray(styleProp.headers)
                                                    || (this.utils.isBool(styleProp.headers) && !styleProp.headers)
                                                ) {
                                                    return '';
                                                }

                                                let headers = null;
                                                if (this.utils.isBool(styleProp.headers) && styleProp.headers) {
                                                    headers = Object.keys(this.data.headers);
                                                } else if (this.utils.isString(styleProp.headers)) {
                                                    headers = styleProp.headers.indexOf(',') !== -1
                                                        ? styleProp.headers.split(',')
                                                        : [styleProp.headers];
                                                } else {
                                                    return '';
                                                }

                                                headers = headers
                                                    .map((header, _) => {
                                                            if (!Object.keys(this.data.headers).includes(header)) {
                                                                return '';
                                                            }

                                                            return !styleProp.hasOwnProperty('alignHeaders') || styleProp.alignHeaders === true
                                                                ? `.${header}`
                                                                : `.${header}` + ':not(.header)';
                                                        }
                                                    )
                                                    .join(', ');

                                                if (
                                                    !styleProp.hasOwnProperty('direction')
                                                    || !directions.includes(styleProp.direction)
                                                ) {
                                                    return '';
                                                }

                                                return `
                                                    ${headers} {
                                                        text-align: ${styleProp.direction}
                                                    }
                                                `;

                                            }
                                        );
                                    }

                                    return '';
                                default:
                                    return '';
                            }
                        }

                        return '';
                    }
                );

                return html`
                    <style>
                        ${styleProps}
                    </style>
                `;
            },
        };
    }

    getCardSize() {
        return 5;
    }
}

customElements.define(
    "custom-table",
    CustomTable
);